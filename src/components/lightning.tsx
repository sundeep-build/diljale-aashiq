"use client";

import { useEffect, useState } from "react";
import { storm, type Strike } from "@/lib/storm";
import { useMotion } from "./use-motion";

/**
 * Bijli. The visible half of the storm that lib/storm.ts runs over the whole
 * page — see that file for why the sky and the thunder share one clock.
 *
 * This component is a listener, not a scheduler. It draws whatever strike it
 * is handed and forgets it a second later; nothing here exists until the first
 * flash, so the page's first paint is untouched.
 *
 * It obeys the same performance rule as the backdrop: opacity only, and no
 * `filter` anywhere near an animating element. The bolt's glow is a second,
 * fatter, dimmer stroke rather than a drop-shadow, because a filter would pin
 * the whole thing to the CPU for every frame of every stroke.
 */

/** how long a flash element stays mounted, in ms — matches the keyframes */
const NEAR_MS = 900;
const FAR_MS = 1500;

/** the bolt dissolves rather than stopping dead — see the note where it is used */
const TAPER = "linear-gradient(to bottom, black 0 46%, transparent 92%)";

type Flash = Strike & {
  /** where in the sky it came down, as a % of viewport width */
  x: number;
  /** the channel, if it is close enough to see one */
  path: string;
};

export function Lightning() {
  const motion = useMotion();
  const [flashes, setFlashes] = useState<Flash[]>([]);

  useEffect(() => {
    // Calm mode takes the weather out of the document entirely, and the storm
    // stops with it: someone who has asked the rain to stop has not asked for
    // thunder instead. Not subscribing is what stops it — see storm.watch.
    if (motion === "calm") return;

    const timers = new Set<number>();

    const off = storm.watch((s) => {
      const x = 8 + Math.random() * 84;
      setFlashes((f) => [...f, { ...s, x, path: s.bolt ? channel() : "" }]);

      const timer = window.setTimeout(
        () => {
          timers.delete(timer);
          setFlashes((f) => f.filter((old) => old.id !== s.id));
        },
        s.bolt ? NEAR_MS : FAR_MS,
      );
      timers.add(timer);
    });

    return () => {
      off();
      for (const t of timers) window.clearTimeout(t);
      setFlashes([]);
    };
  }, [motion]);

  if (motion === "calm" || flashes.length === 0) return null;

  return (
    <div className="weather pointer-events-none fixed inset-0 z-30" aria-hidden>
      {flashes.map((s) => (
        <Bijli key={s.id} strike={s} />
      ))}
    </div>
  );
}

function Bijli({ strike: s }: { strike: Flash }) {
  const ms = s.bolt ? NEAR_MS : FAR_MS;
  const anim = `${s.bolt ? "lightning-near" : "lightning-far"} ${ms}ms ease-out forwards`;

  return (
    <>
      {/* The sky itself, lit from wherever the strike came down. Cold blue —
          the whole scene is sodium-orange, and the contrast is what makes the
          flash read as lightning rather than a lamp flickering. */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0,
          animation: anim,
          background: `radial-gradient(115% 78% at ${s.x.toFixed(1)}% -12%,
            rgba(214,232,255,${(s.brightness * 0.5).toFixed(3)}) 0%,
            rgba(158,190,236,${(s.brightness * 0.22).toFixed(3)}) 34%,
            rgba(96,124,170,${(s.brightness * 0.08).toFixed(3)}) 62%,
            transparent 84%)`,
        }}
      />

      {/* A near strike lights the street too, not just the clouds above it. */}
      {s.bolt && (
        <div
          className="absolute inset-0"
          style={{
            opacity: 0,
            animation: anim,
            background: `rgba(226,238,255,${(s.brightness * 0.15).toFixed(3)})`,
          }}
        />
      )}

      {s.path && (
        <svg
          className="absolute top-0"
          style={{
            left: `${s.x.toFixed(1)}%`,
            // sized in vh both ways so the channel keeps its proportions on
            // any screen — the viewBox is stretched to fit, and a box whose
            // aspect ratio never changes is the cheapest way to control that
            width: "30vh",
            height: "46vh",
            transform: "translateX(-50%)",
            opacity: 0,
            animation: `bolt ${ms}ms ease-out forwards`,
            // A channel that just stops mid-frame reads as a scratch on the
            // print. Fading it out is also true to the thing: what you see is
            // the brightest part of a strike, not its whole length.
            maskImage: TAPER,
            WebkitMaskImage: TAPER,
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          fill="none"
        >
          {/* Three passes: the lit air around the channel, the channel's
              halo, then the channel itself. This is what a drop-shadow would
              have done, done as geometry instead — a `filter` on an element
              whose opacity is animating costs a full re-raster per frame. */}
          {[
            ["rgba(150,190,255,0.3)", 10],
            ["rgba(205,228,255,0.55)", 3.6],
            ["rgba(244,250,255,0.98)", 1.7],
          ].map(([stroke, width]) => (
            <path
              key={width}
              d={s.path}
              stroke={stroke as string}
              strokeWidth={width as number}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      )}
    </>
  );
}

/**
 * One lightning channel, drawn in the 100x100 viewBox above.
 *
 * A bolt is not a zigzag with even teeth — it is a stepped leader, so the
 * jumps are uneven and it throws off branches that die partway down. Two
 * details do most of the work: the segments get longer as it descends (the
 * channel accelerates), and every fork points the same general way as the
 * step it left, so the branches look like they belong to the same strike.
 */
function channel() {
  const seg = 7 + Math.floor(Math.random() * 4);
  const parts: string[] = [];

  let x = 44 + Math.random() * 12;
  let y = 0;
  let d = `M ${x.toFixed(1)} 0`;

  for (let i = 0; i < seg; i++) {
    const t = i / seg;
    const jump = (Math.random() * 2 - 1) * (16 - t * 9);
    x = Math.max(4, Math.min(96, x + jump));
    y += (72 / seg) * (0.5 + t * 1.1);
    d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`;

    // a branch off roughly every third step, once the leader is well clear
    // of the cloud base and there is somewhere for it to go
    if (i > 1 && i < seg - 1 && Math.random() < 0.35) {
      const bx = x + jump * (0.8 + Math.random());
      const by = y + (10 + Math.random() * 16);
      parts.push(`M ${x.toFixed(1)} ${y.toFixed(1)} L ${bx.toFixed(1)} ${by.toFixed(1)}`);
    }
  }

  return [d, ...parts].join(" ");
}
