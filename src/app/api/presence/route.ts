import { NextResponse } from "next/server";

/**
 * Listener numbers — both of them real.
 *
 *   live  — how many people are listening right now. Every open tab heartbeats
 *           an anonymous random session id every 20s; we count ids seen in the
 *           last 45s. Honest, and on a quiet night it is a single digit.
 *
 *   total — how many people have ever listened. Unique session ids since
 *           launch, kept in a HyperLogLog. This is the number that grows past
 *           100 and keeps going, without anybody having to invent it.
 *
 * `total` requires Redis, because an in-process counter resets to zero on every
 * cold start — a "total" that falls back to 0 is worse than no total, so we
 * return null and the UI hides it.
 *
 * Storage, picked automatically:
 *   1. Upstash Redis if UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are
 *      set. Exact across every serverless instance; free tier is ample.
 *   2. Otherwise an in-process Map — live only, and only for this instance.
 *
 * No cookies, no IPs, no fingerprinting. The session id is random, made in the
 * browser, and forgotten when the tab closes.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** how long after its last heartbeat a listener is still "here" */
const WINDOW_MS = 45_000;
const LIVE_KEY = "diljale:listeners";
const TOTAL_KEY = "diljale:total";

const URL_ = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useRedis = Boolean(URL_ && TOKEN);

/* ---------------- backend 1: Upstash Redis ---------------- */

async function redisPipeline(commands: (string | number)[][]) {
  const res = await fetch(`${URL_}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  return (await res.json()) as { result: unknown }[];
}

const asNumber = (v: unknown) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

async function readWithRedis(sessionId: string | null) {
  const now = Date.now();
  const commands: (string | number)[][] = [];

  if (sessionId) {
    commands.push(["ZADD", LIVE_KEY, now, sessionId]);
    // HyperLogLog: counts unique ids forever in ~12KB, no growing set to prune
    commands.push(["PFADD", TOTAL_KEY, sessionId]);
  }
  commands.push(["ZREMRANGEBYSCORE", LIVE_KEY, "-inf", now - WINDOW_MS]);

  const liveAt = commands.length;
  commands.push(["ZCARD", LIVE_KEY]);
  const totalAt = commands.length;
  commands.push(["PFCOUNT", TOTAL_KEY]);
  // the live set can expire when the site goes quiet; the total never should
  commands.push(["EXPIRE", LIVE_KEY, 300]);

  const out = await redisPipeline(commands);
  return {
    live: asNumber(out[liveAt]?.result),
    total: asNumber(out[totalAt]?.result),
  };
}

/* ---------------- backend 2: in-process ---------------- */

const seen = new Map<string, number>();

function readInProcess(sessionId: string | null) {
  const now = Date.now();
  if (sessionId) seen.set(sessionId, now);
  for (const [id, at] of seen) {
    if (now - at > WINDOW_MS) seen.delete(id);
  }
  // no durable total without Redis — null, so the UI shows nothing
  return { live: seen.size, total: null };
}

/* ---------------- handler ---------------- */

async function read(sessionId: string | null) {
  return useRedis ? readWithRedis(sessionId) : readInProcess(sessionId);
}

export async function POST(request: Request) {
  let sessionId: string | null = null;
  try {
    const body = (await request.json()) as { id?: unknown };
    if (typeof body.id === "string" && /^[a-z0-9]{6,40}$/i.test(body.id)) {
      sessionId = body.id;
    }
  } catch {
    /* no body — treat as a read-only poll */
  }

  try {
    const { live, total } = await read(sessionId);
    return NextResponse.json(
      { live, total, exact: useRedis },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    // never invent a number: the UI hides the counters when this fails
    return NextResponse.json(
      { live: null, total: null, exact: false },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }
}

export async function GET() {
  try {
    // read(null) — not seen.size — so stale listeners are pruned first,
    // otherwise a read-only poll reports everyone who ever visited
    const { live, total } = await read(null);
    return NextResponse.json(
      { live, total, exact: useRedis },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { live: null, total: null, exact: false },
      { headers: { "cache-control": "no-store" } },
    );
  }
}
