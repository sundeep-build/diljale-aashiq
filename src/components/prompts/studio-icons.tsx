/** Icons only the prompts section uses. Same rules as ../icons.tsx: inline, no package. */

type P = { className?: string };

export const Sparkle = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2.5c.4 0 .7.3.8.7l1.1 4.3a4 4 0 0 0 2.9 2.9l4.3 1.1a.8.8 0 0 1 0 1.6l-4.3 1.1a4 4 0 0 0-2.9 2.9l-1.1 4.3a.8.8 0 0 1-1.6 0l-1.1-4.3a4 4 0 0 0-2.9-2.9L2.9 13a.8.8 0 0 1 0-1.6l4.3-1.1a4 4 0 0 0 2.9-2.9l1.1-4.3c.1-.4.4-.6.8-.6Z" />
  </svg>
);

export const ImageIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="3" y="4" width="18" height="16" rx="3" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m21 16-5-5-9 9" />
  </svg>
);

export const VideoIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <rect x="2.5" y="5" width="14" height="14" rx="3" />
    <path d="m16.5 10.5 5-3v9l-5-3" />
  </svg>
);

export const Arrow = ({ className }: P) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
