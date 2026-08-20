/**
 * "Aaj raat ka poster" — the session drawn as a story-ready card.
 *
 * This replaces the old thermal-receipt bill. A bill implies money, and this
 * station never charges anything, so a printed total was a joke that only
 * raised the wrong question. A poster is what the site already looks like —
 * signboard red on warm black — and it is the shape social apps actually want.
 *
 * Everything is drawn on a <canvas> the visitor can see, so the preview on the
 * page IS the exported file: one drawing routine, no second DOM mock-up to
 * keep in sync, no server render and no image-generation cost. Nothing here
 * touches the network — no album art, no remote fonts at draw time — so the
 * canvas is never tainted and `toBlob` always works.
 */

export type PosterFormat = "story" | "post";

/** The two shapes worth exporting: a full-screen story, and a feed post. */
export const POSTER_FORMATS = [
  { id: "story" as const, label: "Story", hint: "9:16", w: 1080, h: 1920 },
  { id: "post" as const, label: "Post", hint: "4:5", w: 1080, h: 1350 },
];

export type PosterData = {
  played: number;
  minutes: number;
  /** peak dard, 1-10 */
  dard: number;
  /** the Devanagari word for that level, from DARD_SCALE */
  deva: string;
  /** rotation display names, most recent first */
  rotations: string[];
  /** the song the poster signs off with */
  track: { title: string; artists: string } | null;
  verdict: string;
  /** the top rotation's colour — the poster re-tints itself around it */
  accent: string;
  /** where to send whoever sees the story */
  host: string;
  /** when the night was stamped — "20 AUG · 2:14 AM" */
  when: string;
};

/* ---------------------------------------------------------------- ink ---- */

const CREAM = "#f2e4c9";
const MUTED = "#a3866a";
const ROSE = "#c8381a";

type Family = { display: string; brush: string; body: string; deva: string };

/**
 * next/font generates the real family names at build time and hands them to
 * us as CSS variables on <html>, so the canvas has to read them back rather
 * than name a face itself — otherwise every string here silently falls back
 * to system sans and the poster stops looking like the site.
 */
function posterFonts(): Family {
  const css = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => {
    const v = css.getPropertyValue(name).trim();
    return v ? `${v}, ${fallback}` : fallback;
  };
  return {
    display: read("--font-bricolage", "ui-sans-serif, system-ui, sans-serif"),
    brush: read("--font-kalam", "cursive"),
    body: read("--font-dm-sans", "ui-sans-serif, system-ui, sans-serif"),
    deva: read("--font-noto-deva", "serif"),
  };
}

/**
 * Canvas does not wait for webfonts the way layout does — it draws with
 * whatever is resident at that instant. So the poster is drawn once
 * immediately (fallback faces, no blank frame) and again once these resolve.
 * The Devanagari face is `preload: false` sitewide, so asking for it by the
 * exact glyphs is what actually pulls it down.
 */
export async function loadPosterFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  const f = posterFonts();
  await Promise.all([
    document.fonts.load(`900 232px ${f.display}`),
    document.fonts.load(`800 72px ${f.display}`),
    document.fonts.load(`600 24px ${f.display}`),
    document.fonts.load(`700 92px ${f.brush}`),
    document.fonts.load(`italic 400 31px ${f.body}`),
    document.fonts.load(`400 26px ${f.body}`),
    document.fonts.load(`700 58px ${f.deva}`, "हल्कासायादेंभारीदिलआँसूतबाह"),
  ]).catch(() => {
    /* one missing face must not stop the poster from being drawn */
  });
}

/** The one line the poster signs off with. No totals, nothing to pay. */
export function posterVerdict(played: number, minutes: number, dard: number) {
  if (played === 0) return "Abhi tak kuch nahi suna. Dial ghumao, phir poster banega.";
  if (dard >= 9 && minutes >= 20) return "Halat kharab hai. Paani pi lo, phir sun lena.";
  if (dard >= 9) return "Seedha 9/10 pe gaye ho. Himmat hai.";
  if (minutes >= 45) return "Poori raat nikal gayi. Ab so jao.";
  if (minutes >= 15) return "Theek thaak chal raha hai. Ek aur gaana?";
  return "Abhi to shuruaat hai.";
}

/**
 * The date line along the top of the poster. Two of these are never quite the
 * same night, and 2:14 AM on the card is half of why anyone posts it.
 */
