"use client";

import { useEffect, useRef, useState } from "react";
import { Ambience, type LayerId } from "@/lib/ambience";
import { cx } from "@/lib/utils";
import { Cup, Fan, Rain, Train } from "./icons";

const LAYERS: {
  id: LayerId;
  name: string;
  deva: string;
  hint: string;
  Icon: (p: { className?: string }) => React.ReactElement;
  tint: string;
}[] = [
  { id: "baarish", name: "Baarish", deva: "बारिश", hint: "Chhat pe girti hui", Icon: Rain, tint: "#6a9cff" },
  { id: "tapri", name: "Chai Tapri", deva: "टपरी", hint: "Door se aati bakbak", Icon: Cup, tint: "#ffbe6b" },
  { id: "rail", name: "Raat ki Rail", deva: "रेल", hint: "Patri pe khatkhat", Icon: Train, tint: "#ff8a3d" },
  { id: "pankha", name: "Chhat ka Pankha", deva: "पंखा", hint: "Ghoomta hua, roz ki tarah", Icon: Fan, tint: "#00d5b0" },
];

const PRESETS: { name: string; deva: string; mix: Partial<Record<LayerId, number>> }[] = [
  { name: "Monsoon breakup", deva: "सावन", mix: { baarish: 0.6, pankha: 0.2 } },
  { name: "Tapri pe akela", deva: "अकेला", mix: { tapri: 0.55, baarish: 0.18 } },
  { name: "Last train home", deva: "आख़िरी रेल", mix: { rail: 0.5, baarish: 0.25 } },
  { name: "3am ceiling stare", deva: "छत", mix: { pankha: 0.55, tapri: 0.12 } },
];

/**
 * The site's second original idea: a background-noise mixer that runs on
 * synthesised audio, so it layers under the music without hosting a single file.
 */
export function TapriMode() {
  const engineRef = useRef<Ambience | null>(null);
  const [mix, setMix] = useState<Record<LayerId, number>>({
    baarish: 0,
    tapri: 0,
    rail: 0,
    pankha: 0,
  });

  useEffect(() => {
    const engine = new Ambience();
    engineRef.current = engine;
    return () => engine.dispose();
  }, []);

  const setLayer = (id: LayerId, value: number) => {
    setMix((m) => ({ ...m, [id]: value }));
    engineRef.current?.set(id, value);
  };

  const applyPreset = (preset: Partial<Record<LayerId, number>>) => {
    const next = { baarish: 0, tapri: 0, rail: 0, pankha: 0, ...preset };
    setMix(next);
    for (const layer of LAYERS) engineRef.current?.set(layer.id, next[layer.id]);
  };

  const anyOn = Object.values(mix).some((v) => v > 0);

  return (
    <section
      id="tapri"
      className="lazy-section relative z-10 page-w scroll-mt-20 py-10 sm:py-14"
    >
      <div className="panel overflow-hidden rounded-3xl p-5 sm:p-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-label">Naya feature · Tapri Mode</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-4xl">
              Song background me <span className="text-rose">apna mahaul</span> banao
            </h2>
            <p className="mt-2 max-w-lg text-xs leading-relaxed text-muted/70 sm:text-sm">
              Four ambient layers, generated live in your browser. No audio files
              are downloaded — it is all synthesised noise.
            </p>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              Baarish, tapri ki bakbak, guzarti rail, chhat ka pankha — sab
              browser mein hi banaye ja rahe hain. Koi audio file download nahi
              hoti, bas thoda sa shor jo gaane ke neeche baj jata hai.
            </p>
          </div>

          {anyOn && (
            <button
              onClick={() => applyPreset({})}
              className="rounded-full border border-cream/15 px-4 py-2 text-xs text-muted transition hover:border-rose/50 hover:text-cream"
            >
              Sab band karo
            </button>
          )}
        </div>

        {/* presets */}
        <div className="hide-scrollbar -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p.mix)}
              className="shrink-0 rounded-full border border-cream/12 px-3.5 py-1.5 text-xs whitespace-nowrap text-muted transition hover:border-rose/45 hover:text-cream"
            >
              <span className="font-deva mr-1.5 text-rose-soft">{p.deva}</span>
              {p.name}
            </button>
          ))}
        </div>

        {/* faders */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {LAYERS.map(({ id, name, deva, hint, Icon, tint }) => {
            const value = mix[id];
            const on = value > 0;
            return (
              <div
                key={id}
                className={cx(
                  "rounded-2xl border p-4 transition-colors",
                  on ? "border-cream/20 bg-cream/6" : "border-cream/10 bg-cream/2",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cx(
                      "grid size-10 shrink-0 place-items-center rounded-xl transition",
                      on && "animate-float",
                    )}
                    style={{
                      background: `${tint}1f`,
                      color: on ? tint : "var(--color-muted)",
                    }}
                  >
                    <Icon className="size-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm font-bold">
                      {name}{" "}
                      <span className="font-deva ml-1 text-xs font-normal text-muted">
                        {deva}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-muted">{hint}</p>
                  </div>

                  <span className="w-8 shrink-0 text-right text-[11px] tabular-nums text-muted">
                    {Math.round(value * 100)}
                  </span>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(value * 100)}
                  onChange={(e) => setLayer(id, Number(e.target.value) / 100)}
                  aria-label={`${name} volume`}
                  className="dial mt-4"
                  style={
                    {
                      background: `linear-gradient(to right, ${tint} ${value * 100}%, color-mix(in oklab, var(--color-cream) 14%, transparent) ${value * 100}%)`,
                      "--dial-thumb": tint,
                    } as React.CSSProperties
                  }
                />
              </div>
            );
          })}
        </div>

        <p className="mt-5 text-[11px] text-muted/70">
          Headphones lagao. Baaki, tumhe pata hai kya karna hai.
        </p>
      </div>
    </section>
  );
}
