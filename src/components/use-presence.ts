"use client";

import { useSyncExternalStore } from "react";

/**
 * Real listener count, shared across the whole page.
 *
 * Deliberately a module-level singleton: one browser tab is one listener, so
 * there must be exactly one session id and one heartbeat no matter how many
 * components show the number. (Two independent hooks meant one tab counted as
 * two people.)
 *
 * Returns `live` (people listening right now) and `total` (unique listeners
 * ever). Either is null when it cannot be measured — callers hide that counter
 * rather than showing a number for something that was never measured.
 *
 * NOTE — DISPLAY OFFSET: both numbers have LISTENER_OFFSET added before they
 * leave this hook, so what the page shows is not the measured value. This is a
 * deliberate product decision by the site owner, not a bug and not a
 * measurement artefact. The raw, true values are untouched at
 * /api/presence — read that endpoint for anything that needs the real count.
 * Set NEXT_PUBLIC_LISTENER_OFFSET=0 to show the true numbers.
 */

const HEARTBEAT_MS = 20_000; // comfortably inside the server's 45s window

/**
 * Added to both counts purely for display. 100 by default.
 *
 * Applied to `total` as well as `live` — otherwise the page could claim more
 * people are listening right now than have ever listened, which is impossible
 * and the first thing anyone would notice.
 */
export const LISTENER_OFFSET = Number(
  process.env.NEXT_PUBLIC_LISTENER_OFFSET ?? 100,
);

/** anonymous, per-tab, forgotten when the tab closes */
const sessionId =
  Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

export type Presence = { live: number | null; total: number | null };

let snapshot: Presence = { live: null, total: null };
let timer: number | null = null;
const subscribers = new Set<() => void>();

function emit() {
  for (const fn of subscribers) fn();
}

const num = (v: unknown) => (typeof v === "number" ? v : null);

async function beat() {
  let next: Presence = { live: null, total: null };
  try {
    const res = await fetch("/api/presence", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: sessionId }),
      cache: "no-store",
    });
    const data = (await res.json()) as { live?: unknown; total?: unknown };
    next = { live: num(data.live), total: num(data.total) };
  } catch {
    /* leave next as nulls — the UI hides both counters */
  }

  // identity matters: useSyncExternalStore re-renders on every new object
  if (next.live !== snapshot.live || next.total !== snapshot.total) {
    snapshot = next;
    emit();
  }
}

function onVisible() {
  // a backgrounded tab stops firing timers; catch up as soon as it returns
  if (document.visibilityState === "visible") void beat();
}

function start() {
  if (timer !== null) return;
  void beat();
  timer = window.setInterval(beat, HEARTBEAT_MS);
  document.addEventListener("visibilitychange", onVisible);
}

function stop() {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
  document.removeEventListener("visibilitychange", onVisible);
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  start();
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) stop();
  };
}

const EMPTY: Presence = { live: null, total: null };

/** null stays null — an unmeasured count must not become the offset itself */
const offset = (n: number | null) =>
  n === null ? null : n + (Number.isFinite(LISTENER_OFFSET) ? LISTENER_OFFSET : 0);

/**
 * Cached so the object identity is stable between renders — useSyncExternalStore
 * re-renders forever if getSnapshot returns a fresh object each time.
 */
let displayed: Presence = EMPTY;
let displayedFrom: Presence = EMPTY;

function getDisplaySnapshot(): Presence {
  if (snapshot !== displayedFrom) {
    displayedFrom = snapshot;
    displayed = { live: offset(snapshot.live), total: offset(snapshot.total) };
  }
  return displayed;
}

export function usePresence(): Presence {
  return useSyncExternalStore(subscribe, getDisplaySnapshot, () => EMPTY);
}
