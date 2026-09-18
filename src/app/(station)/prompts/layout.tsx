import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { PromptsHeader } from "@/components/prompts/prompts-header";
import { PromptsFooter } from "@/components/prompts/prompts-footer";
import { NowPlaying } from "@/components/prompts/now-playing";
import { ADSENSE_CLIENT } from "@/lib/ads";
import "./studio.css";

export const metadata: Metadata = {
  title: {
    default: "AI Image & Video Prompts — free, copy-ready",
    template: "%s · AI Prompts",
  },
  description:
    "Free, hand-written AI prompts for images and video — Midjourney, Flux, GPT Image, Veo, Sora, Kling and Runway — with settings and tips.",
  // the root layout's keywords are about sad songs; these pages are not
  keywords: [
    "ai prompts", "ai image prompts", "ai video prompts", "midjourney prompts",
    "veo prompts", "sora prompts", "kling prompts", "flux prompts",
  ],
  openGraph: { type: "website", siteName: "AI Prompts · Diljale Aashiq" },
};

// the browser chrome should match the studio's near-black, not the radio's brown
export const viewport: Viewport = { themeColor: "#09090b" };

/**
 * Every page under /prompts. Loads the studio theme and, when a publisher ID
 * is set, Google's AdSense script in Auto ads mode — Google places the ads
 * itself, so no page carries an ad slot. The radio pages never load either.
 *
 * The radio itself comes from the (station) layout above this one, so a song
 * started on the home page keeps playing here; NowPlaying is its remote.
 */
export default function PromptsLayout({ children }: { children: React.ReactNode }) {
  return (
    // the root <html> is hi-Latn for the radio; this section is written in English
    <div lang="en" className="studio relative flex min-h-dvh flex-col font-body">
      {ADSENSE_CLIENT && (
        <Script
          id="adsbygoogle-auto"
          async
          strategy="afterInteractive"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
        />
      )}
      <div aria-hidden className="studio-aurora" />
      <div aria-hidden className="studio-grid" />
      <PromptsHeader />
      <main className="flex-1">{children}</main>
      <PromptsFooter />
      <NowPlaying />
    </div>
  );
}
