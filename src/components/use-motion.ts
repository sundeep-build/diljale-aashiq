"use client";

import { useSyncExternalStore } from "react";

/**
 * How much weather the station is allowed to run.
 *
 * The backdrop is the most expensive thing on the page by a wide margin: an
 * always-on animation measured at roughly 8% of a desktop CPU, forever,
 * whether or not anyone is looking at it. On a phone that is a warm device and
 * a flat battery, and there is no web API that tells us a machine is running
 * hot — so this gives the visitor the switch instead, and picks a sensible
 * default on their behalf.
 *
 * Two independent controls, both expressed as attributes on <html> so the CSS
 * does the work and no component has to re-render to change anything:
 *
 *   data-motion="calm"  — the visitor (or their OS preference) wants the rain
 *                         to stop. Persisted, so it survives a reload.
 *   data-idle="true"    — the tab is in the background. Browsers throttle
 *                         timers but keep compositor animations running, so a
 *                         backgrounded tab happily animates rain at full rate
 *                         behind whatever the visitor is actually doing.
 *
 * Deliberately a module-level singleton in the same shape as use-presence:
 * one listener for the whole page no matter how many components read it.
 */

const KEY = "diljale:motion";

export type MotionMode = "full" | "calm";

let mode: MotionMode = "full";
let started = false;
const subscribers = new Set<() => void>();

function emit() {
  for (const fn of subscribers) fn();
}

/**
 * Whether to start calm without being asked.
 *
 * The first two are the visitor telling us directly. The third is the case
 * they cannot tell us about: a budget phone, where the weather is the
 * difference between a warm handset and a comfortable one. Four cores or less
 * and 4GB or less is the usual dividing line for a low-end device, and both
 * hints are absent on desktop Safari and Firefox — so a missing value is
 * treated as "not low-end" and the visitor keeps the full scene.
 */
function systemPrefersCalm() {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };

  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const saveData = nav.connection?.saveData === true;

  const cores = nav.hardwareConcurrency;
  const memory = nav.deviceMemory;
  const lowEnd =
    (typeof cores === "number" && cores > 0 && cores <= 4) ||
    (typeof memory === "number" && memory > 0 && memory <= 4);

  return reduced || saveData || lowEnd;
}

function paint() {
  document.documentElement.dataset.motion = mode;
}

function onVisibility() {
  // `true` only while genuinely hidden — see the CSS rule in globals.css
  document.documentElement.dataset.idle = document.hidden ? "true" : "false";
}

function start() {
  if (started) return;
  started = true;

  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(KEY);
  } catch {
    /* Safari private mode throws on localStorage — fall through to the default */
  }
  mode = stored === "calm" || stored === "full" ? stored : systemPrefersCalm() ? "calm" : "full";

  paint();
  onVisibility();
  document.addEventListener("visibilitychange", onVisibility);
}

function subscribe(cb: () => void) {
  start();
  subscribers.add(cb);
  return () => {
    subscribers.delete(cb);
  };
}

export function setMotion(next: MotionMode) {
  if (mode === next) return;
  mode = next;
  paint();
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* not being able to remember it is not a reason to refuse to do it */
  }
  emit();
}

/**
 * The server always renders "full": it cannot know the visitor's preference,
 * and useSyncExternalStore's server snapshot is the supported way to let the
 * client disagree straight after hydration without a mismatch.
 */
export function useMotion(): MotionMode {
  return useSyncExternalStore(
    subscribe,
    () => mode,
    () => "full" as const,
  );
}
