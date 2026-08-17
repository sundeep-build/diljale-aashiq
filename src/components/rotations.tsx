"use client";

import { ROTATIONS } from "@/data/rotations";
import { TRACKS } from "@/data/tracks";
import { useRadio } from "./radio-provider";
import { cx, pluralise } from "@/lib/utils";
import { Play } from "./icons";

export function Rotations() {
  const { playRotation, rotation, current, started, isPaused } = useRadio();

  return (
    <section
      id="rotations"
      className="relative z-10 page-w scroll-mt-20 py-10 sm:py-14"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="section-label">Rotations · रोटेशन</p>
          <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-4xl">
            Har mood ki apni cassette
          </h2>
          <p className="mt-1.5 text-xs text-muted/70 sm:text-sm">
            Six moods. Tap one and the station switches over.
          </p>
        </div>
        <span className="hidden shrink-0 text-xs text-muted lg:block">
          Tap karo, station wahin se chalu ho jayega
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ROTATIONS.map((r, i) => {
          const count = TRACKS.filter((t) => t.rotation === r.slug && t.playable).length;
          const live = rotation === r.slug || current?.rotation === r.slug;
          const playing = live && started && !isPaused;

          return (
            <button
              key={r.slug}
              onClick={() => playRotation(r.slug)}
              className={cx(
                "panel panel-hover animate-rise group relative overflow-hidden rounded-2xl p-5 text-left",
                live && "border-rose/45",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* mood wash */}
              <span
                className="pointer-events-none absolute -top-16 -right-12 size-40 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
                style={{ background: r.from }}
              />

              <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-deva text-2xl font-bold" style={{ color: r.from }}>
                    {r.deva}
                  </span>
                  <h3 className="mt-0.5 font-display text-lg font-bold">{r.name}</h3>
                </div>

                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full transition group-hover:scale-110"
                  style={{ background: `${r.from}22`, color: r.from }}
                >
                  {playing ? <Bars color={r.from} /> : <Play className="ml-0.5 size-4" />}
                </span>
              </div>

              <p className="relative mt-2 text-xs leading-relaxed text-muted">{r.blurb}</p>

              <p className="relative mt-4 text-[10px] tracking-[0.18em] text-muted/70 uppercase">
                {pluralise(count, "Song", "Songs")} in rotation
                {live && <span className="text-rose-soft"> · now playing</span>}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** three little equaliser bars, CSS-only */
function Bars({ color }: { color: string }) {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom rounded-full"
          style={{
            background: color,
            height: "100%",
            animation: `eq 0.9s ease-in-out ${i * 0.15}s infinite alternate`,
          }}
        />
      ))}
      <style>{`@keyframes eq { from { transform: scaleY(0.28) } to { transform: scaleY(1) } }`}</style>
    </span>
  );
}
