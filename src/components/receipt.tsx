"use client";

import { useRef, useState } from "react";
import { useRadio } from "./radio-provider";
import { ROTATION_BY_SLUG } from "@/data/rotations";
import { Download } from "./icons";

/**
 * "Aaj raat ka hisaab" — the session prints itself as a thermal-style bill you
 * can save and post. Drawn on a <canvas>, so there's no server render and no
 * image-generation cost.
 */
export function Receipt() {
  const { stats, dard } = useRadio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [saved, setSaved] = useState(false);

  const minutes = Math.max(0, Math.round(stats.listened / 60000));
  const topRotations = stats.rotations.slice(0, 3).map((r) => ROTATION_BY_SLUG[r].name);
  const diagnosis = diagnose(stats.played, minutes, stats.peakDard || dard);

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawReceipt(canvas, {
      played: stats.played,
      minutes,
      peakDard: stats.peakDard || dard,
      rotations: topRotations,
      diagnosis,
    });
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "diljale-aashiq-bill.png";
      a.click();
      URL.revokeObjectURL(url);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2400);
    }, "image/png");
  };

  return (
    <section className="lazy-section relative z-10 page-w py-10 sm:py-14">
      <div className="panel grid gap-6 rounded-3xl p-5 sm:p-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <p className="section-label">Aaj raat ka hisaab</p>
          <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-4xl">
            Tumhara <span className="text-rose">bill</span> ban raha hai
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Jitna suna, utna likha ja raha hai. Jab mann bhar jaye, bill save
            karke story pe daal dena.
          </p>

          <dl className="mt-6 grid grid-cols-3 gap-3">
            <Stat label="Gaane" value={String(stats.played)} />
            <Stat label="Minute" value={String(minutes)} />
            <Stat label="Peak dard" value={`${stats.peakDard || dard}/10`} />
          </dl>

          {topRotations.length > 0 && (
            <p className="mt-4 text-xs text-muted">
              Rotations: <span className="text-cream/80">{topRotations.join(" · ")}</span>
            </p>
          )}

          <p className="mt-4 rounded-2xl border border-rose/25 bg-rose/8 px-4 py-3 text-sm text-rose-soft">
            {diagnosis}
          </p>

          <button
            onClick={save}
            className="mt-6 flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_var(--color-rose)] transition active:scale-95"
          >
            <Download className="size-4" />
            {saved ? "Save ho gaya" : "Bill download karo"}
          </button>
        </div>

        {/* on-screen paper preview */}
        <div className="mx-auto w-full max-w-[15rem]">
          <div className="rounded-lg bg-[#f4efe6] p-5 font-mono text-[11px] leading-relaxed text-[#1a1216] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.9)]">
            <p className="text-center font-bold tracking-[0.18em]">DILJALE AASHIQ</p>
            <p className="text-center text-[9px] tracking-wider">24×7 DARD KA RADIO</p>
            <p className="my-2 text-center">- - - - - - - - - - - -</p>
            <Row k="GAANE" v={String(stats.played)} />
            <Row k="MINUTE" v={String(minutes)} />
            <Row k="PEAK DARD" v={`${stats.peakDard || dard}/10`} />
            <Row k="ROTATION" v={topRotations[0] ?? "—"} />
            <p className="my-2 text-center">- - - - - - - - - - - -</p>
            <Row k="TOTAL" v="₹ 0.00" />
            <p className="mt-2 text-[9px] leading-snug">{diagnosis}</p>
            <p className="mt-3 text-center text-[9px] tracking-widest">
              *** DHANYAVAAD ***
            </p>
          </div>
        </div>
      </div>

      {/* off-screen render target */}
      <canvas ref={canvasRef} width={720} height={1120} className="hidden" />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-cream/4 px-3 py-3 text-center">
      <dd className="font-display text-2xl font-black tabular-nums">{value}</dd>
      <dt className="mt-0.5 text-[10px] tracking-[0.16em] text-muted uppercase">{label}</dt>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <p className="flex justify-between gap-2">
      <span>{k}</span>
      <span className="truncate font-bold">{v}</span>
    </p>
  );
}

