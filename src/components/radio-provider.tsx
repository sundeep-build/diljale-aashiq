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
  position: number;
  duration: number;
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
  seekRatio: (ratio: number) => void;
};

const RadioContext = createContext<RadioValue | null>(null);

export function useRadio() {
  const ctx = useContext(RadioContext);
  if (!ctx) throw new Error("useRadio must be used inside <RadioProvider>");
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
  const randomised =
    !initialTrack && !listenerDrove && visitSeed !== seed
      ? tuneQueue(TRACKS, dard, visitSeed)
      : null;
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

  const current = liveQueue[index] ?? null;
  const currentRef = useRef<Track | null>(current);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  /** transport callbacks the player's event handlers need before they exist */
  const nextRef = useRef<() => void>(() => {});

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

  useEffect(() => {
    let cancelled = false;
    if (!hostRef.current || playerRef.current) return;

    const firstVideo = liveQueue[0]?.yt[0];
    if (!firstVideo) return;

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
        // this effect started: the random visit queue often resolves while the
        // YouTube API is still loading, and using the stale id left the player
        // holding the prerendered song while the UI showed the random one.
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

    return () => {
      cancelled = true;
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

  useEffect(() => {
    if (isPaused || !ready) return;
    const id = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;

      const pos = player.getCurrentTime() * 1000;
      const dur = player.getDuration() * 1000;
      setPosition(pos);
      setDuration(dur);

      const delta = pos - lastPositionRef.current;
      if (delta > 0 && delta < TICK_MS * 4) {
        setStats((s) => ({ ...s, listened: s.listened + delta }));
      }
      lastPositionRef.current = pos;
    }, TICK_MS);
    return () => window.clearInterval(id);
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
  }, [next]);

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

  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artists,
      album: "Diljale Aashiq — 24×7 dard ka radio",
      artwork: [{ src: current.art, sizes: "300x300", type: "image/jpeg" }],
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => nextRef.current());
    return () => {
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [current]);

  const value = useMemo<RadioValue>(
    () => ({
      ready, started, failed, queue: liveQueue, index, current, isPaused, isBuffering,
      position, duration, dard, rotation, stats, attachHost, start, toggle,
      next, prev, playTrack, playRotation, setDard, reshuffle, seekRatio,
    }),
    [
      attachHost, current, dard, duration, failed, index, isBuffering, isPaused,
      liveQueue, next, playRotation, playTrack, position, prev, ready, reshuffle,
      rotation, seekRatio, setDard, start, started, stats, toggle,
    ],
  );

  return <RadioContext.Provider value={value}>{children}</RadioContext.Provider>;
}
