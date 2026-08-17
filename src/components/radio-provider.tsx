"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { TRACKS, type RotationSlug, type Track } from "@/data/tracks";
import {
  FATAL_YT_ERRORS,
  loadYouTubeApi,
  playerVars,
  YT_STATE,
  type YTPlayer,
} from "@/lib/youtube-embed";
import { tuneQueue } from "@/lib/utils";

export type SessionStats = {
  /** how many songs the dial has pushed through this session */
  played: number;
  /** rough listening time in ms */
  listened: number;
  /** rotations touched, most recent first */
  rotations: RotationSlug[];
  /** the heaviest track the listener sat through */
  peakDard: number;
};

type RadioValue = {
  ready: boolean;
  /** true once the listener has tapped play at least once */
  started: boolean;
  failed: boolean;
  queue: Track[];
  index: number;
  current: Track | null;
  isPaused: boolean;
  isBuffering: boolean;
  dard: number;
  rotation: RotationSlug | null;
  stats: SessionStats;
  attachHost: (el: HTMLDivElement | null) => void;
  start: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  playTrack: (track: Track) => void;
  playRotation: (slug: RotationSlug) => void;
  setDard: (level: number) => void;
  reshuffle: () => void;
};

/**
 * The playhead, kept deliberately separate from everything above.
 *
 * It changes three times a second while a song plays. When it lived on the
 * main context, every one of the nine components that call `useRadio()` —
 * including the track list, which renders a row per song — re-rendered at that
 * rate for the entire length of every song. That is a fan running on a laptop
 * and a warm phone in a pocket, to move one progress bar.
 *
 * Split out like this, a position tick re-renders only the two scrubbers that
 * actually display it.
 */
type RadioProgress = {
  position: number;
  duration: number;
  seekRatio: (ratio: number) => void;
};

const RadioContext = createContext<RadioValue | null>(null);
const ProgressContext = createContext<RadioProgress | null>(null);

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used inside <RadioProvider>");
  return ctx;
}

/** Subscribe to the playhead alone. See the note on RadioProgress above. */
export function useRadioProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useRadioProgress must be used inside <RadioProvider>");
  return ctx;
}

const DEFAULT_DARD = 7;
/** the seed the prerendered HTML uses — must be identical on every request */
const SSR_SEED = 1337;

/**
 * One random seed per browser tab, created when this module first loads.
 *
 * The homepage is statically prerendered, so its HTML always names the same
 * song. Reading this through useSyncExternalStore lets the server keep the
 * fixed seed while the client swaps to a random one right after hydration —
 * that is the supported way to have a different client value, rather than
 * randomising during render (which breaks hydration) or in an effect.
 */
const VISIT_SEED =
  typeof window === "undefined" ? SSR_SEED : 1 + Math.floor(Math.random() * 99991);

const noopSubscribe = () => () => {};
/** YouTube emits no progress event, so we read the clock ourselves */
const TICK_MS = 300;

/**
 * Runs `fn` when the browser is next idle, with a hard ceiling so it still
 * happens on engines without requestIdleCallback (Safari) or on a device that
 * never goes idle. Returns its own teardown.
 */
