"use client";

import { useEffect, useState } from "react";
import { useRadio, useRadioProgress } from "./radio-provider";
import { ROTATION_BY_SLUG } from "@/data/rotations";
import { cx } from "@/lib/utils";
import { Next, Pause, Play, Prev } from "./icons";

/**
 * Sticky mini-player. Appears once the console scrolls out of view so the
 * transport is always a thumb away on a phone.
 */
export function RadioBar() {
  const { current, started, isPaused, toggle, next, prev } = useRadio();
  const { position, duration } = useRadioProgress();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 520);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!current) return null;

  const rot = ROTATION_BY_SLUG[current.rotation];
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const playing = started && !isPaused;

  return (
    <div
      className={cx(
        "page-w sticky bottom-0 z-40 mt-auto pb-3 transition-all duration-400",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-24 opacity-0",
      )}
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="panel relative flex items-center gap-3 overflow-hidden rounded-2xl p-2 pr-3 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.9)]">
        {/* progress hairline across the top */}
        <span className="absolute inset-x-0 top-0 h-0.5 bg-cream/10">
          {/* scaleX rather than width — see the note on the hero scrubber */}
          <span
            className="block h-full origin-left transition-transform duration-300"
            style={{ transform: `scaleX(${progress})`, background: rot.from }}
          />
        </span>

        <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-ink-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.art} alt="" className="size-full object-cover" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-sm font-semibold">
            {current.title}
          </span>
          <span className="block truncate text-[11px] text-muted">{current.artists}</span>
        </span>

        <button
          onClick={prev}
          aria-label="Pichla gaana"
          className="hidden size-9 place-items-center rounded-full text-cream/70 transition hover:bg-cream/8 sm:grid"
        >
          <Prev className="size-4" />
        </button>

        <button
          onClick={toggle}
          aria-label={playing ? "Rok do" : "Chalao"}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-rose text-white transition active:scale-95"
        >
          {playing ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
        </button>

        <button
          onClick={next}
          aria-label="Agla gaana"
          className="grid size-9 shrink-0 place-items-center rounded-full text-cream/70 transition hover:bg-cream/8"
        >
          <Next className="size-4" />
        </button>
      </div>
    </div>
  );
}