export function posterStamp(now: Date) {
  const date = now.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const time = now.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} · ${time}`.toUpperCase();
}

/** Pre-written words for whoever is posting this at 2am. */
export function posterCaption(d: PosterData) {
  const line = [`${d.played} gaane`, `${d.minutes} minute`, `dard ${d.dard}/10`].join(" · ");
  return `Aaj raat: ${line} 💔\nDiljale Aashiq — 24×7 dard ka radio\n${d.host}`;
}

/* ------------------------------------------------------------ helpers ---- */

function withAlpha(hex: string, a: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full.slice(0, 6), 16);
  if (!Number.isFinite(n)) return `rgba(200,56,26,${a})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** roundRect by hand — arcTo works everywhere, ctx.roundRect does not. */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Letter-spacing, measured and drawn per glyph: ctx.letterSpacing is Chrome-only. */
function trackedWidth(ctx: CanvasRenderingContext2D, text: string, spacing: number) {
  const chars = [...text];
  return chars.reduce((w, c) => w + ctx.measureText(c).width, 0) + spacing * Math.max(0, chars.length - 1);
}

function trackedAt(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, spacing: number) {
  let cursor = x;
  for (const c of [...text]) {
    ctx.fillText(c, cursor, y);
    cursor += ctx.measureText(c).width + spacing;
  }
}

function trackedCentre(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  spacing: number,
) {
  trackedAt(ctx, text, cx - trackedWidth(ctx, text, spacing) / 2, y, spacing);
}

function centre(ctx: CanvasRenderingContext2D, text: string, cx: number, y: number) {
  ctx.textAlign = "center";
  ctx.fillText(text, cx, y);
  ctx.textAlign = "left";
}

/** Clip a title that will not fit rather than letting it run off the card. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxW) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  return lines;
}

/** Seeded, so a redraw on the next song does not re-scatter the grain. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/* --------------------------------------------------------------- draw ---- */

type Block = {
  h: number;
  /** higher numbers are given up first when the format runs short of room */
  drop?: number;
  draw: (y: number) => void;
};

