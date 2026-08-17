/**
 * Generates src/data/tracks.ts from scripts/raw-playlist.json.
 *
 * The YouTube Music playlist is the single source of truth. Add a song there,
 * run `npm run sync`, redeploy — no per-song code edits, no matching, no chance
 * of the site playing a different recording than the one you picked.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLAYLIST_ID } from "./config.mjs";
import { CURATION, guess } from "./curation.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const rawPath = path.join(here, "raw-playlist.json");

if (!fs.existsSync(rawPath)) {
  console.error("scripts/raw-playlist.json is missing. Run: npm run sync:playlist");
  process.exit(1);
}

const { tracks: source, title: listTitle, listId } = JSON.parse(
  fs.readFileSync(rawPath, "utf8"),
);

/* ---------------- title tidying ---------------- */

/**
 * Pull the film out of the title into its own field. Covers the shapes that
 * actually turn up: (From "Sultan") · (from Blackmail) · (Movie: Saiyaara)
 */
function splitFilm(title) {
  const patterns = [
    /^(.*?)\s*[([]\s*from\s+"(.+?)"\s*[)\]]\s*$/i,
    /^(.*?)\s*[([]\s*from\s+(?:the\s+movie\s+)?([^)\]"]+?)\s*[)\]]\s*$/i,
    /^(.*?)\s*[([]\s*movie\s*[:-]\s*([^)\]]+?)\s*[)\]]\s*$/i,
  ];
  for (const re of patterns) {
    const m = title.match(re);
    if (m?.[1]?.trim()) return { title: m[1].trim(), film: m[2].trim() };
  }
  return { title: title.trim(), film: null };
}

/** "Unplugged" / "Remix" / "(Male)" etc. → a short badge next to the title. */
function badgeFor(title) {
  const t = title.toLowerCase();
  if (t.includes("slowed")) return "slowed + reverb";
  if (t.includes("lofi") || t.includes("lo-fi")) return "lofi";
  if (t.includes("unplugged")) return "unplugged";
  if (t.includes("remix")) return "remix";
  if (t.includes("reprise")) return "reprise";
  if (t.includes("mashup")) return "mashup";
  if (/\(male\)|\bmale\b\s*$/.test(t)) return "male";
  if (/\(female\)|\bfemale\b\s*$/.test(t)) return "female";
  return null;
}

const NOISE = [
  /\bfull (video|audio) song\b/gi, /\bfull song\b/gi, /\bfull video\b/gi,
  /\bofficial (music )?(video|audio|lyric video)\b/gi, /\bvideo song\b/gi,
  /\bsong video\b/gi, /\blyrical video\b/gi, /\bwith lyrics\b/gi, /\blyrics?\b/gi,
  /\baudio song\b/gi, /\bhd\b/gi, /\b4k\b/gi, /\b8k\b/gi, /\bnew song\b/gi,
];

