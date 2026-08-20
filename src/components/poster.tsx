"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useRadio } from "./radio-provider";
import { ROTATION_BY_SLUG, dardCopy } from "@/data/rotations";
import { cx } from "@/lib/utils";
import {
  POSTER_FORMATS,
  drawPoster,
  loadPosterFonts,
  posterCaption,
  posterStamp,
  posterVerdict,
  type PosterData,
  type PosterFormat,
} from "@/lib/poster";
import { Check, Copy, Download, Share } from "./icons";

/**
 * Whether the OS will take the poster off our hands. Read through
 * useSyncExternalStore rather than an effect so the server (and the first
 * hydrating render) agree on `false` and the real answer arrives without a
 * second render pass — same trick the radio provider uses for its visit seed.
 */
const noopSubscribe = () => () => {};
const hasShareSheet = () =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";

/**
 * "Aaj raat ka poster" — the session, as something worth posting.
 *
 * This section used to print a thermal receipt with a ₹0.00 total on it. The
 * station has never charged for anything, so the bill was a punchline that
 * mostly made people ask what the charge was for. What it is now is a poster
 * in the site's own colours, sized for a story or a feed post.
 *
 * The preview below is the export: it is the same <canvas> the share button
 * hands to the OS, so nothing can drift between what you see and what you
 * post. Drawing happens entirely on the device — no upload, no server render,
 * no image-generation cost.
 */
