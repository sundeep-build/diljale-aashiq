import { TRACKS, type Track } from "@/data/tracks";

/**
 * A dedication lives entirely inside its own URL — there is no database, no
 * Vercel KV, no row to pay for. Encode → /d/<payload>, decode on render.
 * That keeps the whole feature on Vercel's free tier and makes every
 * dedication permanently shareable on WhatsApp without an account.
 */
export type Dedication = {
  /** who it's for */
  to: string;
  /** who it's from — optional, "gumnaam" if blank */
  from: string;
  /** the note, capped so URLs stay WhatsApp-friendly */
  note: string;
  /** YouTube video id from our playlist */
  trackId: string;
};

export const LIMITS = { to: 28, from: 28, note: 160 } as const;

function toUrlSafe(b64: string) {
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromUrlSafe(s: string) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return b64 + "=".repeat((4 - (b64.length % 4)) % 4);
}

/** Unicode-safe base64 — the notes are full of Hindi, emoji and 💔. */
function b64encode(text: string) {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return toUrlSafe(btoa(bin));
}

function b64decode(payload: string) {
  const bin = atob(fromUrlSafe(payload));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeDedication(d: Dedication): string {
  // short keys keep the URL short enough to paste into a status
  const packed = [
    d.to.slice(0, LIMITS.to),
    d.from.slice(0, LIMITS.from),
    d.note.slice(0, LIMITS.note),
    d.trackId,
  ];
  return b64encode(JSON.stringify(packed));
}

export function decodeDedication(
  payload: string,
): (Dedication & { track: Track }) | null {
  try {
    const parsed: unknown = JSON.parse(b64decode(payload));
    if (!Array.isArray(parsed) || parsed.length !== 4) return null;
    const [to, from, note, trackId] = parsed;
    if (
      typeof to !== "string" ||
      typeof from !== "string" ||
      typeof note !== "string" ||
      typeof trackId !== "string"
    ) {
      return null;
    }
    const track = TRACKS.find((t) => t.id === trackId);
    if (!track) return null;
    return {
      to: to.slice(0, LIMITS.to),
      from: from.slice(0, LIMITS.from),
      note: note.slice(0, LIMITS.note),
      trackId,
      track,
    };
  } catch {
    return null;
  }
}
