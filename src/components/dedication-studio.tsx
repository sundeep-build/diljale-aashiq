"use client";

import { useMemo, useState } from "react";
import { TRACKS } from "@/data/tracks";
import { ROTATION_BY_SLUG } from "@/data/rotations";
import { encodeDedication, LIMITS } from "@/lib/dedication";
import { cx } from "@/lib/utils";
import { useRadio } from "./radio-provider";
import { Check, Copy, Search, Share } from "./icons";
import { DedicationCard } from "./dedication-card";

/**
 * Flagship feature: write someone a dedication, get a link.
 *
 * The whole dedication is base64'd into the URL, so there is no database, no
 * KV store and no row limit — it stays free forever and every link works
 * even years later. WhatsApp gets a proper preview because /d/[payload]
 * generates its own OG image on the edge.
 */
export function DedicationStudio() {
  const { current, playTrack } = useRadio();
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [note, setNote] = useState("");
  const [trackId, setTrackId] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState(false);

  // default to whatever the station is playing right now
  const track = useMemo(
    () => TRACKS.find((t) => t.id === trackId) ?? current ?? TRACKS[0],
    [current, trackId],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const pool = TRACKS.filter((t) => t.playable);
    if (!needle) return pool.slice(0, 40);
    return pool
      .filter(
        (t) =>
          t.title.toLowerCase().includes(needle) ||
          t.artists.toLowerCase().includes(needle),
      )
      .slice(0, 40);
  }, [q]);

  const payload = encodeDedication({
    to: to || "Tumhare liye",
    from,
    note: note || "Ye gaana sun lena. Bas itna hi.",
    trackId: track.id,
  });
  const path = `/d/${payload}`;
  const ready = to.trim().length > 0;
  // resolved at click time so there is no window access during render
  const absolute = () => `${window.location.origin}${path}`;

  const copy = async () => {
    const link = absolute();
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // clipboard is blocked in some in-app browsers — fall back to a prompt
      window.prompt("Link copy karo:", link);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const share = async () => {
    const link = absolute();
    const text = `${to || "Tumhare liye"} — ye gaana tumhare naam 💔`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Diljale Aashiq", text, url: link });
        return;
      } catch {
        /* user dismissed the sheet */
      }
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`,
      "_blank",
      "noopener",
    );
  };

  const rot = ROTATION_BY_SLUG[track.rotation];

  return (
    <section
      id="dedicate"
      className="relative z-10 page-w scroll-mt-20 py-10 sm:py-14"
    >
      <div className="mb-6 text-center">
        <p className="section-label">Naya feature · Dil se dil tak</p>
        <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-4xl">
          Ek Song, kisi ke <span className="text-rose">naam</span> kar do
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-muted">
          Naam likho, do lafz likho, gaana chuno — aur ek link mil jayega.
          Woh link kholte hi unke phone pe wahi gaana bajega.
          <span className="mt-2 block text-xs text-muted/70">
            Write a name, a line, pick a song — you get a shareable link. No
            account, no sign-up.
          </span>
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        {/* ---------------- form ---------------- */}
        {/* min-w-0: without it the grid track is floored at this column's
          min-content width, and the nowrap share link below would stretch
          the column past the viewport instead of truncating. */}
        <div className="panel min-w-0 rounded-3xl p-4 sm:p-7">
          <Field label="Kiske liye?" hint={`${to.length}/${LIMITS.to}`}>
            <input
              value={to}
              maxLength={LIMITS.to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Unka naam…"
              className="w-full bg-transparent font-display text-lg font-semibold placeholder:font-normal placeholder:text-muted/50 focus:outline-none"
            />
          </Field>

          <Field label="Do lafz" hint={`${note.length}/${LIMITS.note}`}>
            <textarea
              value={note}
              maxLength={LIMITS.note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Jo kabhi keh nahi paaye…"
              className="w-full resize-none bg-transparent text-sm leading-relaxed placeholder:text-muted/50 focus:outline-none"
            />
          </Field>

          <Field label="Kiski taraf se?" hint={`${from.length}/${LIMITS.from}`}>
            <input
              value={from}
              maxLength={LIMITS.from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="Khaali chhod do — gumnaam reh jaoge"
              className="w-full bg-transparent text-sm placeholder:text-muted/50 focus:outline-none"
            />
          </Field>

          {/* song picker */}
          <div className="mt-4">
            <p className="mb-2 text-[11px] tracking-[0.18em] text-muted uppercase">
              Gaana
            </p>
            <button
              onClick={() => setPicking((p) => !p)}
              className="flex w-full items-center gap-3 rounded-2xl border border-cream/12 p-2.5 text-left transition hover:border-rose/45"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={track.art}
                alt=""
                width={96}
                height={96}
                className="size-12 shrink-0 rounded-xl object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-sm font-semibold">
                  {track.title}
                </span>
                <span className="block truncate text-[11px] text-muted">
                  {track.artists}
                </span>
              </span>
              <span className="shrink-0 text-[11px] text-rose-soft">
                {picking ? "band karo" : "badlo"}
              </span>
            </button>

            {picking && (
              <div className="mt-2 rounded-2xl border border-cream/12 bg-ink-2/80 p-2">
                <div className="flex items-center gap-2 rounded-xl bg-cream/6 px-3 py-2">
                  <Search className="size-3.5 shrink-0 text-muted" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Gaana dhoondo…"
                    className="w-full bg-transparent text-xs placeholder:text-muted/60 focus:outline-none"
                    autoFocus
                  />
                </div>
                <ul className="mt-2 max-h-64 space-y-0.5 overflow-y-auto pr-1">
                  {filtered.map((t) => (
                    <li key={t.id}>
                      <button
                        onClick={() => {
                          setTrackId(t.id);
                          setPicking(false);
                          setQ("");
                        }}
                        className={cx(
                          "flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition hover:bg-cream/8",
                          t.id === track.id && "bg-rose/12",
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={t.art}
                          alt=""
                          loading="lazy"
                          width={80}
                          height={80}
                          className="size-9 shrink-0 rounded-lg object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-medium">
                            {t.title}
                          </span>
                          <span className="block truncate text-[10px] text-muted">
                            {t.artists}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={share}
              disabled={!ready}
              className="flex items-center gap-2 rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_var(--color-rose)] transition active:scale-95 disabled:opacity-40 disabled:shadow-none"
            >
              <Share className="size-4" />
              Share Now
            </button>
            <button
              onClick={copy}
              disabled={!ready}
              className="flex items-center gap-2 rounded-full border border-cream/15 px-5 py-2.5 text-sm font-medium text-cream/85 transition hover:border-rose/45 disabled:opacity-40"
            >
              {copied ? <Check className="size-4 text-rose" /> : <Copy className="size-4" />}
              {copied ? "Link copied!" : "Copy Link"}
            </button>
            <button
              onClick={() => playTrack(track)}
              className="rounded-full border border-cream/15 px-5 py-2.5 text-sm font-medium text-cream/85 transition hover:border-rose/45"
            >
              Play now
            </button>
          </div>

          {!ready && (
            <p className="mt-3 text-[11px] text-muted">
              Naam likhoge tabhi link banega.
            </p>
          )}
          {ready && (
            <p className="mt-3 truncate rounded-xl bg-ink/60 px-3 py-2 font-mono text-[10px] text-muted">
              {path}
            </p>
          )}
        </div>

        {/* ---------------- live preview ---------------- */}
        <div className="relative min-w-0">
          <p className="mb-2 text-center text-[11px] tracking-[0.18em] text-muted uppercase">
            Woh ye dekhenge
          </p>
          <DedicationCard
            to={to || "Tumhare liye"}
            from={from}
            note={note || "Ye gaana sun lena. Bas itna hi."}
            track={track}
            accent={rot.from}
            compact
          />
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-4 block first:mt-0">
      <span className="mb-2 flex items-center justify-between">
        <span className="text-[11px] tracking-[0.18em] text-muted uppercase">{label}</span>
        {hint && <span className="text-[10px] tabular-nums text-muted/60">{hint}</span>}
      </span>
      <span className="block rounded-2xl border border-cream/12 bg-cream/4 px-4 py-3 transition-colors focus-within:border-rose/50">
        {children}
      </span>
    </label>
  );
}