export function Poster() {
  const { stats, dard, current, started } = useRadio();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noteTimer = useRef<number | undefined>(undefined);

  const [format, setFormat] = useState<PosterFormat>("story");
  const [note, setNote] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canShare = useSyncExternalStore(noopSubscribe, hasShareSheet, () => false);
  const spec = POSTER_FORMATS.find((f) => f.id === format) ?? POSTER_FORMATS[0];
  const minutes = Math.max(0, Math.round(stats.listened / 60000));
  const peak = stats.peakDard || dard;

  const data = useMemo<PosterData>(() => {
    const top = stats.rotations[0];
    return {
      played: stats.played,
      minutes,
      dard: peak,
      deva: dardCopy(peak).deva,
      rotations: stats.rotations.slice(0, 3).map((r) => ROTATION_BY_SLUG[r].name),
      track: started && current ? { title: current.title, artists: current.artists } : null,
      verdict: posterVerdict(stats.played, minutes, peak),
      // the poster re-tints itself around whatever rotation the night lived in
      accent: top ? ROTATION_BY_SLUG[top].from : "#c8381a",
      host: typeof window === "undefined" ? "" : window.location.host,
      // filled in at draw time — see below
      when: "",
    };
  }, [current, minutes, peak, started, stats.played, stats.rotations]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    // the clock is read here rather than during render: a date in a memo is
    // impure, and the poster only needs it at the moment it is drawn
    if (canvas) drawPoster(canvas, { ...data, when: posterStamp(new Date()) }, format);
  }, [data, format]);

  // kept in a ref so the one-shot font effect below always calls the latest
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  });

  useEffect(() => {
    draw();
  }, [draw]);

  /* Draw once with whatever faces are resident, then again when ours land —
     canvas takes no part in font swapping, so without this the poster keeps
     the fallback metrics for the whole visit. */
  useEffect(() => {
    let alive = true;
    loadPosterFonts().then(() => {
      if (alive) drawRef.current();
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  const flash = (message: string) => {
    setNote(message);
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(null), 2800);
  };

  const fileName = `diljale-aashiq-${format}.jpg`;

  /* JPEG, not PNG: the poster is a photograph-like gradient wash with film
     grain over it, which PNG cannot compress — the same card is ~3MB as a PNG
     and ~250KB here, and every social app re-encodes it anyway. */
  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        resolve(null);
        return;
      }
      canvas.toBlob(resolve, "image/jpeg", 0.94);
    });

  const saveBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    // Safari needs the object URL to outlive the click it was handed to
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("Poster save ho gaya. Ab story pe daal do.");
  };

  const share = async () => {
    const blob = await toBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: blob.type });
    const payload = { files: [file], title: "Diljale Aashiq", text: posterCaption(data) };

    if (typeof navigator.canShare === "function" && navigator.canShare(payload)) {
      try {
        await navigator.share(payload);
        return;
      } catch (err) {
        // sheet dismissed — that is a decision, not a failure
        if ((err as DOMException)?.name === "AbortError") return;
      }
    }
    saveBlob(blob);
  };

  const save = async () => {
    const blob = await toBlob();
    if (blob) saveBlob(blob);
  };

  const copyCaption = async () => {
    const caption = posterCaption(data);
    try {
      await navigator.clipboard.writeText(caption);
    } catch {
      // clipboard is blocked inside some in-app browsers
      window.prompt("Caption copy karo:", caption);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
    flash("Caption copy ho gaya.");
  };

  return (
    <section
      id="poster"
      className="lazy-section relative z-10 page-w scroll-mt-20 py-10 sm:py-14"
    >
      <div className="panel grid gap-8 rounded-3xl p-5 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
        <div className="min-w-0">
          <p className="section-label">Story ke liye taiyaar</p>
          <h2 className="mt-3 font-display text-2xl leading-tight font-extrabold sm:text-4xl">
            Aaj raat ka <span className="text-rose">poster</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
            Jitna suna, utna poster pe chhap gaya — gaane, minute, aur kitna
            dard seha. Ek tap, aur seedha story pe.
          </p>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-muted/70">
            Your night as a share-ready card. Nothing to pay, nothing to sign
            up for — it is drawn on your phone and never leaves it.
          </p>

          <ul className="mt-6 flex flex-wrap gap-2">
            {[
              `${stats.played} gaane`,
              `${minutes} minute`,
              `dard ${peak}/10`,
              ...(data.rotations[0] ? [data.rotations[0]] : []),
            ].map((chip) => (
              <li
                key={chip}
                className="rounded-full border border-cream/12 bg-cream/5 px-3 py-1.5 text-xs tabular-nums text-cream/80"
              >
                {chip}
              </li>
            ))}
          </ul>

          <fieldset className="mt-6">
            <legend className="text-[11px] tracking-[0.18em] text-muted uppercase">
              Kahan daalna hai
            </legend>
            <div className="mt-2 inline-flex rounded-full border border-cream/12 bg-ink/50 p-1">
              {POSTER_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  aria-pressed={format === f.id}
                  className={cx(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                    format === f.id
                      ? "bg-rose text-white shadow-[0_6px_20px_-10px_var(--color-rose)]"
                      : "text-muted hover:text-cream",
                  )}
                >
                  {f.label}
                  <span className="ml-1.5 opacity-60">{f.hint}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={share}
              className="flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_var(--color-rose)] transition active:scale-95"
            >
              <Share className="size-4" />
              {canShare ? "Share karo" : "Poster download karo"}
            </button>

            {canShare && (
              <button
                onClick={save}
                className="flex items-center gap-2 rounded-full border border-cream/15 px-4 py-2.5 text-sm font-semibold text-cream/85 transition hover:border-rose/45 hover:text-cream active:scale-95"
              >
                <Download className="size-4" />
                Save
              </button>
            )}

            <button
              onClick={copyCaption}
              className="flex items-center gap-1.5 text-xs text-muted underline-offset-4 transition hover:text-cream hover:underline"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              Caption copy karo
            </button>
          </div>

          {/* one live region, so a screen reader hears the result of the tap */}
          <p aria-live="polite" className="mt-3 min-h-4 text-xs text-rose-soft">
            {note}
          </p>
        </div>

        {/* The preview IS the export — same canvas, same pixels. */}
        <div className="mx-auto w-full max-w-[16rem] sm:max-w-[17rem]">
          <canvas
            ref={canvasRef}
            width={spec.w}
            height={spec.h}
            role="img"
            aria-label={`Aaj raat ka poster: ${stats.played} gaane, ${minutes} minute, peak dard ${peak} out of 10. ${data.verdict}`}
            className="block h-auto w-full rounded-2xl ring-1 shadow-[0_40px_90px_-45px_rgba(0,0,0,1)] ring-cream/10"
          />
        </div>
      </div>
    </section>
  );
}
