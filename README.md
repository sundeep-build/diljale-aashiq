# दिलजले आशिक़ · Diljale Aashiq

A 24×7 heartbreak radio station — the *dard* counterpart to [deluxesalon.in](https://deluxesalon.in)'s
90s barbershop tape. It plays the **[Diljale Aashiq](https://music.youtube.com/playlist?list=PLFKxbPRZ-OrE)**
YouTube Music playlist, and runs entirely on free tiers.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind v4 · TypeScript · deploys to Vercel Hobby.
**Runtime cost:** ₹0. No database, no API keys, no image service, no audio hosting, no paid SDK.

---

## The three original features

Everything below `deluxesalon.in`'s shape (rotations, songs list, PWA install) is there, plus:

### 1. Dard-o-Meter — *"playlist mat chuno, dard chuno"*
Every track is hand-scored 1–10 for how much it hurts. Instead of picking a playlist you
drag a dial, and the station rebuilds its whole queue around that number
([`tuneQueue`](src/lib/utils.ts)) — closest-scoring songs first, widening the window until
the queue is long enough to actually be a radio station, then shuffled with a seed so the
same setting never plays the same order twice.

### 2. Tapri Mode — synthesised ambience
Rain, chai-stall murmur, a passing train and a ceiling fan, layered under the music with
individual faders. Every one of them is **generated in the browser** with the Web Audio
API — filtered white/brown noise plus a per-layer LFO ([`src/lib/ambience.ts`](src/lib/ambience.ts)).
No mp3s to host, no bandwidth bill, no CDN. Four presets ("Monsoon breakup", "Last train
home", …) mix the faders for you.

### 3. Dil se Dil tak — dedications with no database
Write someone a note, pick a song, get a link. The entire dedication is base64'd into the
URL ([`src/lib/dedication.ts`](src/lib/dedication.ts)), so `/d/<payload>` needs **zero
storage** — no KV, no Postgres, no row limit, and the link still works years later.
WhatsApp gets a proper preview because the route renders its own OG image on the fly with
`next/og`.

Bonus: **Aaj raat ka poster** — the session draws itself as a story (9:16) or feed (4:5)
card on a `<canvas>` ([`src/lib/poster.ts`](src/lib/poster.ts)), tinted around whichever
rotation the night lived in. The preview on the page *is* the export, and the share button
hands the file straight to the OS share sheet, so it lands in Instagram or WhatsApp without
a round trip. Drawn on the device: no upload, no server render, no image-generation cost.

---

## How playback works

**The YouTube Music playlist is the single source of truth.** Whatever is in it, is the
station. Playback runs through YouTube's official IFrame Player API — full songs, for
everyone, on any device, with no login.

```
YouTube Music playlist  ──npm run sync──▶  src/data/tracks.ts  ──▶  the site
      (you edit this)                        (generated)          (YouTube plays it)
```

- **Adding a song is one action**: add it to the playlist, run `npm run sync`, redeploy.
  No code edit per song, no matching, and the site can never play a different recording
  than the one you picked.
- Our transport (play / pause / next / prev / seek / shuffle) drives the player through
  [`src/lib/youtube-embed.ts`](src/lib/youtube-embed.ts); auto-advance hangs off the
  player's `ENDED` state.
- **No audio is hosted, proxied or re-streamed here.** Ads are left intact and nothing is
  downloaded or cached — the official player does the streaming, it just isn't shown.

> Why not Spotify for playback: a Spotify embed only streams a full track to a listener
> logged into **Spotify Premium**, and in practice only on desktop. Everyone else gets a
> 30-second preview. Their Web Playback SDK is Premium-only too, and needs an OAuth
> server. The gate is on the listener's account, so no free workaround exists.

### Hidden player

The YouTube iframe is mounted into a 1×1px, `opacity-0` box, so the site plays audio and
shows its own artwork and transport instead of a video. This is what
[saloon.wtf](https://saloon.wtf/) and [deluxesalon.in](https://deluxesalon.in/) do, using
the same IFrame API.

**It is a terms trade-off, stated plainly.** YouTube's embed terms require the player to
stay visible and unobscured, at least 200×200px. Hiding it breaches that. The realistic
risk is not legal — it is YouTube blocking embeds for the domain, which would take the
station down until reverted.

It is one constant. In [`src/lib/youtube-embed.ts`](src/lib/youtube-embed.ts):

```ts
export const PLAYER_VISIBLE = false;  // true → small visible player, terms-compliant
```

Flip it to `true` and the player becomes a 356×200 panel under the console. Nothing else
changes; `PLAYER_BOX` and `playerVars()` handle both modes.

Two consequences worth knowing while it is hidden:

- **Video ads become unskippable.** The ad still plays, but the Skip button is invisible,
  so listeners wait it out.
- **iOS is the weak spot.** A zero-size player is more fragile on iOS Safari than a visible
  one. Playback still needs a real tap to start. Test on an actual iPhone before launch.

### Curation survives everything

[`scripts/curation.mjs`](scripts/curation.mjs) maps each song to a rotation and a dard
level, **keyed by YouTube video id** — not by playlist position. Reorder the playlist, add
songs at the top, remove songs: every remaining song keeps its mood. An earlier version
keyed this positionally and silently reassigned every song's mood on any reorder.

Each entry is `[rotation, dard, artist?, title?]`. The last two are optional overrides for
the handful of songs a label channel uploaded with marketing copy in the title.

A song you have not curated still works — it gets a conservative `guess()`, and the sync
prints it so you know what is waiting for you.

---

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build && npm start   # production
npm run typecheck && npm run lint
```

### Deploying to Vercel

Push to GitHub and import the repo — Vercel auto-detects Next.js and nothing else needs
configuring. Optionally set `NEXT_PUBLIC_SITE_URL` to your final domain so OG tags use
absolute URLs (on Vercel it falls back to `VERCEL_PROJECT_PRODUCTION_URL` automatically).

#### Turning on the all-time counter (free, and worth doing)

The hero shows two numbers:

| | what it is | needs Redis? |
|---|---|---|
| `125 aashiq ab tak sun chuke hain` | unique listeners **ever** | yes |
| `3 abhi online` | listening **right now** | no |

**The big number is the one people notice, and it is the honest way to show scale** — it
counts every real listener since launch, so it passes 100 and keeps climbing instead of
reading `3` on a quiet night. It needs somewhere durable to live: an in-process counter
resets to zero on every cold start, so without Redis the total is hidden entirely rather
than shown wrong.

Create a free Upstash Redis database and add two env vars in Vercel:

```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Nothing else changes — [`/api/presence`](src/app/api/presence/route.ts) detects them and
switches backend. Redis also makes `live` exact across serverless instances (without it,
each instance only sees its own listeners, so a busy site undercounts). Cost is roughly
5 commands per listener per minute, far inside the free tier.

#### The +100 display offset

Both counters have **100 added before they are shown**, so 3 listeners display as 103 and
100 display as 200. It lives in one place —
[`src/components/use-presence.ts`](src/components/use-presence.ts):

```ts
export const LISTENER_OFFSET = Number(process.env.NEXT_PUBLIC_LISTENER_OFFSET ?? 100);
```

Set `NEXT_PUBLIC_LISTENER_OFFSET=0` in Vercel to show the true numbers — no code change
needed.

Two things kept deliberately clean:

- **The offset is display-only.** `/api/presence` still returns the measured values, so
  anything you build on it later (analytics, a dashboard) reads the truth.
- **It is applied to `total` as well as `live`.** Offsetting only `live` would eventually
  let the page claim more people are listening right now than have ever listened, which is
  impossible and is the first thing a visitor would spot.

Worth being clear-eyed about the trade: the on-screen "abhi online" figure is no longer
what was measured, and a visitor reading it has no way to know that. That is a product
call, not a technical one — the code and this README both state it plainly so nobody
maintaining the site is misled by it.

---

## Refreshing the playlist

Add or remove songs in the playlist, then:

```bash
npm run sync        # re-read the playlist + regenerate src/data/tracks.ts
```

That is the whole loop. `npm run sync:playlist` and `npm run build:tracks` are the two
halves if you want to run them separately. To point the station at a different playlist,
change `PLAYLIST_ID` in [`scripts/config.mjs`](scripts/config.mjs).

The sync handles playlists of any size (it follows YouTube's pagination) and reads both
of the page layouts YouTube currently serves. Private, deleted and unavailable videos are
skipped rather than becoming dead entries.

Icons are generated too — `npm run build:icons` redraws the PWA PNGs from scratch with a
dependency-free encoder in [`scripts/make-icons.mjs`](scripts/make-icons.mjs).

---

## Notes and honest caveats

- **The counters are measured, then offset for display.** `live` = ids heartbeated in the
  last 45s; `total` = unique ids ever (a HyperLogLog, so it never resets or grows
  unbounded). No cookies, no IPs, no fingerprinting. Before display, both have
  `LISTENER_OFFSET` (+100) added — see below. A count that cannot be measured at all is
  hidden rather than shown as the bare offset.
- **The station line is per-visitor.** The city comes from the host's edge geo headers via
  [`/api/where`](src/app/api/where/route.ts) — city name only, nothing stored, no
  geolocation prompt — and falls back to Jalandhar when unavailable (localhost, unknown IP,
  any non-Vercel host). The time of day comes from the visitor's own clock. The OG share
  card stays fixed on Jalandhar on purpose: it is rendered for a link crawler, so geo there
  would report the crawler's location, not the reader's.
- The service worker deliberately **never caches `/api/*`**. It is cache-first for static
  assets, which froze the first geo and presence responses forever until this was fixed.
- **Fonts are declared on `<html>`, not `<body>`.** Tailwind's `@theme` puts
  `--font-display` / `--font-body` / `--font-brush` on `:root`, and a `var()` inside a
  custom property resolves on the element that *declares* it. With `next/font` on `<body>`
  those aliases were unresolvable and every typeface silently fell back to system sans.
  Keep the font classNames on `<html>`, and keep the raw face variable names distinct from
  the theme alias names (`--font-noto-deva` vs `--font-deva`) or they form a cycle.
- **One container class, `.page-w`** (in `globals.css`), sets the page width and gutters.
  The header, every section, the sticky player and the footer all use it, so they cannot
  drift out of alignment — the player bar used to be `max-w-3xl` against everything else's
  `max-w-6xl`. Inner limits like `max-w-lg` on body copy are typographic measure, not
  container width, and are meant to stay narrower.
- Dedication pages are `noindex` — they're personal, they shouldn't turn up in search.
- The service worker caches only the app shell and same-origin assets. It never touches
  YouTube or anything cross-origin.
- YouTube ads play before or during some songs. That is the price of full tracks with no
  login, and stripping them would violate YouTube's terms.
- **The YouTube player is hidden** — audio only. See "Hidden player" below; this is a
  deliberate terms trade-off, and a one-line toggle.
- Credits come from the uploading channel, which on YouTube Music is usually the artist.
  For label uploads it can read as the label instead — fix those with the optional artist
  override in `curation.mjs`.
- All songs, artwork and playback rights belong to their artists, labels and YouTube.

## Layout

```
src/
  app/
    page.tsx                     the station
    d/[payload]/                 a shared dedication + its dynamic OG image
    opengraph-image.tsx          the homepage share card
  components/
    radio-provider.tsx           queue, transport, YouTube player, session stats
    hero.tsx  dard-meter.tsx  rotations.tsx  track-list.tsx
    tapri-mode.tsx  dedication-studio.tsx  poster.tsx  radio-bar.tsx
    backdrop.tsx                 the rainy 2am street, pure CSS + one inline SVG
  lib/
    youtube-embed.ts  ambience.ts  dedication.ts  poster.ts  utils.ts
  data/
    tracks.ts                    generated — do not edit by hand
    rotations.ts                 mood definitions and dard copy
scripts/
  config.mjs                     the playlist id — the one knob
  sync-playlist.mjs              playlist  → raw-playlist.json
  build-tracks.mjs               raw       → src/data/tracks.ts
  curation.mjs                   video id  → rotation + dard level
  make-icons.mjs                 PWA icons, drawn from scratch
```
