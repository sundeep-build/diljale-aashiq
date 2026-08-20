/**
 * Encodes the hero photograph — the Diljale Aashiq cassette shop — into the
 * responsive AVIF/WebP set the hero renders, plus the blurred placeholder that
 * holds its place until the real thing decodes.
 *
 *   node scripts/make-hero.mjs [path/to/source.png]
 *
 * The output is committed to public/hero, so a deploy never runs this and the
 * build needs no image toolchain. Re-run it only when the photograph changes.
 * sharp comes in with Next; it is a devDependency of this script alone.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, "..");
const outDir = path.join(root, "public", "hero");

/* The pristine master is a 2.5MB PNG and is deliberately not in git — see
   .gitignore. Falling back to the widest committed WebP means a fresh clone
   can still regenerate the ladder (to add a width, to re-tune quality) without
   it; only a re-encode from the original master is truly lossless. */
const candidates = [
  process.argv[2],
  path.join(root, "assets", "shop.png"),
  path.join(outDir, "shop-1721.webp"),
].filter(Boolean);

const src = candidates.find((p) => fs.existsSync(p));
if (!src) {
  console.error(`no source found. tried:\n${candidates.map((c) => `  ${c}`).join("\n")}`);
  console.error(`usage: node scripts/make-hero.mjs <source image>`);
  process.exit(1);
}

/* The rendered widths. The hero is full-bleed, so `sizes` is 100vw and the
   browser picks by viewport × DPR: 640 covers a phone at 2x, 1721 (the
   native width) covers a 2x laptop. Anything wider than the source would be
   upscaling, so the ladder stops there. */
const WIDTHS = [640, 960, 1280, 1721];

fs.mkdirSync(outDir, { recursive: true });

const base = sharp(src);
const meta = await base.metadata();
console.log(`source ${path.basename(src)} — ${meta.width}×${meta.height}`);

const rows = [];
for (const w of WIDTHS) {
  if (w > meta.width) continue;
  const resized = () => base.clone().resize(w, null, { fit: "inside", withoutEnlargement: true });

  /* Quality is set per format rather than shared: at equal quality numbers
     AVIF lands well under WebP, and this photograph is all soft gradient and
     film grain — exactly what AVIF handles better and WebP smears. */
  const avif = await resized().avif({ quality: 52, effort: 6 }).toBuffer();
  const webp = await resized().webp({ quality: 76, effort: 5 }).toBuffer();

  fs.writeFileSync(path.join(outDir, `shop-${w}.avif`), avif);
  fs.writeFileSync(path.join(outDir, `shop-${w}.webp`), webp);
  rows.push([w, avif.length, webp.length]);
}

/* ---------------------------------------------------------------- mobile --
   A phone viewport is about 0.46 wide-to-tall and the photograph is 1.88, so
   `object-fit: cover` over a full-height hero throws away three quarters of
   the frame — including most of the signboard, which is the whole point of
   the picture. The fix is a portrait framing shown in a shorter band at the
   top of the hero, so the shop front arrives whole.

   Cropping alone cannot get there: the tallest portrait crop available is the
   source's own 914px, and at the ~1150px width needed to hold the sign that
   is still only 0.80 the other way. So the frame is extended downward with a
   heavily blurred, darkened copy of its own lower half — warm ground with no
   directional smear, feathered in so the seam reads as depth of field rather
   than a join. The hero's gradient takes it the rest of the way to ink. */
const M = {
  left: 300,        // keeps the signboard (x 450-1330) with margin either side
  width: 1150,
  aspect: 0.8,      // the band's shape at a typical phone width
  feather: 140,     // overlap the fill fades in across
};
const mHeight = Math.round(M.width / M.aspect);
const seam = meta.height - M.feather;

const cropped = await base
  .clone()
  .extract({ left: M.left, top: 0, width: M.width, height: meta.height })
  .toBuffer();

/* The fill's alpha ramps from nothing to solid across the feather, so it
   arrives underneath the real photograph instead of butting against it. */
const ramp = Buffer.from(
  `<svg width="${M.width}" height="${mHeight - seam}">
     <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#fff" stop-opacity="0"/>
       <stop offset="${(M.feather / (mHeight - seam)).toFixed(4)}" stop-color="#fff" stop-opacity="1"/>
     </linearGradient></defs>
     <rect width="100%" height="100%" fill="url(#g)"/>
   </svg>`,
);

const fill = await sharp(cropped)
  // the lower half only: road, bench, the dark under the counter
  .extract({ left: 0, top: Math.round(meta.height / 2), width: M.width, height: Math.round(meta.height / 2) })
  .resize(M.width, mHeight - seam, { fit: "cover" })
  .blur(55)
  .modulate({ brightness: 0.44, saturation: 0.82 })
  .ensureAlpha()
  .composite([{ input: ramp, blend: "dest-in" }])
  .png()
  .toBuffer();

const portrait = await sharp({
  create: { width: M.width, height: mHeight, channels: 4, background: { r: 12, g: 9, b: 4, alpha: 1 } },
})
  .composite([
    { input: cropped, top: 0, left: 0 },
    { input: fill, top: seam, left: 0 },
  ])
  .png()
  .toBuffer();

const M_WIDTHS = [480, 720, 960, 1150];
const mRows = [];
for (const w of M_WIDTHS) {
  const resized = () => sharp(portrait).resize(w, null, { fit: "inside", withoutEnlargement: true });
  const avif = await resized().avif({ quality: 52, effort: 6 }).toBuffer();
  const webp = await resized().webp({ quality: 76, effort: 5 }).toBuffer();
  fs.writeFileSync(path.join(outDir, `shop-tall-${w}.avif`), avif);
  fs.writeFileSync(path.join(outDir, `shop-tall-${w}.webp`), webp);
  mRows.push([w, avif.length, webp.length]);
}
console.log(`\nportrait framing ${M.width}x${mHeight} (aspect ${(M.width / mHeight).toFixed(3)})`);

/* The placeholder: a 24px-wide WebP inlined as a data URI and scaled up under
   the real image, so the hero paints the right colours on the first frame
   instead of a black hole. Kept under ~1KB — past that it costs more in HTML
   than it saves in perceived load. */
const lqip = await base
  .clone()
  .resize(24)
  .blur(1.2)
  .webp({ quality: 42 })
  .toBuffer();
const dataUri = `data:image/webp;base64,${lqip.toString("base64")}`;
fs.writeFileSync(path.join(outDir, "shop-lqip.txt"), dataUri);

const kb = (n) => (n / 1024).toFixed(1).padStart(7) + " KB";
console.log("\n width      avif       webp");
for (const [w, a, b] of rows) console.log(String(w).padStart(6), kb(a), kb(b));
console.log("\n tall       avif       webp");
for (const [w, a, b] of mRows) console.log(String(w).padStart(6), kb(a), kb(b));
console.log(`\n lqip  ${kb(lqip.length)}  (${dataUri.length} chars, public/hero/shop-lqip.txt)`);
console.log(`\nwrote ${(rows.length + mRows.length) * 2 + 1} files to public/hero`);
