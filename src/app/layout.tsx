import type { Metadata, Viewport } from "next";
import ReactDOM from "react-dom";
import {
  Bricolage_Grotesque,
  DM_Sans,
  Kalam,
  Noto_Serif_Devanagari,
} from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

/**
 * The brush-pen wordmark, and nothing else. `.brush` pins font-weight to 700
 * and every string it wraps is Latin — all Devanagari on the site goes through
 * `--font-deva` below — so the 400 weight and the devanagari subset were two
 * font files nobody ever rendered a glyph from.
 */
const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

/**
 * Devanagari, at the two weights the markup actually asks for (400 and 700 —
 * 600 was never used).
 *
 * `preload: false` on purpose. Devanagari here is secondary text: subtitles,
 * chip labels, the odd accent line. Preloading it put ~130KB at the front of
 * the queue on every first visit, ahead of the CSS and JS the page cannot
 * paint without. It still loads and still swaps in — it just waits its turn.
 */
const deva = Noto_Serif_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari", "latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Diljale Aashiq — 24×7 dard ka radio",
    template: "%s · Diljale Aashiq",
  },
  description:
    "Ek non-stop heartbreak radio station. Dard-o-Meter ghumao, Tapri Mode chalao, aur kisi ke naam ek gaana kar do.",
  applicationName: "Diljale Aashiq",
  manifest: "/manifest.webmanifest",
  keywords: [
    "sad hindi songs", "breakup songs", "heartbreak radio", "lofi hindi",
    "Arijit Singh", "dard bhare gaane", "diljale aashiq",
  ],
  openGraph: {
    type: "website",
    siteName: "Diljale Aashiq",
    title: "Diljale Aashiq — 24×7 dard ka radio",
    description:
      "Playlist mat chuno, dard chuno. Ek non-stop heartbreak radio station.",
  },
  twitter: { card: "summary_large_image" },
  appleWebApp: {
    capable: true,
    title: "Diljale Aashiq",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0508",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  /* The album art in the hero and in every track row comes from ytimg, and the
     player itself is fetched from youtube.com once the page has settled. Both
     handshakes are worth opening up front — several hundred milliseconds each
     on a slow link, paid before anything asks rather than during.

     The Metadata API has no field for resource hints; `react-dom`'s methods
     are the documented way to get them into <head>. See
     node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md
     ("Resource hints"). */
  ReactDOM.preconnect("https://i.ytimg.com");
  ReactDOM.preconnect("https://www.youtube.com");
  ReactDOM.prefetchDNS("https://s.ytimg.com");

  return (
    /* The font variables must sit on <html>, not <body>: Tailwind's @theme
       declares --font-display / --font-body / --font-brush on :root, and a
       var() inside a custom property is resolved on the element that declares
       it. With the faces on <body> those aliases were unresolvable, so every
       one of them silently fell back to system sans. */
    <html
      lang="hi-Latn"
      className={`dark ${bricolage.variable} ${dmSans.variable} ${deva.variable} ${kalam.variable}`}
    >
      <body className="grain scanlines antialiased">
        {children}
      </body>
    </html>
  );
}