function diagnose(played: number, minutes: number, peak: number) {
  if (played === 0) return "Abhi tak kuch nahi suna. Dial ghumao, shuru karo.";
  if (peak >= 9 && minutes >= 20) return "Halat kharab hai. Paani pi lo, phir sun lena.";
  if (peak >= 9) return "Seedha 9/10 pe gaye ho. Himmat hai.";
  if (minutes >= 45) return "Poori raat nikal gayi. Ab so jao.";
  if (minutes >= 15) return "Theek thaak chal raha hai. Aur ek gaana?";
  return "Abhi to shuruaat hai.";
}

/* --------------------------------------------------------------------- */

function drawReceipt(
  canvas: HTMLCanvasElement,
  d: {
    played: number;
    minutes: number;
    peakDard: number;
    rotations: string[];
    diagnosis: string;
  },
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(0, 0, W, H);

  // paper speckle
  ctx.fillStyle = "rgba(26,18,22,0.05)";
  for (let i = 0; i < 1400; i++) {
    ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
  }

  const ink = "#1a1216";
  const mono = '"Courier New", ui-monospace, monospace';
  let y = 96;

  const centre = (text: string, size: number, weight = "bold", spacing = 0) => {
    ctx.font = `${weight} ${size}px ${mono}`;
    ctx.fillStyle = ink;
    if (spacing) {
      const chars = [...text];
      const total =
        chars.reduce((w, c) => w + ctx.measureText(c).width, 0) + spacing * (chars.length - 1);
      let x = (W - total) / 2;
      for (const c of chars) {
        ctx.fillText(c, x, y);
        x += ctx.measureText(c).width + spacing;
      }
    } else {
      ctx.textAlign = "center";
      ctx.fillText(text, W / 2, y);
      ctx.textAlign = "left";
    }
  };

  const row = (k: string, v: string, size = 30) => {
    ctx.font = `${size}px ${mono}`;
    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.fillText(k, 64, y);
    ctx.textAlign = "right";
    ctx.font = `bold ${size}px ${mono}`;
    ctx.fillText(v, W - 64, y);
    ctx.textAlign = "left";
  };

  const rule = () => {
    ctx.strokeStyle = "rgba(26,18,22,0.35)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 10]);
    ctx.beginPath();
    ctx.moveTo(64, y);
    ctx.lineTo(W - 64, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  centre("DILJALE AASHIQ", 46, "bold", 4);
  y += 44;
  centre("24 x 7  DARD KA RADIO", 22, "normal", 3);
  y += 56;
  rule();
  y += 62;

  row("GAANE SUNE", String(d.played));
  y += 52;
  row("MINUTE BARBAAD", String(d.minutes));
  y += 52;
  row("PEAK DARD", `${d.peakDard}/10`);
  y += 52;
  row("ROTATION", d.rotations[0] ?? "-");
  y += 52;
  if (d.rotations[1]) {
    row("", d.rotations[1], 26);
    y += 46;
  }
  y += 14;
  rule();
  y += 62;

  row("TOTAL", "Rs. 0.00", 40);
  y += 44;
  ctx.font = `22px ${mono}`;
  ctx.fillStyle = "rgba(26,18,22,0.65)";
  ctx.fillText("(dard free hai, hamesha)", 64, y);
  y += 70;
  rule();
  y += 60;

  // wrapped diagnosis
  ctx.font = `26px ${mono}`;
  ctx.fillStyle = ink;
  for (const line of wrap(ctx, d.diagnosis, W - 128)) {
    ctx.fillText(line, 64, y);
    y += 38;
  }

  y = H - 190;
  rule();
  y += 66;
  centre("*** DHANYAVAAD ***", 28, "bold", 3);
  y += 52;
  centre("diljale-aashiq.vercel.app", 24, "normal", 2);

  // barcode-ish footer
  y += 44;
  ctx.fillStyle = ink;
  let x = 96;
  while (x < W - 96) {
    const w = 2 + Math.floor(Math.random() * 6);
    ctx.fillRect(x, y, w, 46);
    x += w + 3 + Math.floor(Math.random() * 6);
  }
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}
