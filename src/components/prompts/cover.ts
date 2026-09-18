/**
 * A cover for every prompt card without shipping a single image: a mesh of two
 * radial gradients over a dark base, picked deterministically from the slug so
 * a card looks the same on every visit and on server and client alike.
 */

const PAIRS: [string, string][] = [
  ["#8b5cf6", "#ec4899"], // violet → pink
  ["#6366f1", "#22d3ee"], // indigo → cyan
  ["#f59e0b", "#ef4444"], // amber → red
  ["#10b981", "#3b82f6"], // emerald → blue
  ["#d946ef", "#f97316"], // fuchsia → orange
  ["#0ea5e9", "#a855f7"], // sky → purple
  ["#f43f5e", "#facc15"], // rose → yellow
  ["#14b8a6", "#8b5cf6"], // teal → violet
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function coverStyle(slug: string): React.CSSProperties {
  const h = hash(slug);
  const [a, b] = PAIRS[h % PAIRS.length];
  // shift the two light sources around so neighbouring cards don't match
  const ax = 15 + (h % 30);
  const bx = 60 + ((h >> 5) % 30);
  return {
    background: `radial-gradient(circle at ${ax}% 20%, ${a}cc, transparent 55%), radial-gradient(circle at ${bx}% 90%, ${b}b3, transparent 55%), #121216`,
  };
}
