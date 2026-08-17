"use client";

import { useRadio } from "./radio-provider";
import { fmtTime } from "@/lib/utils";
import { Pause, Play, YouTubeMusic } from "./icons";
import { PLAYLIST_URL } from "@/data/tracks";
import { PLAYER_BOX } from "@/lib/youtube-embed";

/** The player that sits under a shared dedication. */
export function DedicationPlayer({ accent }: { accent: string }) {
  const { attachHost, toggle, started, isPaused, position, duration, ready, failed, current } =
    useRadio();

  const playing = started && !isPaused;
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <div className="panel rounded-3xl p-5">
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          disabled={!ready && !failed}
          aria-label={playing ? "Rok do" : "Gaana chalao"}
          className="relative grid size-14 shrink-0 place-items-center rounded-full text-white transition active:scale-95 disabled:opacity-50"
          style={{ background: accent, boxShadow: `0 10px 34px -10px ${accent}` }}
        >
          {!ready && !failed ? (
            <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : playing ? (
            <Pause className="size-5" />
          ) : (
            <Play className="ml-0.5 size-6" />
          )}
          {playing && (
            <span
              className="animate-pulse-ring absolute inset-0 rounded-full border-2"
              style={{ borderColor: accent }}
            />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-semibold">
            {playing ? "Baj raha hai" : "Sunne ke liye dabao"}
          </p>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-cream/12">
            <div
              className="h-full rounded-full transition-[width] duration-300"
              style={{ width: `${progress * 100}%`, background: accent }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-muted">
            <span>{fmtTime(position)}</span>
            <span>{duration ? fmtTime(duration) : fmtTime(current?.duration ?? 0)}</span>
          </div>
        </div>
      </div>

      <div className="relative mt-4 border-t border-cream/10 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] text-muted">Audio via YouTube</span>
          <a
            href={PLAYLIST_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="flex items-center gap-1.5 text-[11px] text-rose-soft underline-offset-4 hover:underline"
          >
            <YouTubeMusic className="size-3.5 text-[#ff0033]" />
            Playlist →
          </a>
        </div>
        <div ref={attachHost} className={PLAYER_BOX} />
        {failed && (
          <p className="mt-2 text-[10px] text-rose-soft">
            Player load nahi hua — ad-blocker band karke refresh karo.
          </p>
        )}
      </div>
    </div>
  );
}
