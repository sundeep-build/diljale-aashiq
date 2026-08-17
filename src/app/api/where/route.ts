import { NextResponse } from "next/server";

/**
 * The visitor's city, for the station line ("LUDHIANA · RAAT 2 BAJE").
 *
 * Read straight off the edge request headers the host already attaches — no
 * geolocation prompt, no third-party lookup service, no API key, no cost. We
 * take the city name and nothing else: no coordinates, no IP, nothing stored
 * and nothing logged.
 *
 * Locally, and on any host that doesn't provide these, the headers are absent
 * and we fall back to the station's home town.
 */

export const dynamic = "force-dynamic";
export const runtime = "edge";

/** where the station "broadcasts" from when we can't tell where you are */
const HOME = "Jalandhar";

/** Vercel percent-encodes these, since city names can contain spaces */
function decode(value: string | null) {
  if (!value) return null;
  try {
    const clean = decodeURIComponent(value).trim();
    return clean.length > 1 && clean.length < 40 ? clean : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const h = request.headers;

  const city =
    decode(h.get("x-vercel-ip-city")) ?? // Vercel
    decode(h.get("cf-ipcity")) ?? // Cloudflare, if it ever sits in front
    null;

  const country =
    decode(h.get("x-vercel-ip-country")) ?? decode(h.get("cf-ipcountry")) ?? null;

  return NextResponse.json(
    { city: city ?? HOME, country, guessed: city === null },
    { headers: { "cache-control": "no-store" } },
  );
}
