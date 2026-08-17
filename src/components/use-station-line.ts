"use client";

import { useSyncExternalStore } from "react";

/**
 * The station line under the logo: "LUDHIANA · RAAT 2 BAJE · NON-STOP".
 *
 * Both halves are per-visitor:
 *   city — from /api/where (edge geo headers, city only, nothing stored)
 *   time — from the visitor's own device clock, bucketed into Hinglish
 *
 * Rendered through useSyncExternalStore so the server and the first client
 * render agree on the fallback, then it swaps to the real values. That avoids
 * the hydration mismatch you get from reading Date() or fetching during render.
 */

const HOME = "Jalandhar";

/* ---------------- city ---------------- */

let city = HOME;
let asked = false;
const citySubs = new Set<() => void>();

function loadCity() {
  if (asked) return;
  asked = true;
  fetch("/api/where", { cache: "no-store" })
    .then((r) => r.json())
    .then((d: { city?: unknown }) => {
      if (typeof d.city === "string" && d.city !== city) {
        city = d.city;
        for (const fn of citySubs) fn();
      }
    })
    .catch(() => {
      /* keep the home town */
    });
}

/* ---------------- clock ---------------- */

let clockTimer: number | null = null;
const clockSubs = new Set<() => void>();

/** 2 → "Raat 2 baje", 14 → "Dopahar 2 baje" */
function timeLabel(d: Date) {
  const h = d.getHours();
  const twelve = h % 12 === 0 ? 12 : h % 12;
  if (h >= 4 && h < 12) return `Subah ${twelve} baje`;
  if (h >= 12 && h < 16) return `Dopahar ${twelve} baje`;
  if (h >= 16 && h < 19) return `Shaam ${twelve} baje`;
  return `Raat ${twelve} baje`;
}

/* ---------------- store ---------------- */

function subscribe(cb: () => void) {
  citySubs.add(cb);
  clockSubs.add(cb);
  loadCity();

  if (clockTimer === null) {
    // once a minute is plenty; the label only changes on the hour
    clockTimer = window.setInterval(() => {
      for (const fn of clockSubs) fn();
    }, 60_000);
  }

  return () => {
    citySubs.delete(cb);
    clockSubs.delete(cb);
    if (clockSubs.size === 0 && clockTimer !== null) {
      window.clearInterval(clockTimer);
      clockTimer = null;
    }
  };
}

const SERVER_LINE = `${HOME} · Raat 2 baje · Non-stop`;

/**
 * Strings compare by value, so returning a freshly built one each call is safe
 * for useSyncExternalStore — it only re-renders when the text actually changes.
 */
function getSnapshot() {
  return `${city} · ${timeLabel(new Date())} · Non-stop`;
}

export function useStationLine() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_LINE);
}
