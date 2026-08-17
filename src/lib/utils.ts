import type { Track } from "@/data/tracks";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** ms → m:ss */
export function fmtTime(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Deterministic shuffle. A seed keeps server and client agreeing during
 * hydration, and lets "re-tune the dial" produce a different order on demand.
 */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = items.slice();
  let s = seed >>> 0 || 1;
  const rand = () => {
    // xorshift32 — small, fast, good enough for a playlist
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The Dard-o-Meter's actual brain: score every track by how far its curated
 * dard level sits from where the listener parked the dial, keep the closest
 * ones, then shuffle so the same dial setting never plays the same order twice.
 */
export function tuneQueue(tracks: readonly Track[], level: number, seed: number): Track[] {
  const playable = tracks.filter((t) => t.playable);
  const scored = playable
    .map((t) => ({ t, gap: Math.abs(t.dard - level) }))
    .sort((a, b) => a.gap - b.gap);

  // widen the window until we have a queue worth calling a radio station
  let window = 1;
  let picked = scored.filter((s) => s.gap <= window);
  while (picked.length < 12 && window < 10) {
    window += 1;
    picked = scored.filter((s) => s.gap <= window);
  }

  return seededShuffle(
    picked.map((s) => s.t),
    seed + level * 7919,
  );
}

/** "3 songs in" style copy for the session strip. */
export function pluralise(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}
