/**
 * Google AdSense, in Auto ads mode: the page loads Google's script once and
 * Google decides where ads go and how many. There are no hand-placed slots in
 * the markup — turn Auto ads on (and tune ad load / excluded areas) in
 * AdSense → Ads → By site.
 *
 *   NEXT_PUBLIC_ADSENSE_CLIENT   ca-pub-XXXXXXXXXXXXXXXX
 *
 * Unset (local, preview) means no ads at all — clicking your own ads gets an
 * AdSense account banned.
 */

/** `ca-pub-…`, or null when ads are off. */
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() || null;
