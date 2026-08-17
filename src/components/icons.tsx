/** Hand-rolled inline icons — no icon package, nothing extra to ship. */

type P = { className?: string };

export const Play = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M8 5.14v13.72a1 1 0 0 0 1.54.84l10.3-6.86a1 1 0 0 0 0-1.68L9.54 4.3A1 1 0 0 0 8 5.14Z" />
  </svg>
);

export const Pause = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <rect x="6" y="4.5" width="4" height="15" rx="1.4" />
    <rect x="14" y="4.5" width="4" height="15" rx="1.4" />
  </svg>
);

export const Next = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M5 5.6v12.8a1 1 0 0 0 1.55.83l9-6.4a1 1 0 0 0 0-1.66l-9-6.4A1 1 0 0 0 5 5.6Z" />
    <rect x="17" y="4.5" width="2.6" height="15" rx="1.2" />
  </svg>
);

export const Prev = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M19 5.6v12.8a1 1 0 0 1-1.55.83l-9-6.4a1 1 0 0 1 0-1.66l9-6.4A1 1 0 0 1 19 5.6Z" />
    <rect x="4.4" y="4.5" width="2.6" height="15" rx="1.2" />
  </svg>
);

export const Shuffle = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M16 3h5v5" /><path d="M4 20 21 3" /><path d="M21 16v5h-5" />
    <path d="m15 15 6 6" /><path d="M4 4l5 5" />
  </svg>
);

export const Heart = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 21s-7.5-4.6-9.6-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.6 12c-2.1 4.4-9.6 9-9.6 9Z" />
  </svg>
);

export const BrokenHeart = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <path
      d="M12 21s-7.5-4.6-9.6-9A5.4 5.4 0 0 1 12 6.2 5.4 5.4 0 0 1 21.6 12c-2.1 4.4-9.6 9-9.6 9Z"
      fill="currentColor"
    />
    <path d="M12 6.2 9.7 11l3.4 1.9L10.6 17" stroke="#0a0508" strokeWidth="1.6"
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** YouTube Music: a ring with a play triangle inside */
export const YouTubeMusic = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="1.7" />
    <path d="M10.1 8.6v6.8L16 12l-5.9-3.4Z" fill="currentColor" />
  </svg>
);

export const Share = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 3v13" /><path d="m7 8 5-5 5 5" />
    <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
);

export const Copy = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="9" y="9" width="12" height="12" rx="2.5" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

export const Check = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="m5 13 4.5 4.5L19 7" />
  </svg>
);

export const Download = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" />
  </svg>
);

export const Search = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" className={className} aria-hidden>
    <circle cx="11" cy="11" r="6.5" /><path d="m20 20-3.6-3.6" />
  </svg>
);

export const Chevron = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const Rain = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M7 15a4.5 4.5 0 0 1 .6-8.96 5.5 5.5 0 0 1 10.6 1.5A3.75 3.75 0 0 1 17.5 15Z" />
    <path d="M8 18.5 7 21M12 18.5 11 21M16 18.5 15 21" />
  </svg>
);

export const Cup = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M4 9h12v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5Z" />
    <path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16" />
    <path d="M7 3v2.5M11 3v2.5" />
  </svg>
);

export const Train = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="5" y="3" width="14" height="13" rx="4" />
    <path d="M5 10h14" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" />
    <path d="m7 19-2 2M17 19l2 2" />
  </svg>
);

export const Fan = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <circle cx="12" cy="12" r="2" />
    <path d="M12 10c0-4 1-6 3.5-6S18 8 12 10Z" />
    <path d="M14 12c4 0 6 1 6 3.5S16 18 14 12Z" />
    <path d="M10 14c0 4-1 6-3.5 6S6 16 10 14Z" />
    <path d="M10 10c-4 0-6-1-6-3.5S8 6 10 10Z" />
  </svg>
);

export const Cassette = ({ className }: P) => (
  <svg viewBox="0 0 48 32" fill="none" className={className} aria-hidden>
    <rect x="1" y="1" width="46" height="30" rx="4" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="32" cy="16" r="6" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="16" cy="16" r="1.8" fill="currentColor" />
    <circle cx="32" cy="16" r="1.8" fill="currentColor" />
    <path d="M12 27h24" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