export function drawPoster(canvas: HTMLCanvasElement, d: PosterData, format: PosterFormat) {
  const spec = POSTER_FORMATS.find((p) => p.id === format) ?? POSTER_FORMATS[0];
  const W = spec.w;
  const H = spec.h;
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const f = posterFonts();
  /* the feed post is a third shorter than the story at the same width, so it
     runs the same composition at smaller type and gives up its optional rows */
  const compact = H / W < 1.5;
  const P = 88;
  const innerW = W - P * 2;
  const accent = d.accent || ROSE;
  const dard = Math.max(0, Math.min(10, d.dard));

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  background(ctx, W, H, accent);

  const blocks: Block[] = [];

  /* ---- the signboard ---- */
  {
    const wm = compact ? 76 : 92;
    const sub = compact ? 20 : 23;
    const eyebrow = compact ? 18 : 20;
    const wmH = wm * 1.04;
    const eyebrowH = d.when ? eyebrow * 1.2 + 20 : 0;
    blocks.push({
      h: eyebrowH + wmH + 26 + sub * 1.2,
      draw: (top) => {
        ctx.textBaseline = "top";
        if (d.when) {
          ctx.font = `600 ${eyebrow}px ${f.display}`;
          ctx.fillStyle = withAlpha(MUTED, 0.85);
          trackedCentre(ctx, d.when, W / 2, top, eyebrow * 0.5);
        }
        const y = top + eyebrowH;
        ctx.font = `700 ${wm}px ${f.brush}`;
        const one = "Diljale ";
        const two = "Aashiq";
        const w1 = ctx.measureText(one).width;
        const w2 = ctx.measureText(two).width;
        const x = (W - (w1 + w2)) / 2;
        ctx.fillStyle = ROSE;
        ctx.fillText(one, x, y);
        ctx.fillStyle = CREAM;
        ctx.fillText(two, x + w1, y);

        ctx.font = `600 ${sub}px ${f.display}`;
        ctx.fillStyle = MUTED;
        trackedCentre(ctx, "24 × 7  DARD KA RADIO", W / 2, y + wmH + 26, sub * 0.42);
      },
    });
  }

  /* ---- heartbeat rule, with the advisory sticker stamped at the end of it ---- */
  {
    /* The block is as tall as the sticker rather than as tall as the line, so
       the sticker lives inside the flow and cannot land on the number beside
       it — "10/10" is a lot wider than "7/10" and used to reach it. */
    const h = compact ? 84 : 104;
    blocks.push({
      h,
      draw: (y) => {
        const mid = y + h / 2;
        const end = stamp(ctx, f, W - P - 6, mid, compact) - 26;
        const c = (P + end) / 2;
        ctx.strokeStyle = withAlpha(accent, 0.75);
        ctx.lineWidth = 3.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(P, mid);
        ctx.lineTo(c - 130, mid);
        ctx.lineTo(c - 96, mid - 20);
        ctx.lineTo(c - 58, mid + 24);
        ctx.lineTo(c - 18, mid - 30);
        ctx.lineTo(c + 26, mid + 12);
        ctx.lineTo(c + 62, mid);
        ctx.lineTo(end, mid);
        ctx.stroke();
      },
    });
  }

  /* ---- the number everybody screenshots ---- */
  {
    const label = compact ? 20 : 22;
    const num = compact ? 176 : 236;
    const deva = compact ? 46 : 58;
    const meterH = compact ? 18 : 22;
    const numH = num * 0.82;
    const devaH = d.deva ? deva * 1.3 + 18 : 0;
    blocks.push({
      h: label * 1.2 + 22 + numH + devaH + 32 + meterH,
      draw: (y) => {
        ctx.textBaseline = "top";
        ctx.font = `600 ${label}px ${f.display}`;
        ctx.fillStyle = MUTED;
        trackedCentre(ctx, "AAJ RAAT KA DARD LEVEL", W / 2, y, label * 0.5);

        const top = y + label * 1.2 + 22;

        // the value, sized so "10/10" still sits on the centre line
        ctx.font = `900 ${num}px ${f.display}`;
        const big = String(dard);
        const bigW = ctx.measureText(big).width;
        ctx.font = `800 ${num * 0.3}px ${f.display}`;
        const restW = ctx.measureText("/10").width;
        let x = (W - (bigW + 12 + restW)) / 2;

        ctx.font = `900 ${num}px ${f.display}`;
        ctx.shadowColor = withAlpha(accent, 0.55);
        ctx.shadowBlur = 70;
        ctx.fillStyle = CREAM;
        ctx.fillText(big, x, top - num * 0.12);
        ctx.shadowBlur = 0;
        x += bigW + 12;
        ctx.font = `800 ${num * 0.3}px ${f.display}`;
        ctx.fillStyle = withAlpha(CREAM, 0.45);
        ctx.fillText("/10", x, top + numH - num * 0.34);

        if (d.deva) {
          ctx.font = `700 ${deva}px ${f.deva}`;
          ctx.fillStyle = accent;
          centre(ctx, d.deva, W / 2, top + numH + 18);
        }

        // ten blocks, lit up to where the night peaked
        const meterW = Math.round(innerW * 0.82);
        const gap = 9;
        const seg = (meterW - gap * 9) / 10;
        const my = top + numH + devaH + 32;
        for (let i = 0; i < 10; i++) {
          const sx = (W - meterW) / 2 + i * (seg + gap);
          rr(ctx, sx, my, seg, meterH, meterH / 2);
          if (i < dard) {
            const g = ctx.createLinearGradient(sx, 0, sx + seg, 0);
            g.addColorStop(0, withAlpha(accent, 0.85));
            g.addColorStop(1, ROSE);
            ctx.fillStyle = g;
          } else {
            ctx.fillStyle = withAlpha(CREAM, 0.1);
          }
          ctx.fill();
        }
      },
    });
  }

  /* ---- gaane / minute ---- */
  {
    const h = compact ? 150 : 176;
    const gap = 26;
    const tw = (innerW - gap) / 2;
    const tile = (x: number, y: number, value: string, label: string) => {
      rr(ctx, x, y, tw, h, 30);
      ctx.fillStyle = withAlpha(CREAM, 0.05);
      ctx.fill();
      ctx.strokeStyle = withAlpha(CREAM, 0.1);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textBaseline = "middle";
      ctx.font = `800 ${compact ? 64 : 74}px ${f.display}`;
      ctx.fillStyle = CREAM;
      centre(ctx, value, x + tw / 2, y + h * 0.42);

      ctx.textBaseline = "top";
      ctx.font = `600 ${compact ? 18 : 20}px ${f.display}`;
      ctx.fillStyle = MUTED;
      trackedCentre(ctx, label, x + tw / 2, y + h * 0.68, 6);
    };
    blocks.push({
      h,
      draw: (y) => {
        tile(P, y, String(d.played), "GAANE");
        tile(P + tw + gap, y, String(d.minutes), "MINUTE");
      },
    });
  }

  /* ---- the song it ended on ---- */
  if (d.track) {
    const h = compact ? 118 : 134;
    blocks.push({
      h,
      drop: 1,
      draw: (y) => {
        rr(ctx, P, y, innerW, h, 28);
        ctx.fillStyle = withAlpha(CREAM, 0.04);
        ctx.fill();
        ctx.strokeStyle = withAlpha(CREAM, 0.09);
        ctx.lineWidth = 2;
        ctx.stroke();

        rr(ctx, P + 26, y + 26, 7, h - 52, 4);
        ctx.fillStyle = accent;
        ctx.fill();

        const x = P + 56;
        const textW = innerW - 56 - 40;
        ctx.textBaseline = "top";
        ctx.font = `600 ${compact ? 16 : 18}px ${f.display}`;
        ctx.fillStyle = withAlpha(accent, 0.95);
        trackedAt(ctx, "AAKHRI GAANA", x, y + h * 0.19, 6);

        ctx.font = `700 ${compact ? 32 : 36}px ${f.display}`;
        ctx.fillStyle = CREAM;
        ctx.fillText(fit(ctx, d.track!.title, textW), x, y + h * 0.38);

        ctx.font = `400 ${compact ? 22 : 25}px ${f.body}`;
        ctx.fillStyle = MUTED;
        ctx.fillText(fit(ctx, d.track!.artists, textW), x, y + h * 0.68);
      },
    });
  }

  /* ---- rotations touched ---- */
  if (d.rotations.length) {
    const size = compact ? 22 : 25;
    const h = size * 2.5;
    ctx.font = `600 ${size}px ${f.display}`;
    const pad = 26;
    const gap = 14;
    const chips: { text: string; w: number }[] = [];
    let used = 0;
    for (const name of d.rotations.slice(0, 3)) {
      const w = ctx.measureText(name).width + pad * 2;
      if (used + w + (chips.length ? gap : 0) > innerW) break;
      used += w + (chips.length ? gap : 0);
      chips.push({ text: name, w });
    }
    if (chips.length) {
      blocks.push({
        h,
        drop: 2,
        draw: (y) => {
          ctx.font = `600 ${size}px ${f.display}`;
          let x = (W - used) / 2;
          for (const chip of chips) {
            rr(ctx, x, y, chip.w, h, h / 2);
            ctx.fillStyle = withAlpha(accent, 0.14);
            ctx.fill();
            ctx.strokeStyle = withAlpha(accent, 0.4);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.textBaseline = "middle";
            ctx.fillStyle = CREAM;
            centre(ctx, chip.text, x + chip.w / 2, y + h / 2);
            ctx.textBaseline = "top";
            x += chip.w + gap;
          }
        },
      });
    }
  }

  /* ---- the verdict ---- */
  {
    const size = compact ? 28 : 31;
    const pad = compact ? 36 : 44;
    ctx.font = `italic 400 ${size}px ${f.body}`;
    const lines = wrap(ctx, d.verdict, innerW - pad * 2 - 20, 3);
    const lh = size * 1.45;
    const h = pad * 2 + lines.length * lh;
    blocks.push({
      h,
      draw: (y) => {
        rr(ctx, P, y, innerW, h, 30);
        ctx.fillStyle = withAlpha(accent, 0.1);
        ctx.fill();
        ctx.strokeStyle = withAlpha(accent, 0.32);
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = `italic 400 ${size}px ${f.body}`;
        ctx.fillStyle = withAlpha(CREAM, 0.92);
        ctx.textBaseline = "top";
        lines.forEach((line, i) => centre(ctx, line, W / 2, y + pad + i * lh + (lh - size) / 2));
      },
    });
  }

  /* ---- where to go next ---- */
  {
    const host = compact ? 26 : 29;
    const tag = compact ? 17 : 19;
    const h = 30 + host * 1.25 + 20 + tag * 1.2;
    blocks.push({
      h,
      draw: (y) => {
        ctx.strokeStyle = withAlpha(CREAM, 0.18);
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 14]);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(P, y + 4);
        ctx.lineTo(W - P, y + 4);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.textBaseline = "top";
        ctx.font = `600 ${host}px ${f.display}`;
        ctx.fillStyle = CREAM;
        trackedCentre(ctx, d.host, W / 2, y + 30, 3);

        ctx.font = `600 ${tag}px ${f.display}`;
        ctx.fillStyle = MUTED;
        trackedCentre(ctx, "TUM BHI SUN LO", W / 2, y + 30 + host * 1.25 + 20, tag * 0.45);
      },
    });
  }

  /* ---- flow: drop what does not fit, then breathe into what is left ---- */
  const marginY = compact ? 86 : 112;
  const avail = H - marginY * 2;
  const minGap = compact ? 18 : 38;
  const maxGap = compact ? 46 : 96;

  const live = blocks.slice();
  const height = () => live.reduce((sum, b) => sum + b.h, 0);
  while (height() + minGap * (live.length - 1) > avail) {
    // give up the least essential row still standing; never the fixed ones
    let worst = -1;
    for (let i = 0; i < live.length; i++) {
      const drop = live[i].drop ?? 0;
      if (drop > 0 && (worst === -1 || drop > (live[worst].drop ?? 0))) worst = i;
    }
    if (worst === -1) break;
    live.splice(worst, 1);
  }

  const gaps = Math.max(1, live.length - 1);
  const gap = Math.max(minGap, Math.min(maxGap, (avail - height()) / gaps));
  let y = marginY + Math.max(0, (avail - (height() + gap * gaps)) / 2);
  for (const block of live) {
    block.draw(y);
    y += block.h + gap;
  }

  frame(ctx, W, H);
}

