"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRadio } from "./radio-provider";
import { usePresence } from "./use-presence";
import { useInstall, useServiceWorker } from "./use-install";
import { setMotion, useMotion } from "./use-motion";
import { cx } from "@/lib/utils";
import { CONTACT_EMAIL } from "@/lib/site";
import { BrokenHeart, Close, Download, Menu, Rain } from "./icons";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const headerRef = useRef<HTMLElement | null>(null);

  useServiceWorker();

  /**
   * Everything that should close the mobile menu.
   *
   * Escape returns focus to the button that opened it, because otherwise focus
   * is left on a node that no longer exists and a keyboard user is dumped back
   * at the top of the document. Widening past `md` closes it too — the links
   * become the inline row again, and leaving a stale panel open over them is
   * the classic resize bug.
   */
  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };

    // matches the `md:` breakpoint the panel is hidden at
    const wide = window.matchMedia("(width >= 48rem)");
    const onWiden = () => {
      if (wide.matches) setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    wide.addEventListener("change", onWiden);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      wide.removeEventListener("change", onWiden);
    };
  }, [menuOpen]);

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
    <header
      ref={headerRef}
      className="sticky top-0 z-40 border-b border-cream/10 bg-ink/90 md:bg-ink/70 md:backdrop-blur-md"
    >
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

        {/* Desktop only. On a phone this was a horizontally scrolling chip row
            competing for width with the status chips beside it — the menu
            below holds the same links with room to read them.
            min-w-0 lets the row shrink instead of widening the header. */}
        <nav className="hide-scrollbar -mx-1 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 md:flex">
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

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2.5">
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
                ? "Baarish band hai"
                : "Baarish band karo"
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

          {/* the mobile way in to the same links the desktop row shows */}
          <button
            ref={menuButtonRef}
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Menu band karo" : "Menu kholo"}
            className={cx(
              "grid size-8 shrink-0 place-items-center rounded-full border transition md:hidden",
              menuOpen
                ? "border-rose/45 bg-rose/12 text-rose-soft"
                : "border-cream/12 text-cream/80 hover:border-cream/25 hover:text-cream",
            )}
          >
            {menuOpen ? <Close className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Absolutely positioned rather than in flow: the header is sticky, so a
          panel in flow would grow it and shove the whole page down every time
          the menu opened. */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          /* fully opaque, not a wash: the hero wordmark sits directly behind
             this and ghosted straight through a translucent panel */
          className="absolute inset-x-0 top-full border-b border-cream/10 bg-ink shadow-[0_24px_60px_-24px_rgba(0,0,0,0.95)] md:hidden"
        >
          <ul className="page-w flex flex-col py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-3 py-3 text-sm font-medium text-cream/85 transition-colors hover:bg-cream/8 hover:text-cream"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="mt-1 border-t border-cream/10 pt-2">
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                onClick={() => setMenuOpen(false)}
                className="block rounded-xl px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-cream/8 hover:text-cream"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
