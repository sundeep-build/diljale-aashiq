"use client";

import { useRadio } from "./radio-provider";
import { usePresence } from "./use-presence";
import { useStationLine } from "./use-station-line";
import { ROTATION_BY_SLUG } from "@/data/rotations";
import { PLAYLIST_URL, TRACKS } from "@/data/tracks";
import { cx, fmtTime } from "@/lib/utils";
import { PLAYER_BOX } from "@/lib/youtube-embed";
import { Next, Pause, Play, Prev, Shuffle, YouTubeMusic } from "./icons";

export function Hero() {
  const {
    attachHost,
    current,
    started,
    isPaused,
    isBuffering,
    position,
    duration,
    ready,
    failed,
    toggle,
    next,
    prev,
    reshuffle,
    seekRatio,
    queue,
    index,
  } = useRadio();

  const { live, total } = usePresence();
  const stationLine = useStationLine();
  const spinning = started && !isPaused;
  const rot = current ? ROTATION_BY_SLUG[current.rotation] : null;
  const progress = duration > 0 ? Math.min(1, position / duration) : 0;
  const upNext = queue[(index + 1) % queue.length];

  return (
    <section className="relative z-10 page-w pt-10 pb-6 sm:pt-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
        {/* ---------- headline ---------- */}
        <div className="animate-rise relative mx-auto flex max-w-2xl flex-col items-center text-center lg:mx-0 lg:items-start lg:text-left">
          {/* sleeve sticker — in flow, so it can't sit on top of the kicker */}
          <span className="advisory mb-5 -rotate-3 text-[0.5rem] tracking-[0.1em]">
            <span className="text-[0.62rem] tracking-[0.14em]">Diljale</span>
            <span>Advisory</span>
            <span className="text-rose">Explicit Feelings</span>
          </span>

          {/* city from edge geo headers, time from the visitor's own clock */}
          <p className="section-label" suppressHydrationWarning>
            {stationLine}
          </p>

          {/* the album-cover wordmark: red top line, white bottom line */}
          <h1 className="brush mt-5 text-6xl sm:text-7xl lg:text-8xl">
            <span className="block text-rose neon-text">Diljale</span>
            <span className="-mt-1 block text-cream">Aashiq</span>
          </h1>

          <p className="font-deva mt-2 text-lg font-bold text-cream/70 sm:text-2xl">
            दिलजले आशिक़
          </p>

          {/* tagline, framed by the heartbeat rule from the sleeve */}
          <div className="mx-auto mt-6 flex w-full max-w-sm items-center gap-3 lg:mx-0">
            <span className="pulse-rule flex-1" aria-hidden />
            <p className="shrink-0 font-display text-[0.62rem] font-bold tracking-[0.22em] text-cream/85 uppercase sm:text-xs">
              Feel the pain, live the love
            </p>
            <span className="pulse-rule flex-1" aria-hidden />
          </div>

          <p className="mx-auto mt-6 w-full max-w-lg text-sm leading-relaxed text-muted sm:text-base lg:mx-0">
            24×7 dard ka radio — {TRACKS.length} heartbreak songs, ek dial, aur
            ek raat jo khatam nahi hoti.
          </p>

          {/* Displayed counts carry LISTENER_OFFSET (+100 by default) — see
            use-presence.ts. The measured values are unchanged at
            /api/presence. A count that could not be measured at all is
            hidden rather than rendered as the offset on its own. */}
          {(total !== null || live !== null) && (
            <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-cream/12 bg-cream/5 px-4 py-1.5 text-xs text-muted lg:justify-start">
              {total !== null && (
                <span className="flex items-center gap-1.5">
                  <span className="font-display text-sm font-bold text-cream tabular-nums">
                    {total.toLocaleString("en-IN")}
                  </span>
                  aashiq ab tak sun chuke hain
                </span>
              )}
              {total !== null && live !== null && (
                <span className="h-3 w-px bg-cream/15" aria-hidden />
              )}
              {live !== null && (
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="font-semibold text-cream/90 tabular-nums">
                    {live.toLocaleString("en-IN")}
                  </span>
                  Aashiq Listening
                </span>
              )}
            </div>
          )}
        </div>

        {/* ---------- the console ---------- */}
        <div
          className="panel animate-rise mx-auto w-full max-w-2xl rounded-3xl p-3.5 sm:p-6 lg:mt-0"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-start gap-4 sm:gap-5">
            {/* artwork + spinning reels */}
            <div className="relative shrink-0">
              <div
                className="size-24 overflow-hidden rounded-2xl border border-cream/15 bg-ink-2 sm:size-32"
                style={
                  rot
                    ? { boxShadow: `0 14px 44px -16px ${rot.from}` }
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
                    className={cx(
                      "size-full object-cover transition-all duration-700",
                      spinning
                        ? "scale-105 saturate-125"
                        : "scale-100 saturate-75",
                    )}
                  />
                )}
              </div>
              {/* the two reels of the tape */}
              <div className="pointer-events-none absolute -right-2 -bottom-2 flex gap-1">
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    className={cx(
                      "relative grid size-6 place-items-center rounded-full border border-cream/25 bg-ink",
                      spinning && "animate-spin-slow",
                    )}
                  >
                    <span className="absolute h-px w-4 bg-cream/25" />
                    <span className="relative block size-1.5 rounded-full bg-rose" />
                  </span>
                ))}
              </div>
            </div>

            {/* track info */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="section-label !text-[0.62rem]">
                  {started ? "Ab baj raha hai" : "Next cassette"}
                </span>
                {rot && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ background: `${rot.from}22`, color: rot.from }}
                  >
                    {rot.name}
                  </span>
                )}
                {current?.badge && (
                  <span className="rounded-full bg-cream/8 px-2 py-0.5 text-[10px] text-muted">
                    {current.badge}
                  </span>
                )}
              </div>

              <h2 className="mt-1.5 truncate font-display text-xl font-bold sm:text-2xl">
                {current?.title ?? "Tuning in…"}
              </h2>
              <p className="truncate text-xs text-muted sm:text-sm">
                {current?.artists}
                {current?.film && (
                  <span className="text-muted/70"> · {current.film}</span>
                )}
              </p>

              {/* scrubber */}
              <div className="mt-4">
                <button
                  type="button"
                  aria-label="Seek"
                  onClick={(e) => {
                    const r = e.currentTarget.getBoundingClientRect();
                    seekRatio((e.clientX - r.left) / r.width);
                  }}
                  className="group relative block h-5 w-full cursor-pointer"
                >
                  <span className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-cream/12" />
                  <span
                    className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-rose transition-[width] duration-300"
                    style={{ width: `${progress * 100}%` }}
                  />
                  <span
                    className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose opacity-0 shadow-[0_0_12px_var(--color-rose)] transition-opacity group-hover:opacity-100"
                    style={{ left: `${progress * 100}%` }}
                  />
                </button>
                <div className="flex justify-between text-[10px] tabular-nums text-muted">
                  <span>{fmtTime(position)}</span>
                  <span>
                    {duration
                      ? fmtTime(duration)
                      : fmtTime(current?.duration ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ---------- transport ---------- */}
          <div className="mt-5 flex items-center justify-center gap-3 sm:gap-5">
            <button
              onClick={prev}
              aria-label="Pichla gaana"
              className="grid size-11 place-items-center rounded-full text-cream/70 transition hover:bg-cream/8 hover:text-cream active:scale-95"
            >
              <Prev className="size-5" />
            </button>

            <button
              onClick={toggle}
              disabled={!ready && !failed}
              aria-label={started && !isPaused ? "Rok do" : "Radio chalu karo"}
              className="group relative grid size-16 place-items-center rounded-full bg-rose text-white shadow-[0_10px_40px_-8px_var(--color-rose)] transition active:scale-95 disabled:opacity-50 sm:size-18"
            >
              {!ready && !failed ? (
                <span className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : started && !isPaused ? (
                <Pause className="size-6" />
              ) : (
                <Play className="ml-0.5 size-7" />
              )}
              {spinning && (
                <span className="animate-pulse-ring absolute inset-0 rounded-full border-2 border-rose" />
              )}
            </button>

            <button
              onClick={next}
              aria-label="Agla gaana"
              className="grid size-11 place-items-center rounded-full text-cream/70 transition hover:bg-cream/8 hover:text-cream active:scale-95"
            >
              <Next className="size-5" />
            </button>

            <button
              onClick={reshuffle}
              aria-label="Cassette badlo"
              title="Cassette badlo"
              className="grid size-11 place-items-center rounded-full text-cream/70 transition hover:bg-cream/8 hover:text-cream active:scale-95"
            >
              <Shuffle className="size-4.5" />
            </button>
          </div>

          {/* ---------- up next ---------- */}
          {upNext && (
            <p className="mt-4 truncate text-center text-[11px] text-muted">
              Next · <span className="text-cream/80">{upNext.title}</span> —{" "}
              {upNext.artists.split(",")[0]}
            </p>
          )}

          {/* ---------- the player ---------- */}
          <div className="relative mt-5 border-t border-cream/10 pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[11px] text-muted">
                {isBuffering ? (
                  <span className="text-rose-soft">Load ho raha hai…</span>
                ) : (
                  <>
                    Audio via YouTube
                    <span className="text-muted/60">
                      {" "}
                      · poore gaane, bina login
                    </span>
                  </>
                )}
              </p>
              <a
                href={PLAYLIST_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="flex shrink-0 items-center gap-1.5 text-[11px] text-rose-soft underline-offset-4 hover:underline"
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
              <p className="mt-2 text-[10px] leading-relaxed text-rose-soft">
                Player load nahi hua — ad-blocker band karke refresh karo.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
