import type { Metadata, Viewport } from "next";
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

/** brush-pen wordmark, and the rare font that covers Latin AND Devanagari */
const kalam = Kalam({
  variable: "--font-kalam",
  subsets: ["latin", "devanagari"],
  weight: ["400", "700"],
  display: "swap",
});

const deva = Noto_Serif_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari", "latin"],
  weight: ["400", "600", "700"],
  display: "swap",
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
