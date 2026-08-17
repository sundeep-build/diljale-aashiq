import type { Track } from "@/data/tracks";
import { cx } from "@/lib/utils";
import { BrokenHeart } from "./icons";

/**
 * The dedication itself — rendered identically in the studio preview and on
 * the shared /d/[payload] page, so what you write is exactly what they see.
 */
export function DedicationCard({
  to,
  from,
  note,
  track,
  accent,
  compact = false,
}: {
  to: string;
  from: string;
  note: string;
  track: Track;
  accent: string;
  compact?: boolean;
}) {
  return (
    <article
      className="panel relative overflow-hidden rounded-3xl"
      style={{ boxShadow: `0 30px 90px -40px ${accent}` }}
    >
      {/* blurred album art as the backdrop */}
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={track.art}
          alt=""
          aria-hidden
          className="size-full scale-125 object-cover opacity-30 blur-2xl"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/85 to-ink" />
      </div>

      <div className={cx("relative", compact ? "p-6" : "p-7 sm:p-10")}>
        <div className="flex items-center gap-2">
          <span style={{ color: accent }}>
            <BrokenHeart className="size-4" />
          </span>
          <span className="text-[10px] tracking-[0.24em] text-muted uppercase">
            Diljale Aashiq · dedication
          </span>
        </div>

        <p className="mt-5 text-[11px] tracking-[0.2em] text-muted uppercase">
          Ye gaana
        </p>
        <h3
          className={cx(
            "font-deva mt-1 leading-tight font-bold break-words",
            compact ? "text-3xl" : "text-4xl sm:text-5xl",
          )}
          style={{ color: accent }}
        >
          {to}
        </h3>
        <p className="mt-1 text-[11px] tracking-[0.2em] text-muted uppercase">
          ke naam
        </p>

        <p
          className={cx(
            "mt-6 leading-relaxed whitespace-pre-line text-cream/90 italic",
            compact ? "text-sm" : "text-base sm:text-lg",
          )}
        >
          “{note}”
        </p>

        {from.trim() && (
          <p className="mt-4 text-right text-sm text-muted">
            — {from}
          </p>
        )}

        {/* the song */}
        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-cream/12 bg-ink/50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={track.art}
            alt=""
            width={120}
            height={120}
            className="size-14 shrink-0 rounded-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold">{track.title}</p>
            <p className="truncate text-[11px] text-muted">{track.artists}</p>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: `${accent}22`, color: accent }}
          >
            {track.dard}/10 dard
          </span>
        </div>
      </div>
    </article>
  );
}
