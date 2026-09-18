import { ADSENSE_CLIENT } from "@/lib/ads";

/**
 * /ads.txt — AdSense warns "Earnings at risk" and can withhold ads until this
 * file lists the publisher ID. Built from the same env var as the ad code, so
 * the two can never disagree.
 */
// route handlers are dynamic by default; this one only changes on redeploy
export const dynamic = "force-static";

export function GET() {
  // ADSENSE_CLIENT is "ca-pub-…"; ads.txt wants the "pub-…" part
  const body = ADSENSE_CLIENT
    ? `google.com, ${ADSENSE_CLIENT.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "# ads.txt: set NEXT_PUBLIC_ADSENSE_CLIENT to publish the AdSense record\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
