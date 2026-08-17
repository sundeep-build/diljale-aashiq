"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRadio } from "./radio-provider";
import { usePresence } from "./use-presence";
import { useInstall, useServiceWorker } from "./use-install";
import { setMotion, useMotion } from "./use-motion";
import { cx } from "@/lib/utils";
import { BrokenHeart, Download, Rain } from "./icons";

const NAV = [
  { href: "#dial", label: "Dard-o-Meter" },
  { href: "#rotations", label: "Rotations" },
  { href: "#songs", label: "Songs" },
  { href: "#tapri", label: "Tapri Mode" },
  { href: "#dedicate", label: "Dedicate" },
];

export function TopBar() {
  const { started, isPaused } = useRadio();
  const { live } = usePresence();
  const { installed, canInstall, install } = useInstall();
  const motion = useMotion();
  const [clock, setClock] = useState<string | null>(null);

  useServiceWorker();

  // client-only: the server has no idea what time it is where you are, and a
  // mismatched clock is the classic hydration bug
  useEffect(() => {
    const tick = () =>
      setClock(
        new Date().toLocaleTimeString("en-IN", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      );
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const onAir = started && !isPaused;

  return (
    /* The bar is pinned over the rain, so a backdrop blur here is re-computed
       on every frame of an animation that never ends. It was `backdrop-blur-xl`
       (24px) over a 70% ink wash; a 90% wash on small screens gets to the same
       place for free, and the real blur is kept only from `md` up, where the
       device is likelier to have the headroom for it. */
    <header className="sticky top-0 z-40 border-b border-cream/10 bg-ink/90 md:bg-ink/70 md:backdrop-blur-md">
      <div className="page-w flex h-14 items-center gap-2 sm:h-16 sm:gap-3">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <span className="relative grid size-8 place-items-center">
            <BrokenHeart className="size-7 text-rose transition-transform group-hover:scale-110" />
            {onAir && (
              <span className="animate-pulse-ring absolute inset-0 rounded-full border border-rose" />
            )}
          </span>
          <span className="hidden font-display text-sm font-extrabold tracking-tight lg:block">
            Diljale Aashiq
          </span>
        </Link>

        {/* min-w-0 lets the chip row shrink instead of widening the header */}
        <nav className="hide-scrollbar -mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-muted transition-colors hover:bg-cream/8 hover:text-cream sm:px-3"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* live listeners — real, or hidden entirely if we can't measure it */}
          {live !== null && (
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-cream/12 px-2 py-1 text-[11px] tabular-nums text-muted sm:px-2.5"
              title="Abhi is waqt kitne log sun rahe hain"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              {live.toLocaleString("en-IN")}
              <span className="hidden sm:inline">listening</span>
            </span>
          )}

          <span
            className={`flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.14em] uppercase sm:px-2.5 sm:tracking-[0.18em] ${
              onAir
                ? "border-rose/50 bg-rose/12 text-rose-soft"
                : "border-cream/12 bg-cream/5 text-muted"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${onAir ? "animate-pulse bg-rose" : "bg-muted"}`}
            />
            {onAir ? "On Air" : "Off Air"}
          </span>

          {/* The weather is the page's biggest continuous power draw, and no
              web API reports that a device is running hot — so the switch is
              the visitor's. Defaults to off for anyone whose OS already asks
              for reduced motion or data saving. See use-motion.ts. */}
          <button
            onClick={() => setMotion(motion === "calm" ? "full" : "calm")}
            aria-pressed={motion === "calm"}
            aria-label={
              motion === "calm" ? "Baarish wapas chalu karo" : "Baarish band karo (battery bachao)"
            }
            title={
              motion === "calm"
                ? "Baarish band hai — battery bach rahi hai"
                : "Baarish band karo, battery bachao"
            }
            className={cx(
              "grid size-7 shrink-0 place-items-center rounded-full border transition sm:size-8",
              motion === "calm"
                ? "border-cream/12 text-muted hover:text-cream"
                : "border-rose/40 text-rose-soft hover:border-rose",
            )}
          >
            <Rain className="size-3.5" />
          </button>

          {canInstall && !installed && (
            <button
              onClick={install}
              aria-label="Install the app"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-rose px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-[0_6px_20px_-8px_var(--color-rose)] transition active:scale-95 sm:px-3.5"
            >
              <Download className="size-3.5" />
              <span className="hidden sm:inline">Install now</span>
            </button>
          )}

          <span
            className="hidden text-[11px] tabular-nums text-muted min-[420px]:block"
            suppressHydrationWarning
          >
            {clock ?? "--:--"}
          </span>
        </div>
      </div>
    </header>
  );
}
