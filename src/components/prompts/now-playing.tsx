"use client";

import Link from "next/link";
import { useRadio, useRadioProgress } from "../radio-provider";
import { Next, Pause, Play } from "../icons";

/**
 * The radio, carried into /prompts. Only appears once the visitor has started
 * the station — someone who came here straight from search sees no player and
 * pays for none (see isQuietPage in radio-provider.tsx).
 *
 * Fixed, not sticky: prompt pages have their own footer and no <main> column
 * for a sticky bar to rest against. The spacer keeps the footer's last line
 * from hiding under it.
 */
export function NowPlaying() {
  const { current, started, isPaused, toggle, next } = useRadio();
  const { position, duration } = useRadioProgress();

  if (!started || !current) return null;

  const playing = !isPaused;
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;

  return (
    <>
      <div aria-hidden className="h-24" />
      <div
        className="fixed inset-x-0 bottom-0 z-40 px-3 sm:px-6"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div
          role="region"
          aria-label="Now playing on Diljale Aashiq radio"
          className="relative mx-auto flex max-w-xl items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 p-2 pr-2.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9)]"
        >
          {/* progress hairline — scaleX so a tick is a composite, not a layout */}
          <span className="absolute inset-x-0 top-0 h-0.5 bg-white/10">
            <span
              className="block h-full origin-left bg-linear-to-r from-violet-400 via-fuchsia-400 to-amber-300 transition-transform duration-300"
              style={{ transform: `scaleX(${progress})` }}
            />
          </span>

          <Link href="/" className="flex min-w-0 flex-1 items-center gap-3" title="Open the radio">
            <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.art} alt="" className="size-full object-cover" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">
                {current.title}
              </span>
              <span className="block truncate text-xs text-zinc-400">
                {playing ? "Playing" : "Paused"} · Diljale Aashiq radio
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-zinc-950 transition hover:bg-zinc-200 active:scale-95"
          >
            {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next song"
            className="grid size-9 shrink-0 place-items-center rounded-full text-zinc-300 transition hover:bg-white/10 hover:text-white"
          >
            <Next className="size-4" />
          </button>
        </div>
      </div>
    </>
  );
}
