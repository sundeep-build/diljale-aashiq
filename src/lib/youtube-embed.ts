/**
 * Loader + typings for YouTube's official IFrame Player API.
 *
 * Why YouTube and not Spotify: a Spotify embed only streams a full song to a
 * logged-in Premium listener on desktop — everyone else gets 30 seconds. The
 * YouTube player streams the whole song to anonymous visitors on any device,
 * for free, with no API key at runtime. It's what an always-on station needs.
 *
 * Terms note: the player stays visible and unmuted, at a reasonable size, with
 * ads untouched. Nothing is proxied, downloaded or hidden.
 *
 * Docs: https://developers.google.com/youtube/iframe_api_reference
 */

export const YT_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const;

export type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  loadVideoById(id: string): void;
  cueVideoById(id: string): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  /** seconds */
  getCurrentTime(): number;
  /** seconds; 0 until metadata loads */
  getDuration(): number;
  getPlayerState(): number;
  setVolume(volume: number): void;
  destroy(): void;
};

type PlayerCtor = new (
  element: HTMLElement | string,
  options: {
    videoId?: string;
    width?: string | number;
    height?: string | number;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (e: { target: YTPlayer }) => void;
      onStateChange?: (e: { data: number; target: YTPlayer }) => void;
      onError?: (e: { data: number; target: YTPlayer }) => void;
    };
  },
) => YTPlayer;

declare global {
  interface Window {
    YT?: { Player: PlayerCtor; loaded?: number };
    onYouTubeIframeAPIReady?: () => void;
  }
}

const SRC = "https://www.youtube.com/iframe_api";

let pending: Promise<PlayerCtor> | null = null;

/** Loads the IFrame API once and resolves with the Player constructor. */
export function loadYouTubeApi(): Promise<PlayerCtor> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("loadYouTubeApi is browser-only"));
  }
  if (window.YT?.Player) return Promise.resolve(window.YT.Player);
  if (pending) return pending;

  pending = new Promise<PlayerCtor>((resolve, reject) => {
    // YouTube calls this global exactly once, whoever asked first
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT.Player);
      else reject(new Error("YouTube API loaded without a Player"));
    };

    if (document.querySelector(`script[src="${SRC}"]`)) return;

    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.onerror = () => {
      pending = null;
      reject(new Error("YouTube IFrame API failed to load"));
    };
    document.body.appendChild(script);
  });

  return pending;
}

/**
 * Errors worth giving up on for this particular video:
 * 2 = bad id, 5 = HTML5 player error, 100 = removed/private,
 * 101 / 150 = the uploader disallows embedding.
 */
export const FATAL_YT_ERRORS = new Set([2, 5, 100, 101, 150]);

/**
 * Whether the YouTube iframe is shown on the page.
 *
 * `false` renders it into a 1×1px, opacity-0 box — audio only, no video —
 * which is what saloon.wtf and deluxesalon.in do, and what makes the station
 * feel like a radio rather than an embedded video.
 *
 * The trade-off, stated plainly: YouTube's embed terms require the player to
 * stay visible and unobscured (min 200×200). Hiding it is a terms violation,
 * and the practical risk is YouTube blocking embeds for the domain. Flip this
 * to `true` and the player becomes a small visible panel again — nothing else
 * in the app needs to change.
 */
export const PLAYER_VISIBLE = false;

/** Tailwind classes for the host box, in each mode. */
export const PLAYER_BOX = PLAYER_VISIBLE
  ? "mx-auto aspect-video w-full max-w-[356px] min-h-[200px] overflow-hidden rounded-xl bg-black [&_iframe]:size-full"
  : "pointer-events-none absolute h-px w-px overflow-hidden opacity-0";

export function playerVars(origin: string) {
  return {
    // iOS refuses inline playback without this and hijacks to fullscreen
    playsinline: 1,
    rel: 0,
    iv_load_policy: 3,
    modestbranding: 1,
    // we drive playback from our own transport, so YouTube's chrome is noise
    controls: PLAYER_VISIBLE ? 1 : 0,
    disablekb: 1,
    origin,
  };
}