/* ---- the warm black everything sits on ---- */
function background(ctx: CanvasRenderingContext2D, W: number, H: number, accent: string) {
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#150e07");
  base.addColorStop(0.42, "#17100a");
  base.addColorStop(1, "#080602");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // the bulb over the counter, and the sign's red bouncing off the floor
  const top = ctx.createRadialGradient(W / 2, H * 0.2, 0, W / 2, H * 0.2, W * 0.9);
  top.addColorStop(0, withAlpha(accent, 0.26));
  top.addColorStop(1, withAlpha(accent, 0));
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H);

  const low = ctx.createRadialGradient(W * 0.5, H * 0.94, 0, W * 0.5, H * 0.94, W * 0.75);
  low.addColorStop(0, withAlpha(ROSE, 0.16));
  low.addColorStop(1, withAlpha(ROSE, 0));
  ctx.fillStyle = low;
  ctx.fillRect(0, 0, W, H);

  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // the same film grain the page wears, so the export matches the site
  const rand = rng(20250820);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = rand() > 0.5 ? "rgba(242,228,201,0.05)" : "rgba(0,0,0,0.16)";
    ctx.fillRect(rand() * W, rand() * H, 2, 2);
  }
}

/** the poster's own double border, drawn last so nothing paints over it */
function frame(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.strokeStyle = withAlpha(CREAM, 0.14);
  ctx.lineWidth = 2;
  rr(ctx, 34, 34, W - 68, H - 68, 34);
  ctx.stroke();
  ctx.strokeStyle = withAlpha(CREAM, 0.06);
  rr(ctx, 48, 48, W - 96, H - 96, 24);
  ctx.stroke();
}