/** matches a leading "<artist> - " on a title, so we can drop the duplication */
function dropArtistPrefix(artists) {
  const first = artists.split(/[,&·]/)[0].trim();
  if (first.length < 3) return /^$/;
  const escaped = first.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}\\s*[-–—:]\\s*`, "i");
}

const titleCase = (s) =>
  s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase());

/**
 * Turn a channel name into something that reads like an artist.
 *
 * On a YouTube Music playlist the channel usually IS the artist — either the
 * artist's own channel or the "<Artist> - Topic" auto-channel. It is a far
 * better credit than parsing the title, which on label uploads yields the
 * film's *actors* rather than the singer.
 */
function tidyArtist(channel) {
  // trim FIRST — several channels carry a trailing space, which would stop the
  // end-anchored suffix rules below from matching at all
  let a = channel
    .trim()
    .replace(/\s*-\s*Topic$/i, "")
    .replace(/VEVO$/i, "")
    .replace(/\s*\(\s*official\s*\)\s*$/i, "")
    .replace(/\s+official$/i, "")
    .trim();

  // "SonyMusicIndia" → "Sony Music India"
  if (/^[A-Za-z]+$/.test(a) && /[a-z][A-Z]/.test(a)) {
    a = a.replace(/([a-z])([A-Z])/g, "$1 $2");
  }
  if (a.length > 3 && a === a.toUpperCase()) a = titleCase(a);

  // channel suffixes that are branding, not part of a name
  a = a.replace(/\s+(records|music|studio[s]?)$/i, (m, w) =>
    /studio/i.test(w) ? m : "",
  );

  return a.replace(/\s{2,}/g, " ").trim();
}

/**
 * Most YouTube Music titles are already clean ("Channa Mereya"), but a few come
 * from label uploads and read like marketing copy:
 *   "KAUN TUJHE Full Audio Song | M.S. DHONI | Amaal Mallik Palak"
 * Keep the first pipe-segment and drop the marketing.
 */
function tidyTitle(raw) {
  let title = (raw.split(/\s*[|｜]\s*/).filter(Boolean)[0] ?? raw);
  for (const re of NOISE) title = title.replace(re, " ");
  title = title
    .replace(/["“”]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[-–—:,]\s*$/, "")
    .trim();

  // ALL CAPS reads as shouting next to the rest of the UI
  if (title.length > 3 && title === title.toUpperCase()) title = titleCase(title);

  return title || raw;
}

/* ---------------- build ---------------- */

const uncurated = [];

const tracks = source.map((t) => {
  const { title, film } = splitFilm(tidyTitle(t.title));

  // curation follows the video id, so reordering the playlist changes nothing
  const hit = CURATION[t.videoId];
  if (!hit) uncurated.push({ id: t.videoId, label: `${title} — ${t.channel}` });

  // an optional third entry in curation overrides the credit, for the handful
  // of songs uploaded by a label channel rather than the artist's own
  const [rotation, dard, artistOverride, titleOverride] = hit ?? (() => {
    const g = guess(title, t.channel);
    return [g.rotation, g.dard];
  })();
  const artists = artistOverride ?? tidyArtist(t.channel) ?? "Unknown";

  return {
    id: t.videoId,
    // "Kailash Kher - Teri Deewani" → "Teri Deewani"; the artist is shown already
    title: titleOverride ?? title.replace(dropArtistPrefix(artists), "").trim(),
    film,
    badge: badgeFor(t.title),
    artists,
    duration: (t.seconds ?? 0) * 1000,
    // no duration means live/unavailable — keep it out of every queue
    playable: Boolean(t.seconds),
    art: t.art,
    yt: [t.videoId],
    rotation,
    dard,
  };
});

const PLAYLIST_URL = `https://music.youtube.com/playlist?list=${listId ?? PLAYLIST_ID}`;

const header = `// AUTO-GENERATED by scripts/build-tracks.mjs — do not edit by hand.
// Source: YouTube Music playlist ${listId ?? PLAYLIST_ID} ("${listTitle}").
// Change the playlist, run \`npm run sync\`, and this file rewrites itself.
//
// Playback runs through YouTube's official IFrame player; no audio is hosted,
// proxied or re-streamed here, so this file is metadata only.

export type RotationSlug = "judaai" | "raat" | "lofi" | "vichoda" | "sufi" | "zakhm";

export type Track = {
  /** YouTube video id — the stable key for everything, curation included */
  id: string;
  title: string;
  /** film the song is from, when the title carried it */
  film: string | null;
  /** "unplugged" / "remix" / "lofi" / … */
  badge: string | null;
  artists: string;
  /** milliseconds */
  duration: number;
  /** false when there is nothing playable; such tracks never enter a queue */
  playable: boolean;
  art: string;
  /** video ids, best first; the player falls through on error */
  yt: string[];
  rotation: RotationSlug;
  /** 1 = halka sa dard, 10 = poora tabaah */
  dard: number;
};

/** where "poori playlist" points */
export const PLAYLIST_URL = ${JSON.stringify(PLAYLIST_URL)};
export const PLAYLIST_NAME = ${JSON.stringify(listTitle)};

export const TRACKS: Track[] = `;

fs.mkdirSync(path.join(here, "..", "src", "data"), { recursive: true });
fs.writeFileSync(
  path.join(here, "..", "src", "data", "tracks.ts"),
  header + JSON.stringify(tracks, null, 2) + ";\n",
);

/* ---------------- report ---------------- */

const playable = tracks.filter((t) => t.playable);
const byRotation = {};
for (const t of playable) byRotation[t.rotation] = (byRotation[t.rotation] ?? 0) + 1;

console.log(`"${listTitle}" → src/data/tracks.ts`);
console.log(`${playable.length}/${tracks.length} playable`);
for (const [slug, n] of Object.entries(byRotation).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${slug.padEnd(8)} ${n}`);
}

const thin = Object.entries(byRotation).filter(([, n]) => n < 4);
if (thin.length) {
  console.log(`\n⚠ thin rotations (under 4 songs): ${thin.map(([k]) => k).join(", ")}`);
  console.log("  add a few more songs of that mood, or recurate some existing ones");
}

if (uncurated.length) {
  console.log(`\n${uncurated.length} new song(s) are using a guessed mood.`);
  console.log("Paste these into scripts/curation.mjs and adjust:");
  for (const u of uncurated.slice(0, 30)) {
    console.log(`  "${u.id}": ["judaai", 7],   // ${u.label.slice(0, 56)}`);
  }
  if (uncurated.length > 30) console.log(`  …and ${uncurated.length - 30} more`);
}
