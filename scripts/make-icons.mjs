/**
 * Generates the PWA icons as real PNGs with zero dependencies — pixels are
 * drawn by hand and packed with Node's built-in zlib. Keeps the repo free of
 * an image toolchain and the deploy free of an image service.
 *
 *   node scripts/make-icons.mjs
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "public");

/** implicit heart: (x²+y²-1)³ - x²y³ ≤ 0 */
function insideHeart(x, y) {
  const a = x * x + y * y - 1;
  return a * a * a - x * x * y * y * y <= 0;
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function render(size, { maskable }) {
  const px = Buffer.alloc(size * size * 4);
  const pad = maskable ? 0.52 : 0.68; // maskable icons need a safe zone
  const bgTop = [0x3a, 0x0f, 0x26];
  const bgBottom = [0x0a, 0x05, 0x08];
  const roseA = [0xff, 0x6b, 0x8f];
  const roseB = [0xff, 0x2f, 0x5e];

  for (let py = 0; py < size; py++) {
    for (let pxi = 0; pxi < size; pxi++) {
      const i = (py * size + pxi) * 4;

      // background: vertical wine gradient with a soft glow behind the heart
      const t = py / (size - 1);
      let [r, g, b] = mix(bgTop, bgBottom, Math.min(1, t * 1.25));
      const gx = (pxi / size - 0.5) * 2;
      const gy = (py / size - 0.45) * 2;
      const glow = Math.max(0, 1 - Math.sqrt(gx * gx + gy * gy) * 1.15);
      r = Math.min(255, r + glow * 90);
      g = Math.min(255, g + glow * 18);
      b = Math.min(255, b + glow * 40);

      // heart, sampled 2x2 for cheap anti-aliasing
      let cover = 0;
      for (const [ox, oy] of [
        [0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75],
      ]) {
        const nx = ((pxi + ox) / size - 0.5) / (pad * 0.5);
        // the implicit heart sits point-down, so flip y and lift it slightly
        const ny = -(((py + oy) / size - 0.47) / (pad * 0.5));
        const yy = ny * 1.1 - Math.abs(nx) * 0.0;
        if (insideHeart(nx * 1.02, yy - 0.05)) cover += 0.25;
      }

      if (cover > 0) {
        const [hr, hg, hb] = mix(roseA, roseB, py / (size - 1));
        r = Math.round(r + (hr - r) * cover);
        g = Math.round(g + (hg - g) * cover);
        b = Math.round(b + (hb - b) * cover);
      }

      // the crack: a jagged dark seam down the middle of the heart
      const cx = (pxi / size - 0.5) * 2;
      const cy = (py / size - 0.47) * 2;
      const seam = crackOffset(cy);
      if (cover > 0.5 && Math.abs(cx - seam) < 0.035 && cy > -0.55 && cy < 0.62) {
        [r, g, b] = bgBottom;
      }

      px[i] = r;
      px[i + 1] = g;
      px[i + 2] = b;
      px[i + 3] = 255;
    }
  }

  return encodePng(size, size, px);
}

/** zig-zag down the heart so the break reads as a break, not a slit */
function crackOffset(y) {
  const steps = [0.0, 0.075, -0.05, 0.09, -0.03, 0.06, -0.07];
  const idx = Math.floor(((y + 1) / 2) * (steps.length - 1));
  const clamped = Math.max(0, Math.min(steps.length - 2, idx));
  const frac = ((y + 1) / 2) * (steps.length - 1) - clamped;
  return steps[clamped] + (steps[clamped + 1] - steps[clamped]) * frac;
}

/* ---------------- minimal PNG encoder ---------------- */

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(width, height, rgba) {
  // one filter byte (0 = none) per scanline
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ---------------- write them out ---------------- */

fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, maskable: false },
  { file: "icon-512.png", size: 512, maskable: false },
  { file: "icon-maskable-512.png", size: 512, maskable: true },
  { file: "apple-icon.png", size: 180, maskable: false },
];

for (const t of targets) {
  const png = render(t.size, { maskable: t.maskable });
  fs.writeFileSync(path.join(outDir, t.file), png);
  console.log(`wrote public/${t.file} (${png.length} bytes)`);
}