/**
 * The joke advisory sticker, stamped crooked at the end of the rule.
 * Returns the leftmost x it occupies, so the rule can stop short of it.
 */
function stamp(
  ctx: CanvasRenderingContext2D,
  f: Family,
  right: number,
  cy: number,
  compact: boolean,
) {
  const s1 = compact ? 22 : 25;
  const s2 = compact ? 15 : 16;
  ctx.save();
  ctx.font = `800 ${s1}px ${f.display}`;
  const w1 = trackedWidth(ctx, "DARD ADVISORY", 2);
  ctx.font = `600 ${s2}px ${f.display}`;
  const w2 = trackedWidth(ctx, "EXPLICIT FEELINGS", 4);
  const boxW = Math.max(w1, w2) + 44;
  const boxH = compact ? 78 : 96;

  ctx.translate(right - boxW / 2, cy);
  ctx.rotate((-9 * Math.PI) / 180);
  ctx.strokeStyle = withAlpha(ROSE, 0.6);
  ctx.lineWidth = 4;
  rr(ctx, -boxW / 2, -boxH / 2, boxW, boxH, 10);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = withAlpha(ROSE, 0.35);
  rr(ctx, -boxW / 2 + 10, -boxH / 2 + 10, boxW - 20, boxH - 20, 6);
  ctx.stroke();

  ctx.textBaseline = "top";
  ctx.fillStyle = withAlpha(ROSE, 0.85);
  ctx.font = `800 ${s1}px ${f.display}`;
  trackedCentre(ctx, "DARD ADVISORY", 0, -boxH / 2 + (compact ? 18 : 24), 2);
  ctx.fillStyle = withAlpha(ROSE, 0.55);
  ctx.font = `600 ${s2}px ${f.display}`;
  trackedCentre(ctx, "EXPLICIT FEELINGS", 0, -boxH / 2 + (compact ? 46 : 58), 4);
  ctx.restore();
  // the 9° tilt swings the bottom-left corner out past the box itself
  return right - boxW - boxH * 0.16;
}
