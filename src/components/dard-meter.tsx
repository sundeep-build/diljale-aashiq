"use client";

import { useRadio } from "./radio-provider";
import { dardCopy } from "@/data/rotations";
import { cx } from "@/lib/utils";

/**
 * The station's one big idea: instead of picking a playlist, you tell the radio
 * how broken you are and it re-programs itself around that number.
 */
export function DardMeter() {
  const { dard, setDard, queue, next, started, start } = useRadio();
  const copy = dardCopy(dard);
  const pct = ((dard - 1) / 9) * 100;

  return (
    <section id="dial" className="relative z-10 page-w scroll-mt-20 py-10 sm:py-14">
      <div className="panel overflow-hidden rounded-3xl">
        <div className="grid gap-8 p-5 sm:p-10 md:grid-cols-[1.1fr_0.9fr]">
          {/* ---- the dial ---- */}
          <div>
            <p className="section-label">New feature · Dard-o-Meter</p>
            <h2 className="mt-3 font-display text-2xl leading-tight font-extrabold sm:text-4xl">
              Playlist mat chuno.
              <br />
              <span className="text-rose">Dard chuno.</span>
            </h2>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Har gaane ko ek dard level diya gaya hai — 1 se 10. Dial ghumao aur
              station usi ke hisaab se apni poori queue dobara bana lega.
            </p>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-muted/70">
              Every song is scored 1–10 for how much it hurts. Turn the dial and
              the station reprograms itself around that number.
            </p>

            <div className="mt-8">
              <div className="mb-3 flex items-end justify-between">
                <span
                  className="font-deva text-4xl leading-none font-bold text-rose neon-text sm:text-5xl"
                  aria-hidden
                >
                  {copy.deva}
                </span>
                <span className="font-display text-5xl leading-none font-black tabular-nums text-cream/90 sm:text-6xl">
                  {dard}
                  <span className="text-xl text-muted">/10</span>
                </span>
              </div>

              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={dard}
                onChange={(e) => setDard(Number(e.target.value))}
                aria-label="Dard level"
                className="dial"
                style={{
                  background: `linear-gradient(to right, var(--color-rose) ${pct}%, color-mix(in oklab, var(--color-cream) 14%, transparent) ${pct}%)`,
                }}
              />

              <div className="mt-2 flex justify-between text-[10px] tracking-wide text-muted uppercase">
                <span>Halka sa</span>
                <span>Poora tabaah</span>
              </div>

              <p className="mt-5 font-display text-lg font-bold text-cream sm:text-xl">
                “{copy.label}”
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  onClick={() => (started ? next() : start())}
                  className="rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_var(--color-rose)] transition active:scale-95"
                >
                  Play on this level
                </button>
                <span className="rounded-full border border-cream/12 px-4 py-2.5 text-xs text-muted">
                  {queue.length} Songs in queue
                </span>
              </div>
            </div>
          </div>

          {/* ---- the level ladder ---- */}
          <div className="relative">
            <div className="flex h-full flex-col justify-between gap-1.5">
              {Array.from({ length: 10 }, (_, i) => 10 - i).map((level) => {
                const active = level === dard;
                const within = Math.abs(level - dard) <= 1;
                return (
                  <button
                    key={level}
                    onClick={() => setDard(level)}
                    aria-label={`Dard level ${level}`}
                    aria-pressed={active}
                    className={cx(
                      "group flex items-center gap-3 rounded-xl px-3 py-2 text-left transition",
                      active ? "bg-rose/15" : "hover:bg-cream/6",
                    )}
                  >
                    <span
                      className={cx(
                        "w-6 shrink-0 text-right font-display text-sm font-bold tabular-nums",
                        active ? "text-rose" : within ? "text-cream/70" : "text-muted/50",
                      )}
                    >
                      {level}
                    </span>
                    <span
                      className="h-2 shrink-0 rounded-full transition-all duration-300"
                      style={{
                        width: `${26 + level * 6.6}%`,
                        background: active
                          ? "var(--color-rose)"
                          : `color-mix(in oklab, var(--color-rose) ${within ? 45 : 16}%, transparent)`,
                        boxShadow: active ? "0 0 18px var(--color-rose)" : undefined,
                      }}
                    />
                    <span
                      className={cx(
                        "min-w-0 flex-1 truncate text-[11px] transition-opacity",
                        active ? "text-cream/80" : "text-muted/0 group-hover:text-muted/70",
                      )}
                    >
                      {dardCopy(level).label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
