"use client";

import { useMemo, useState } from "react";
import { ROTATIONS, ROTATION_BY_SLUG } from "@/data/rotations";
import { TRACKS, type RotationSlug } from "@/data/tracks";
import { useRadio } from "./radio-provider";
import { cx, fmtTime } from "@/lib/utils";
import { Play, Search } from "./icons";

const PAGE = 14;

export function TrackList() {
  const { playTrack, current, started, isPaused } = useRadio();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<RotationSlug | "all">("all");
  const [shown, setShown] = useState(PAGE);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TRACKS.filter((t) => {
      if (filter !== "all" && t.rotation !== filter) return false;
      if (!needle) return true;
      return (
        t.title.toLowerCase().includes(needle) ||
        t.artists.toLowerCase().includes(needle) ||
        (t.film?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [filter, q]);

  const visible = results.slice(0, shown);

  return (
    <section
      id="songs"
      className="lazy-section relative z-10 page-w scroll-mt-20 py-10 sm:py-14"
    >
      <div className="mb-5">
        <p className="section-label">Poori tape · पूरी टेप</p>
        <h2 className="mt-2 font-display text-2xl font-extrabold sm:text-4xl">
          {TRACKS.length} Songs, ek hi zakhm
        </h2>
        <p className="mt-1.5 text-xs text-muted/70 sm:text-sm">
          The full playlist. Search by song, artist or film.
        </p>
      </div>

      {/* search */}
      <div className="panel flex items-center gap-2.5 rounded-2xl px-4 py-3">
        <Search className="size-4 shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShown(PAGE);
          }}
          placeholder="Gaana, artist ya film dhoondo…"
          className="w-full bg-transparent text-sm placeholder:text-muted/60 focus:outline-none"
        />
        {q && (
          <button
            onClick={() => setQ("")}
            className="shrink-0 text-xs text-muted hover:text-cream"
            aria-label="Clear search"
          >
            saaf karo
          </button>
        )}
      </div>

      {/* rotation chips */}
      <div className="hide-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {(["all", ...ROTATIONS.map((r) => r.slug)] as const).map((slug) => {
          const active = filter === slug;
          const meta = slug === "all" ? null : ROTATION_BY_SLUG[slug];
          return (
            <button
              key={slug}
              onClick={() => {
                setFilter(slug);
                setShown(PAGE);
              }}
              className={cx(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition",
                active
                  ? "border-transparent text-ink"
                  : "border-cream/12 text-muted hover:border-cream/25 hover:text-cream",
              )}
              style={active ? { background: meta?.from ?? "var(--color-rose)" } : undefined}
            >
              {meta ? meta.name : "Sab"}
            </button>
          );
        })}
      </div>

      {/* rows */}
      <ul className="mt-4 space-y-1.5">
        {visible.map((t, i) => {
          const isCurrent = current?.id === t.id;
          const rot = ROTATION_BY_SLUG[t.rotation];
          return (
            <li key={t.id}>
              <button
                onClick={() => t.playable && playTrack(t)}
                disabled={!t.playable}
                className={cx(
                  "panel panel-hover group flex w-full items-center gap-3 rounded-2xl p-2.5 text-left sm:gap-4 sm:p-3",
                  isCurrent && "border-rose/50 bg-rose/8",
                  !t.playable && "cursor-not-allowed opacity-45",
                )}
              >
                <span className="hidden w-6 shrink-0 text-center text-xs tabular-nums text-muted sm:block">
                  {i + 1}
                </span>

                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-ink-2 sm:size-14">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.art}
                    alt=""
                    loading="lazy"
                    width={120}
                    height={120}
                    className="size-full object-cover"
                  />
                  <span
                    className={cx(
                      "absolute inset-0 grid place-items-center bg-ink/70 transition-opacity",
                      isCurrent && started && !isPaused
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100",
                    )}
                  >
                    <Play className="size-4 text-cream" />
                  </span>
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={cx(
                        "truncate font-display text-sm font-semibold sm:text-base",
                        isCurrent && "text-rose",
                      )}
                    >
                      {t.title}
                    </span>
                    {t.badge && (
                      <span className="hidden shrink-0 rounded-full bg-cream/8 px-2 py-0.5 text-[9px] text-muted sm:inline">
                        {t.badge}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2">
                    <span className="truncate text-[11px] text-muted sm:text-xs">
                      {t.artists}
                    </span>
                  </span>
                </span>

                {/* dard pip */}
                <span
                  className="hidden shrink-0 items-center gap-1.5 sm:flex"
                  title={`Dard level ${t.dard}/10`}
                >
                  <span className="text-[10px] tabular-nums text-muted">{t.dard}</span>
                  <span className="h-1.5 w-14 overflow-hidden rounded-full bg-cream/10">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${t.dard * 10}%`, background: rot.from }}
                    />
                  </span>
                </span>

                <span className="shrink-0 text-[11px] tabular-nums text-muted">
                  {t.playable ? fmtTime(t.duration) : "N/A"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {results.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">
          Kuch nahi mila. Shayad woh gaana bhi chhod ke chala gaya.
        </p>
      )}

      {shown < results.length && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShown((s) => s + PAGE)}
            className="rounded-full border border-cream/15 px-6 py-2.5 text-sm font-medium text-cream/80 transition hover:border-rose/50 hover:text-cream"
          >
            Aur {results.length - shown} gaane dikhao
          </button>
        </div>
      )}
    </section>
  );
}
