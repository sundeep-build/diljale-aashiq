/**
 * Reads a YouTube / YouTube Music playlist and writes scripts/raw-playlist.json.
 *
 * This is the scalable path: the playlist IS the station. Add a song there,
 * run `npm run sync`, redeploy. No per-song code edits, no fuzzy matching, no
 * chance of the site playing a different recording than the one you picked.
 *
 * No API key — the playlist page ships its first 100 items as JSON in
 * `ytInitialData`, and the rest come from the same internal endpoint the page
 * itself calls for infinite scroll.
 *
 *   node scripts/sync-playlist.mjs               # uses PLAYLIST_ID from config.mjs
 *   node scripts/sync-playlist.mjs <playlistId>  # or override it here
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PLAYLIST_ID } from "./config.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const HEADERS = { "user-agent": UA, "accept-language": "en-US,en;q=0.9" };

const listId = process.argv[2] ?? PLAYLIST_ID;

/** Videos YouTube keeps in the list but nobody can play. */
const DEAD_TITLES = new Set([
  "[Private video]",
  "[Deleted video]",
  "[Unavailable video]",
  "[Restricted video]",
]);

function parseDuration(text) {
  if (!text) return null;
  const parts = text.split(":").map(Number);
  if (parts.some(Number.isNaN)) return null;
  return parts.reduce((acc, p) => acc * 60 + p, 0);
}

/**
 * Depth-first sweep for playlist entries.
 *
 * YouTube currently ships two different layouts for the same page and which
 * one you get varies by playlist and rollout, so we read both:
 *   - `playlistVideoRenderer` — the long-standing shape
 *   - `lockupViewModel`       — the newer one
 */
function collect(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (node.playlistVideoRenderer) out.push({ kind: "renderer", data: node.playlistVideoRenderer });
  if (node.lockupViewModel) out.push({ kind: "lockup", data: node.lockupViewModel });
  for (const value of Array.isArray(node) ? node : Object.values(node)) {
    collect(value, out);
  }
  return out;
}

/** first value found under `key`, anywhere in the subtree */
function deepFind(node, key) {
  if (!node || typeof node !== "object") return undefined;
  if (key in node) return node[key];
  for (const value of Array.isArray(node) ? node : Object.values(node)) {
    const hit = deepFind(value, key);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

/**
 * "Load more items" tokens, in document order.
 *
 * A playlist page carries several unrelated continuations (shelves, comments),
 * and the two layouts nest theirs differently — `continuationItemRenderer` in
 * the old one, `continuationItemViewModel` in the new one. Rather than guess,
 * we gather every candidate and let the caller try them until one returns
 * videos we haven't seen.
 */
function findContinuations(node, out = []) {
  if (!node || typeof node !== "object") return out;

  const fromRenderer =
    node.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
  if (fromRenderer) out.push(fromRenderer);

  const fromViewModel =
    node.continuationItemViewModel?.continuationCommand?.innertubeCommand
      ?.continuationCommand?.token;
  if (fromViewModel) out.push(fromViewModel);

  for (const value of Array.isArray(node) ? node : Object.values(node)) {
    findContinuations(value, out);
  }
  return [...new Set(out)];
}

/** Always use the canonical thumbnail URL — the inline ones carry expiring tokens. */
const thumbFor = (videoId) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

function fromRenderer(r) {
  const title = r.title?.runs?.[0]?.text ?? r.title?.simpleText ?? "";
  if (!r.videoId) return null;
  return {
    videoId: r.videoId,
    title,
    channel: r.shortBylineText?.runs?.[0]?.text ?? "",
    seconds: parseDuration(r.lengthText?.simpleText),
    art: thumbFor(r.videoId),
  };
}

function fromLockup(l) {
  if (l.contentType && l.contentType !== "LOCKUP_CONTENT_TYPE_VIDEO") return null;
  const videoId = l.contentId;
  if (!videoId) return null;

  const meta = l.metadata?.lockupMetadataViewModel;
  const title = meta?.title?.content ?? "";

  // the duration lives in a badge painted over the thumbnail
  const badge = deepFind(l.contentImage, "thumbnailBadgeViewModel");
  const seconds = parseDuration(badge?.text);

  // channel: a metadata row if present, else the avatar's accessibility label
  const rows = meta?.metadata?.contentMetadataViewModel?.metadataRows ?? [];
  const rowText = rows[0]?.metadataParts?.[0]?.text?.content ?? "";
  const a11y = deepFind(meta?.image, "a11yLabel") ?? "";
  const channel = rowText || a11y.replace(/^Go to channel\s*/i, "");

  return { videoId, title, channel, seconds, art: thumbFor(videoId) };
}

function toTrack(entry) {
  const t = entry.kind === "lockup" ? fromLockup(entry.data) : fromRenderer(entry.data);
  if (!t || !t.title || DEAD_TITLES.has(t.title)) return null;
  return t;
}

/* ------------------------------------------------------------------ */

const res = await fetch(`https://www.youtube.com/playlist?list=${listId}`, {
  headers: HEADERS,
});
if (!res.ok) throw new Error(`playlist page returned ${res.status}`);
const html = await res.text();

const initial = html.match(/var ytInitialData = (\{.+?\});<\/script>/s);
if (!initial) throw new Error("could not find ytInitialData — is the playlist public?");
const data = JSON.parse(initial[1]);

const playlistTitle =
  data.metadata?.playlistMetadataRenderer?.title ?? "(untitled playlist)";
console.log(`playlist: ${playlistTitle}  (${listId})`);

const seen = new Set();
const tracks = [];
const push = (renderers) => {
  for (const r of renderers) {
    const t = toTrack(r);
    if (t && !seen.has(t.videoId)) {
      seen.add(t.videoId);
      tracks.push(t);
    }
  }
};

push(collect(data));
console.log(`  first page: ${tracks.length}`);

// paginate with the same internal endpoint the page uses for infinite scroll
const apiKey = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/)?.[1];
const clientVersion =
  html.match(/"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/)?.[1] ?? "2.20240101.00.00";

async function loadMore(token) {
  const page = await fetch(
    `https://www.youtube.com/youtubei/v1/browse?key=${apiKey}&prettyPrint=false`,
    {
      method: "POST",
      headers: { ...HEADERS, "content-type": "application/json" },
      body: JSON.stringify({
        context: { client: { clientName: "WEB", clientVersion } },
        continuation: token,
      }),
    },
  );
  return page.ok ? page.json() : null;
}

let tokens = apiKey ? findContinuations(data) : [];
let guard = 0;
while (tokens.length && guard++ < 200) {
  let advanced = false;

  for (const token of tokens) {
    const chunk = await loadMore(token).catch(() => null);
    if (!chunk) continue;

    const before = tracks.length;
    push(collect(chunk));
    if (tracks.length === before) continue; // wrong list — try the next token

    console.log(`  +${tracks.length - before} → ${tracks.length}`);
    tokens = findContinuations(chunk);
    advanced = true;
    break;
  }

  if (!advanced) break;
  await new Promise((r) => setTimeout(r, 250));
}

if (!tracks.length) throw new Error("playlist parsed but no playable videos found");

fs.writeFileSync(
  path.join(here, "raw-playlist.json"),
  JSON.stringify({ listId, title: playlistTitle, tracks }, null, 2),
);

const noDuration = tracks.filter((t) => !t.seconds).length;
console.log(`\n${tracks.length} songs → scripts/raw-playlist.json`);
if (noDuration) console.log(`${noDuration} without a duration (live or unlisted?)`);
console.log("next: npm run build:tracks");
