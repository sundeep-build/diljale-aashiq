"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STANDALONE = "(display-mode: standalone)";

function subscribeStandalone(onChange: () => void) {
  const mq = window.matchMedia(STANDALONE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/**
 * Shared PWA install state, so the header button and the Install card can't
 * disagree about whether the app is installable.
 *
 * `beforeinstallprompt` fires once per page load, so it is captured in a
 * module-level variable too — whichever consumer mounts first stores it, and
 * everyone else reads it.
 */
let captured: InstallEvent | null = null;
const listeners = new Set<() => void>();
let wired = false;

function wire() {
  if (wired || typeof window === "undefined") return;
  wired = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    captured = e as InstallEvent;
    for (const fn of listeners) fn();
  });
  window.addEventListener("appinstalled", () => {
    captured = null;
    for (const fn of listeners) fn();
  });
}

export function useInstall() {
  const [, force] = useState(0);
  const [justInstalled, setJustInstalled] = useState(false);

  const standalone = useSyncExternalStore(
    subscribeStandalone,
    () => window.matchMedia(STANDALONE).matches,
    () => false,
  );

  useEffect(() => {
    wire();
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  useEffect(() => {
    const onInstalled = () => setJustInstalled(true);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  const install = useCallback(async () => {
    if (!captured) return;
    await captured.prompt();
    await captured.userChoice;
    captured = null;
    for (const fn of listeners) fn();
  }, []);

  return {
    installed: standalone || justInstalled,
    /** Chrome/Edge/Android only — iOS Safari never fires the event */
    canInstall: Boolean(captured),
    install,
  };
}

/** Registers the offline shell. Safe to call more than once. */
export function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is a bonus, never a blocker */
    });
  }, []);
}
