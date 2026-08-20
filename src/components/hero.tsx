"use client";

import { useRadio, useRadioProgress } from "./radio-provider";
import { usePresence } from "./use-presence";
import { useStationLine } from "./use-station-line";
import { liftedAccent, ROTATION_BY_SLUG } from "@/data/rotations";
import { PLAYLIST_URL, TRACKS } from "@/data/tracks";
import { cx, fmtTime } from "@/lib/utils";
import { PLAYER_BOX } from "@/lib/youtube-embed";
import { Curtain } from "./backdrop";
import { Next, Pause, Play, Prev, Shuffle, YouTubeMusic } from "./icons";

/**
 * The shop front, and one player.
 *
 * The photograph carries the whole hero — the sign above the stall already
 * says who this is and what it sells — so everything that used to sit up here
 * (the console, the reels, the blurb, the advisory sticker) is gone and what
 * is left is a single card low in the frame. Anything a listener might want
 * beyond play/pause lives further down the page.
 */
export function Hero() {
  const {
    attachHost,
    current,
    started,
    isPaused,
    isBuffering,
    ready,
    failed,
    toggle,
    next,
    prev,
    reshuffle,
    queue,
    index,
  } = useRadio();
  // the playhead lives on its own context so its 3-per-second updates re-render
  // this scrubber and nothing else on the page
  const { position, duration, seekRatio } = useRadioProgress();

  const { live, total } = usePresence();
  const stationLine = useStationLine();
  const spinning = started && !isPaused;
  const rot = current ? ROTATION_BY_SLUG[current.rotation] : null;
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const upNext = queue[(index + 1) % queue.length];

  return (
    /* `isolate` is load-bearing: it opens a stacking context so the photo
       layer's negative z-index stays inside this section instead of sliding
       behind <main> and vanishing under the rain.

       `.hero-section` (globals.css) carries the height and the header offset,
       both of which turn on the same aspect-ratio query as the framing. */
    <section className="hero-section relative isolate flex flex-col overflow-hidden">
      <ShopFront />

      {/* ---------- wordmark ----------
        Deliberately not over the signboard. The painted sign is the best thing
        in the frame and it already reads "Diljale aashiq"; the wordmark sits
        below it, over the dark of the stall, where cream on near-black is
        legible and nothing has to be obscured to make it so. */}
      <div className="page-w animate-rise relative flex flex-1 flex-col items-center justify-end pt-8 text-center sm:pt-10">
        {/* Amber, not the shared label's rose-soft: this is the one
            section-label that sits on the photograph rather than on ink, and
            a chalky red disappeared into the pale boards behind it. The bulb
            over the counter is the warmest thing in the frame — and the shadow
            is what actually carries it across the light patches, same as the
            wordmark and the Devanagari line below. */}
        <p
          className="section-label text-amber drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]"
          suppressHydrationWarning
        >
          {stationLine}
        </p>

        <h1 className="brush mt-3 text-5xl text-balance drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] sm:text-6xl lg:text-7xl">
          <span className="text-rose neon-text">Diljale</span>{" "}
          <span className="text-cream">Aashiq</span>
        </h1>

        <p className="font-deva mt-1.5 text-base font-bold text-cream/70 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-xl">
          दिलजले आशिक़
        </p>

        <div className="mx-auto mt-5 flex w-full max-w-sm items-center gap-3">
          <span className="pulse-rule flex-1" aria-hidden />
          <p className="shrink-0 font-display text-[0.62rem] font-bold tracking-[0.22em] text-cream/85 uppercase sm:text-xs">
            Feel the pain, live the love
          </p>
          <span className="pulse-rule flex-1" aria-hidden />
        </div>
      </div>

      {/* ---------- the player ---------- */}
      <div
        className="page-w animate-rise relative pt-7 pb-10 sm:pb-14"
        style={{ animationDelay: "120ms" }}
      >
        {/* id, not a scroll offset: the sticky RadioBar watches this box and
          takes over the moment it leaves the viewport, so the two transports
          are never on screen together whatever the hero ends up measuring. */}
        <div id="hero-player" className="mx-auto w-full max-w-xl">
          <div className="panel-deep flex items-center gap-3 rounded-2xl p-2.5 shadow-[0_30px_70px_-28px_rgba(0,0,0,0.95)] sm:gap-4 sm:rounded-3xl sm:p-3.5">
            {/* artwork + the two reels of the tape */}
            <div className="relative shrink-0">
              <div
                className="size-14 overflow-hidden rounded-xl border border-cream/15 bg-ink-2 sm:size-16 sm:rounded-2xl"
                style={
                  rot
                    ? { boxShadow: `0 12px 34px -18px ${rot.from}` }
                    : undefined
                }
              >
                {current && (
                  /* plain <img>: YouTube's thumbnail CDN needs no Next
                   optimisation, and skipping it keeps us off Vercel's quota */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.art}
                    alt={`${current.title} album art`}
                    width={300}
                    height={300}
                    // above the fold, but decoded off the main thread so it
                    // cannot hold up the photograph behind it
                    fetchPriority="high"
                    decoding="async"
                    className={cx(
                      "size-full object-cover transition-all duration-700",
                      spinning
                        ? "scale-105 saturate-125"
                        : "scale-100 saturate-75",
                    )}
                  />
                )}
              </div>
              <div className="pointer-events-none absolute -right-1.5 -bottom-1.5 hidden gap-1 sm:flex">
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className={cx(
                      "relative grid size-5 place-items-center rounded-full border border-cream/25 bg-ink",
                      spinning && "animate-spin-slow",
                    )}
                  >
                    <span className="absolute h-px w-3 bg-cream/25" />
                    <span className="relative block size-1 rounded-full bg-rose" />
                  </span>
                ))}
              </div>
            </div>

            {/* title + scrubber */}
            <div className="min-w-0 flex-1 text-left">
              <div className="flex items-center gap-2">
                <span className="section-label !text-[0.58rem]">
                  {started ? "Now Playing" : "Next cassette"}
                </span>
                {rot && (
                  <span
                    className="hidden truncate rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline"
                    style={{
                      background: `${rot.from}22`,
                      color: liftedAccent(rot.from),
                    }}
                  >
                    {rot.name}
                  </span>
                )}
              </div>

              <h2 className="mt-0.5 truncate font-display text-sm font-bold sm:text-base">
                {current?.title ?? "Tuning in…"}
              </h2>
              <p className="truncate text-[11px] text-muted">
                {current?.artists}
                {current?.film && (
                  <span className="text-muted/70"> · {current.film}</span>
                )}
              </p>

              <div className="mt-2 flex items-center gap-2.5">
                <span className="text-[10px] tabular-nums text-muted">
                  {fmtTime(position)}
                </span>
                <button
                  type="button"
                  aria-label="Seek"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    seekRatio((e.clientX - r.left) / r.width);
                  }}
                  className="group relative block h-4 flex-1 cursor-pointer"
                >
                  <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-cream/12" />
                  {/* scaleX, not width: an animated `width` re-runs layout on
                      every frame of every song, and this bar transitions three
                      times a second for as long as the radio is on */}
                  <span
                    className="absolute inset-x-0 top-1/2 h-1 origin-left -translate-y-1/2 rounded-full bg-rose transition-transform duration-300"
                    style={{
                      transform: `translateY(-50%) scaleX(${progress})`,
                    }}
                  />
                  <span
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose opacity-0 shadow-[0_0_12px_var(--color-rose)] transition-opacity group-hover:opacity-100"
                    style={{ left: `${progress * 100}%` }}
                  />
                </button>
                <span className="text-[10px] tabular-nums text-muted">
                  {duration
                    ? fmtTime(duration)
                    : fmtTime(current?.duration ?? 0)}
                </span>
              </div>
            </div>

            {/* transport */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                onClick={prev}
                aria-label="Pichla gaana"
                className="grid size-9 place-items-center rounded-full text-cream/70 transition hover:bg-cream/8 hover:text-cream active:scale-95 sm:size-10"
              >
                <Prev className="size-4" />
              </button>

              <button
                onClick={toggle}
                disabled={!ready && !failed}
                aria-label={spinning ? "Rok do" : "Radio chalu karo"}
                className="group relative grid size-12 place-items-center rounded-full bg-rose text-white shadow-[0_10px_34px_-8px_var(--color-rose)] transition active:scale-95 disabled:opacity-50 sm:size-14"
              >
                {!ready && !failed ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : spinning ? (
                  <Pause className="size-5" />
                ) : (
                  <Play className="ml-0.5 size-5" />
                )}
                {spinning && (
                  <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-rose" />
                )}
              </button>

              <button
                onClick={next}
                aria-label="Agla gaana"
                className="grid size-9 place-items-center rounded-full text-cream/70 transition hover:bg-cream/8 hover:text-cream active:scale-95 sm:size-10"
              >
                <Next className="size-4" />
              </button>
            </div>
          </div>

          {/* the thin line under the card — everything that isn't a transport */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-muted sm:justify-between">
            <span className="flex min-w-0 items-center gap-2">
              <button
                onClick={reshuffle}
                aria-label="Cassette badlo"
                title="Cassette badlo"
                className="grid size-6 shrink-0 place-items-center rounded-full text-cream/60 transition hover:bg-cream/8 hover:text-cream active:scale-95"
              >
                <Shuffle className="size-3.5" />
              </button>
              {isBuffering ? (
                <span className="text-rose-soft">Load ho raha hai…</span>
              ) : (
                upNext && (
                  <span className="truncate">
                    Next · <span className="text-cream/80">{upNext.title}</span>
                  </span>
                )
              )}
            </span>

            <a
              href={PLAYLIST_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="flex shrink-0 items-center gap-1.5 text-rose-soft underline-offset-4 hover:underline"
            >
              <YouTubeMusic className="size-3.5 text-[#ff0033]" />
              Poori playlist →
            </a>
          </div>

          {/* YouTube replaces a child of this box with its iframe. See
            PLAYER_VISIBLE in lib/youtube-embed.ts — hidden here, so the
            station reads as a radio instead of a video embed. */}
          <div ref={attachHost} className={PLAYER_BOX} />

          {failed && (
            <p className="mt-2 text-center text-[10px] leading-relaxed text-rose-soft">
              Player load nahi hua — ad-blocker band karke refresh karo.
            </p>
          )}

          {/* Displayed counts carry LISTENER_OFFSET (+100 by default) — see
            use-presence.ts. The measured values are unchanged at
            /api/presence. A count that could not be measured at all is
            hidden rather than rendered as the offset on its own. */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-muted">
            <span>
              <span className="font-semibold text-cream/85 tabular-nums">
                {TRACKS.length}
              </span>{" "}
              dard bhare gaane
            </span>
            {total !== null && (
              <>
                <span className="h-3 w-px bg-cream/15" aria-hidden />
                <span>
                  <span className="font-semibold text-cream/85 tabular-nums">
                    {total.toLocaleString("en-IN")}
                  </span>{" "}
                  ab tak sun chuke
                </span>
              </>
            )}
            {live !== null && (
              <>
                <span className="h-3 w-px bg-cream/15" aria-hidden />
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="font-semibold text-cream/90 tabular-nums">
                    {live.toLocaleString("en-IN")}
                  </span>
                  abhi sun rahe hain
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Desktop only. On a phone the player card already sits within a thumb
        of the bottom edge, and a cue under it is one more thing between the
        listener and the play button. */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-3 hidden flex-col items-center gap-1 text-[9px] font-display tracking-[0.34em] text-cream/40 sm:flex"
        aria-hidden
      >
        SCROLL
        <span className="animate-float block">↓</span>
      </div>
    </section>
  );
}

/**
 * The photograph, its grade, and the weather over it.
 *
 * Two framings, landscape and portrait, encoded by scripts/make-hero.mjs into
 * public/hero and committed, so no image service is in the request path: the
 * browser picks the framing off the viewport's aspect, the width off
 * `sizes="100vw"`, and AVIF if it can (128KB at full width) or WebP if not.
 */
function ShopFront() {
  return (
    /* The ink the whole hero sits on. Where the portrait framing is up, the
       frame only reaches partway down and this is what the rest of the hero
       is — without it the page's fixed backdrop shows through from underneath,
       and its CSS skyline reads as hard-edged rectangles behind the player.
       Under the landscape framing the frame covers this entirely. */
    <div className="absolute inset-0 -z-10 overflow-hidden bg-ink">
      {/* `.hero-frame` (globals.css) is the photo's own box, and it changes
        shape with the viewport's aspect rather than its width — the note
        there explains why, and owns the query the <source>s below negate. */}
      <div className="hero-frame overflow-hidden">
        {/* The blurred 24px placeholder, inlined — 151 bytes of base64 that put
        the photo's colours on screen in the first frame, so the hero never
        flashes black while the real file decodes. */}
        <div
          aria-hidden
          className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
          style={{ backgroundImage: `url("${LQIP}")` }}
        />

        <picture>
          {/* Ordered, because the browser takes the first <source> that matches.
          `not all and (...)` is the exact negation of `.hero-frame`'s own
          query, so the framing and the box holding it always flip together —
          a `max-aspect-ratio` written here by hand would overlap it by one
          ratio and put the portrait art in the landscape box. */}
          <source
            media="not all and (min-aspect-ratio: 13/10)"
            type="image/avif"
            srcSet={srcSet("avif", "tall")}
            sizes="100vw"
          />
          <source
            media="not all and (min-aspect-ratio: 13/10)"
            type="image/webp"
            srcSet={srcSet("webp", "tall")}
            sizes="100vw"
          />
          <source type="image/avif" srcSet={srcSet("avif")} sizes="100vw" />
          <source type="image/webp" srcSet={srcSet("webp")} sizes="100vw" />
          {/* no next/image here: the ladder is pre-encoded and committed, so
          routing it through the optimiser would burn Vercel quota to redo
          work that is already done. The rule exempts <img> inside <picture>. */}
          <img
            src="/hero/shop-1280.webp"
            alt="Diljale Aashiq — a roadside MP3 and cassette stall at dusk, its painted signboard promising ‘yahaan har gaana, har yaad tera intezaar karti hai’, with old men sitting out front."
            width={1721}
            height={914}
            fetchPriority="high"
            decoding="async"
            /* Positioned, not in flow, for two reasons. `<picture>` is an inline
             box with no height, so a percentage height on the image inside it
             is indefinite and collapses to the file's own aspect ratio. And an
             in-flow image paints *below* every positioned sibling — which is
             what the placeholder above is — so the blur would sit on top of
             the photograph forever.

             Anchored to the top: the box matches each framing closely enough
             that there is only ever a few percent to trim, and the one edge
             that is always expendable is the bottom — blurred ground in the
             portrait frame, foreground road in the landscape one. */
            className="absolute inset-0 size-full object-cover object-top"
          />
        </picture>

        <div aria-hidden className="hero-grade absolute inset-0" />

        {/* The bulb over the counter, pushed out into the frame. Kept well above
        the signboard and weak: any more of it and the warm haze eats the
        painted lettering, which is the one thing in the photo worth keeping
        sharp. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(55%_30%_at_50%_6%,color-mix(in_oklab,var(--color-amber)_9%,transparent),transparent_72%)]"
        />
        {/* Vignette, on top of the grade. It was reaching 0.72 at the corners,
        which is most of why the bottom of the frame went flat — the grade is
        already dark down there and the two were stacking. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_30%,transparent_42%,rgba(12,9,4,0.52)_100%)]"
        />
      </div>

      {/* Rain, across the whole hero and on top of the grade rather than under
        it — the ink below the frame would otherwise be the one dead patch on
        a page where it rains everywhere. Two sheets, not the full four-layer
        field from the backdrop: this is a veil to tie the street to the rest
        of the station, and every extra layer is a composited texture the size
        of the viewport. `.weather` is what calm mode removes. */}
      <div className="weather absolute inset-0 overflow-hidden" aria-hidden>
        <Curtain opacity={0.09} gap={46} len={34} thick={1} speed={195} />
        <Curtain
          opacity={0.06}
          gap={92}
          len={58}
          thick={2}
          speed={315}
          className="hidden sm:block"
        />
      </div>
    </div>
  );
}

/** Widths generated by scripts/make-hero.mjs — keep the two in step. */
const WIDTHS = {
  wide: [640, 960, 1280, 1721],
  tall: [480, 720, 960, 1150],
};

const srcSet = (ext: "avif" | "webp", frame: "wide" | "tall" = "wide") =>
  WIDTHS[frame]
    .map(
      (w) => `/hero/shop${frame === "tall" ? "-tall" : ""}-${w}.${ext} ${w}w`,
    )
    .join(", ");

/** public/hero/shop-lqip.txt */
const LQIP =
  "data:image/webp;base64,UklGRlgAAABXRUJQVlA4IEwAAACQAwCdASoYAA0APulgqE0pJaQiMAgBIB0JQBOgBDmc6PP3P76AAP53M9E7MIcXI3R+aZJLGMvnrBwaF0h45N3kfKk237Si4FBkAAAA";
