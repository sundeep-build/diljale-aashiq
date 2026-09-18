/** Site-level constants that more than one component needs to agree on. */

/** Where anyone writing in about the station should land. */
export const CONTACT_EMAIL = "SundeepGupta027@gmail.com";

/**
 * The canonical origin. Metadata, the sitemap and robots.txt all build
 * absolute URLs from this, so it must agree with wherever the site is served.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