function whenIdle(fn: () => void, timeout: number) {
  if (typeof window.requestIdleCallback === "function") {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(fn, Math.min(timeout, 1200));
  return () => window.clearTimeout(id);
}

/** anything that means a real person is here and about to want audio */
const WAKE_EVENTS = ["pointerdown", "keydown", "touchstart", "wheel"] as const;

/**
 * The longest we will hold the player back waiting for a quieter moment.
 *
 * This clock starts at mount, and mount only happens once hydration has run —
 * which means the CSS and JS this page cannot paint without have already been
 * fetched by the time it starts ticking. So the ceiling only has to outlast
 * the tail: the deferred Devanagari faces and the album art. Two seconds does
 * that, and keeps the play button from sitting disabled any longer than it
 * has to for a visitor who lands and does not touch anything.
 */
const BOOT_CEILING_MS = 2000;

export function RadioProvider({
  children,
  initialTrack,
}: {
  children: React.ReactNode;
  /** dedication pages open pinned to one song */
  initialTrack?: Track;
}) {
  // fixed during SSR + hydration, random from the first client render onward
  const visitSeed = useSyncExternalStore(
    noopSubscribe,
    () => VISIT_SEED,
    () => SSR_SEED,
  );
  const [seed, setSeed] = useState(SSR_SEED);
  const [dard, setDardState] = useState(DEFAULT_DARD);
  const [rotation, setRotation] = useState<RotationSlug | null>(null);

  const [queue, setQueue] = useState<Track[]>(() => {
    const tuned = tuneQueue(TRACKS, DEFAULT_DARD, SSR_SEED);
    if (!initialTrack) return tuned;
    return [initialTrack, ...tuned.filter((t) => t.id !== initialTrack.id)];
  });

  /**
   * Derive what to play from the visit seed until the listener takes over.
   * A dedication page is pinned to its own song, and once anyone touches the
   * dial, a rotation or shuffle we stop re-deriving and use `queue` as-is.
   */
  const [listenerDrove, setListenerDrove] = useState(false);
  // memoised: this shuffles all 62 tracks, and the provider re-renders on every
  // playhead tick — un-memoised it was re-sorting the whole catalogue three
  // times a second for the entire length of every song
  const randomised = useMemo(
    () =>
      !initialTrack && !listenerDrove && visitSeed !== seed
        ? tuneQueue(TRACKS, dard, visitSeed)
        : null,
    [dard, initialTrack, listenerDrove, seed, visitSeed],
  );
  const liveQueue = randomised ?? queue;

  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPaused, setIsPaused] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [stats, setStats] = useState<SessionStats>({
    played: 0,
    listened: 0,
    rotations: [],
    peakDard: 0,
  });

  const playerRef = useRef<YTPlayer | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  /** the video id the player currently holds, so we only reload on change */
  const loadedVideoRef = useRef<string | null>(null);
  /** which entry of current.yt we're on — bumped when a video refuses to embed */
  const candidateRef = useRef(0);
  /** true once the listener has tapped play; also gates autoplay on track change */
  const startedRef = useRef(false);
  const lastPositionRef = useRef(0);
  /** listening time in ms, tallied every tick but published only per minute */
  const listenedRef = useRef(0);
  const listenedMinutesRef = useRef(0);

  const current = liveQueue[index] ?? null;
  const currentRef = useRef<Track | null>(current);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  /** transport callbacks the player's event handlers need before they exist */
  const nextRef = useRef<() => void>(() => {});
  /** same, for the OS media controls — they outlive any one render */
  const prevRef = useRef<() => void>(() => {});
  const startRef = useRef<() => void>(() => {});

  /* ---------------- session stats ---------------- */

  /**
   * Counted from the transport rather than an effect: every track change comes
   * from either a tap or the end-of-song handler, so this is the honest place
   * to tally it and it never double-counts a re-render.
   */
  const recordPlay = useCallback((track: Track | null | undefined) => {
    if (!track) return;
    setStats((s) => ({
      played: s.played + 1,
      listened: s.listened,
      rotations: [track.rotation, ...s.rotations.filter((r) => r !== track.rotation)],
      peakDard: Math.max(s.peakDard, track.dard),
    }));
  }, []);

  /* ---------------- player lifecycle ---------------- */

  const attachHost = useCallback((el: HTMLDivElement | null) => {
    hostRef.current = el;
  }, []);

  /**
   * Build the player.
   *
   * This used to fire the instant the provider mounted, which meant a visitor
   * on a slow connection spent their first seconds downloading YouTube's
   * iframe API and the embed behind it — the better part of a megabyte of
   * third-party code — while the page's own CSS, fonts and JS queued behind
   * it. Nothing on screen needs any of it until someone presses play.
   *
   * So it is deferred to the first of three things:
   *
   *   - the visitor touching the page at all, which is the common case and
   *     puts the player well ahead of any finger reaching the transport;
   *   - the `load` event, i.e. the page's own resources are done competing;
   *   - a hard ceiling, because on a bad connection `load` can be a very long
   *     way off and a station that never boots is worse than a slow one.
   *
   * The transport keeps its existing contract either way: the play button
   * stays disabled until `ready`, so the first `playVideo()` is still made
   * inside a real user gesture. That matters — iOS will not start audio from
   * a callback that is not gesture-descended.
   */
  useEffect(() => {
    let cancelled = false;
    if (!hostRef.current || playerRef.current) return;

    const firstVideo = liveQueue[0]?.yt[0];
    if (!firstVideo) return;

    let booted = false;
    let cancelIdle: (() => void) | undefined;

    const boot = () => {
      if (booted || cancelled) return;
      booted = true;
      teardownTriggers();
      build();
    };

    const ceiling = window.setTimeout(boot, BOOT_CEILING_MS);

    const teardownTriggers = () => {
      cancelIdle?.();
      window.clearTimeout(ceiling);
      for (const type of WAKE_EVENTS) {
        window.removeEventListener(type, boot, true);
      }
      window.removeEventListener("load", onLoad);
    };

    // `load` says the critical path is clear; idle then waits for a gap in the
    // main thread so building the player does not stall the first scroll.
    const onLoad = () => {
      cancelIdle = whenIdle(boot, 1000);
    };

    for (const type of WAKE_EVENTS) {
      window.addEventListener(type, boot, { capture: true, passive: true });
    }
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);

    function build() {
      loadYouTubeApi()
        .then((Player) => {
          const host = hostRef.current;
          if (cancelled || !host || playerRef.current) return;

          // YouTube REPLACES the element it is given, so hand it a node React
          // does not own — otherwise React trips over the missing child later.
          const mount = document.createElement("div");
          // the iframe sizes against this node, so it has to fill the host box
          mount.style.width = "100%";
          mount.style.height = "100%";
          host.appendChild(mount);

          // Read the wanted video FRESH here, not from the value captured when
          // this effect started: the random visit queue often resolves while
          // the YouTube API is still loading, and using the stale id left the
          // player holding the prerendered song while the UI showed the random
          // one. Deferring construction widens that window, so it matters more
          // now than it did.
          const wanted = currentRef.current?.yt[0] ?? firstVideo;
          loadedVideoRef.current = wanted;
          playerRef.current = new Player(mount, {
            videoId: wanted,
            width: "100%",
            height: "100%",
            playerVars: playerVars(window.location.origin),
            events: {
              onReady: () => {
                if (cancelled) return;
                setReady(true);
                if (startedRef.current) playerRef.current?.playVideo();
              },
              onStateChange: (e) => {
                if (cancelled) return;
                setIsBuffering(e.data === YT_STATE.BUFFERING);
                if (e.data === YT_STATE.PLAYING) setIsPaused(false);
                if (e.data === YT_STATE.PAUSED) setIsPaused(true);
                if (e.data === YT_STATE.ENDED) nextRef.current();
              },
              onError: (e) => {
                if (cancelled) return;
                if (!FATAL_YT_ERRORS.has(e.data)) return;

                // try the next upload we found for this song before giving up
                const track = currentRef.current;
                const nextCandidate = candidateRef.current + 1;
                const fallback = track?.yt[nextCandidate];
                if (fallback) {
                  candidateRef.current = nextCandidate;
                  loadedVideoRef.current = fallback;
                  playerRef.current?.loadVideoById(fallback);
                } else {
                  nextRef.current();
                }
              },
            },
          });
        })
        .catch(() => {
          if (!cancelled) setFailed(true);
        });
    }

    return () => {
      cancelled = true;
      teardownTriggers();
    };
    // only the very first video matters for construction
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- react to track changes ---------------- */

  useEffect(() => {
    const player = playerRef.current;
    if (!player || !current) return;

    const video = current.yt[0];
    if (!video || loadedVideoRef.current === video) return;

    candidateRef.current = 0;
    loadedVideoRef.current = video;
    lastPositionRef.current = 0;
    setPosition(0);
    setDuration(0);

    if (startedRef.current) player.loadVideoById(video);
    else player.cueVideoById(video);
    // `ready` is a dependency so this re-runs once the player exists — until
    // then playerRef is null and the early return above would drop the change
  }, [current, ready]);

  /* ---------------- progress clock ---------------- */

  /**
   * The progress clock.
   *
   * Two things keep this from being a battery drain:
   *
   * 1. It does not run while the tab is hidden. A progress bar nobody can see
   *    is not worth waking the CPU three times a second for — and a phone with
   *    the screen off playing music in a pocket is exactly the case that used
   *    to keep ticking. The playhead is re-read the moment the tab comes back,
   *    so nothing appears stale.
   * 2. Listening time accumulates in a ref and is only committed to state when
   *    the whole-minute value changes, because the minute is all the receipt
   *    ever renders. That is one re-render a minute instead of 200.
   */
  useEffect(() => {
    if (isPaused || !ready) return;

    const read = () => {
      const player = playerRef.current;
      if (!player) return;

      const pos = player.getCurrentTime() * 1000;
      const dur = player.getDuration() * 1000;
      setPosition(pos);
      setDuration(dur);

      const delta = pos - lastPositionRef.current;
      if (delta > 0 && delta < TICK_MS * 4) {
        listenedRef.current += delta;
        const minutes = Math.round(listenedRef.current / 60000);
        if (minutes !== listenedMinutesRef.current) {
          listenedMinutesRef.current = minutes;
          setStats((s) => ({ ...s, listened: listenedRef.current }));
        }
      }
      lastPositionRef.current = pos;
    };

    let id = 0;
    const run = () => {
      window.clearInterval(id);
      // hidden tab: no ticking at all until it is looked at again
      if (document.hidden) return;
      read();
      id = window.setInterval(read, TICK_MS);
    };

    run();
    document.addEventListener("visibilitychange", run);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", run);
    };
  }, [isPaused, ready]);

  /* ---------------- transport ---------------- */

  const goTo = useCallback((nextIndex: number) => {
    setIndex(nextIndex);
  }, []);

  const start = useCallback(() => {
    setStarted(true);
    const first = !startedRef.current;
    startedRef.current = true;
    playerRef.current?.playVideo();
    if (first) recordPlay(currentRef.current);
  }, [recordPlay]);

  const toggle = useCallback(() => {
    if (!startedRef.current) {
      start();
      return;
    }
    if (isPaused) playerRef.current?.playVideo();
    else playerRef.current?.pauseVideo();
  }, [isPaused, start]);

  const next = useCallback(() => {
    setStarted(true);
    startedRef.current = true;
    const at = (index + 1) % liveQueue.length;
    recordPlay(liveQueue[at]);
    goTo(at);
  }, [goTo, index, liveQueue, recordPlay]);

  const prev = useCallback(() => {
    setStarted(true);
    startedRef.current = true;
    // mirror every music app: restart the song if we're past the intro
    if (position > 4000) {
      playerRef.current?.seekTo(0, true);
      return;
    }
    const at = (index - 1 + liveQueue.length) % liveQueue.length;
    recordPlay(liveQueue[at]);
    goTo(at);
  }, [goTo, index, liveQueue, position, recordPlay]);

  useEffect(() => {
    nextRef.current = next;
    prevRef.current = prev;
    startRef.current = start;
  }, [next, prev, start]);

  const playTrack = useCallback(
    (track: Track) => {
      if (!track.playable) return;
      setStarted(true);
      startedRef.current = true;
      setListenerDrove(true);
      recordPlay(track);

      // base this on liveQueue, not the SSR-seeded `queue` state, or the
      // running order would jump back to the prerendered one
      const at = liveQueue.findIndex((t) => t.id === track.id);
      if (at !== -1) {
        setQueue(liveQueue);
        goTo(at);
      } else {
        setQueue([track, ...liveQueue]);
        goTo(0);
      }
    },
    [goTo, liveQueue, recordPlay],
  );

  const playRotation = useCallback(
    (slug: RotationSlug) => {
      setStarted(true);
      startedRef.current = true;
      setListenerDrove(true);
      setRotation(slug);
      const picked = TRACKS.filter((t) => t.rotation === slug && t.playable);
      const rest = tuneQueue(TRACKS, dard, seed).filter((t) => t.rotation !== slug);
      const nextQueue = [...picked, ...rest];
      recordPlay(nextQueue[0]);
      setQueue(nextQueue);
      goTo(0);
    },
    [dard, goTo, recordPlay, seed],
  );

  const setDard = useCallback(
    (level: number) => {
      setDardState(level);
      setListenerDrove(true);
      setRotation(null);
      const tuned = tuneQueue(TRACKS, level, seed);
      // keep the current song playing; the new queue takes over after it ends
      const keep = currentRef.current;
      const at = keep ? tuned.findIndex((t) => t.id === keep.id) : -1;
      if (at === -1 && keep) {
        setQueue([keep, ...tuned.filter((t) => t.id !== keep.id)]);
        setIndex(0);
      } else {
        setQueue(tuned);
        setIndex(at === -1 ? 0 : at);
      }
    },
    [seed],
  );

  const reshuffle = useCallback(() => {
    const nextSeed = (seed * 33 + 7) % 100003;
    const tuned = tuneQueue(TRACKS, dard, nextSeed);
    setSeed(nextSeed);
    setListenerDrove(true);
    setRotation(null);
    setQueue(tuned);
    recordPlay(tuned[0]);
    goTo(0);
    setStarted(true);
    startedRef.current = true;
  }, [dard, goTo, recordPlay, seed]);

  const seekRatio = useCallback(
    (ratio: number) => {
      if (!duration) return;
      const seconds = Math.max(0, Math.min(1, ratio)) * (duration / 1000);
      playerRef.current?.seekTo(seconds, true);
      setPosition(seconds * 1000);
      lastPositionRef.current = seconds * 1000;
    },
    [duration],
  );

  /* ---------------- media keys / lock screen ---------------- */

  /**
   * Lock screen, notification shade, headphone buttons and car head units.
   *
   * This is what "playing in the background" actually means for a web app: the
   * page keeps the audio, and the OS gets a real transport it can drive while
   * the screen is off. Previously only the title and a `nexttrack` handler were
   * registered, so the notification appeared with a next button and nothing
   * else — no play, no pause, no scrubber, no previous.
   *
   * Every handler is registered defensively. Browsers reject actions they do
   * not implement by throwing from setActionHandler, and one unsupported entry
   * must not take the rest of the transport down with it.
   */
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    const ms = navigator.mediaSession;

    ms.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artists,
      album: "Diljale Aashiq — 24×7 dard ka radio",
      artwork: [
        { src: current.art, sizes: "300x300", type: "image/jpeg" },
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    });

    const actions: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => startRef.current()],
      ["pause", () => playerRef.current?.pauseVideo()],
      ["stop", () => playerRef.current?.pauseVideo()],
      ["nexttrack", () => nextRef.current()],
      ["previoustrack", () => prevRef.current()],
      ["seekforward", (d) => nudge(d.seekOffset ?? 10)],
      ["seekbackward", (d) => nudge(-(d.seekOffset ?? 10))],
      [
        "seekto",
        (d) => {
          if (typeof d.seekTime === "number") {
            playerRef.current?.seekTo(d.seekTime, true);
            setPosition(d.seekTime * 1000);
            lastPositionRef.current = d.seekTime * 1000;
          }
        },
      ],
    ];

    const nudge = (by: number) => {
      const player = playerRef.current;
      if (!player) return;
      const to = Math.max(0, player.getCurrentTime() + by);
      player.seekTo(to, true);
      setPosition(to * 1000);
      lastPositionRef.current = to * 1000;
    };

    const registered: MediaSessionAction[] = [];
    for (const [action, handler] of actions) {
      try {
        ms.setActionHandler(action, handler);
        registered.push(action);
      } catch {
        /* this browser does not know the action — the others still work */
      }
    }

    return () => {
      for (const action of registered) {
        try {
          ms.setActionHandler(action, null);
        } catch {
          /* going away anyway */
        }
      }
    };
  }, [current]);

  /* Keep the OS transport honest: whether we are playing, and where we are. */
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = !started || isPaused ? "paused" : "playing";
  }, [isPaused, started]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
    if (!duration || !Number.isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: duration / 1000,
        position: Math.min(position, duration) / 1000,
        playbackRate: 1,
      });
    } catch {
      /* Safari throws on a position past the duration mid-track-change */
    }
  }, [duration, position]);

  // Deliberately free of position/duration — see the note on RadioProgress.
  // This identity only changes on a real event (track change, pause, tap),
  // so the track list and the rotation grid re-render then and not otherwise.
  const value = useMemo<RadioValue>(
    () => ({
      ready, started, failed, queue: liveQueue, index, current, isPaused, isBuffering,
      dard, rotation, stats, attachHost, start, toggle,
      next, prev, playTrack, playRotation, setDard, reshuffle,
    }),
    [
      attachHost, current, dard, failed, index, isBuffering, isPaused,
      liveQueue, next, playRotation, playTrack, prev, ready, reshuffle,
      rotation, setDard, start, started, stats, toggle,
    ],
  );

  const progress = useMemo<RadioProgress>(
    () => ({ position, duration, seekRatio }),
    [duration, position, seekRatio],
  );

  return (
    <RadioContext.Provider value={value}>
      <ProgressContext.Provider value={progress}>{children}</ProgressContext.Provider>
    </RadioContext.Provider>
  );
}
