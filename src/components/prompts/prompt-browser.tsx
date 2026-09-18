"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { PromptSummary } from "@/lib/prompts";
import { cx } from "@/lib/utils";
import { Search } from "../icons";
import { PromptCard } from "./prompt-card";

/**
 * Search box + tag chips over a list the server already rendered.
 *
 * Every card is in the initial HTML, so crawlers see the whole list and the
 * filter is purely a convenience on top. This holds comfortably into the low
 * hundreds of prompts per page; past that, paginate on the server (one static
 * page per chunk) and keep this component for filtering within a page.
 */
export function PromptBrowser({
  prompts,
  tags,
}: {
  prompts: PromptSummary[];
  tags: string[];
}) {
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  // typing stays responsive even when the grid below is large
  const deferredQuery = useDeferredValue(query);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return prompts.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.models.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [prompts, deferredQuery, tag]);

  return (
    <div>
      <label className="ring-gradient flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-[0_20px_50px_-30px_rgb(139_92_246/0.6)]">
        <Search className="size-5 shrink-0 text-zinc-400" />
        <span className="sr-only">Search prompts</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search prompts — rain, product shot, Veo, portrait…"
          className="w-full bg-transparent text-[15px] text-white placeholder:text-zinc-500 focus:outline-none"
        />
      </label>

      <div className="hide-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <Chip active={tag === null} onClick={() => setTag(null)}>
          All
        </Chip>
        {tags.map((t) => (
          <Chip key={t} active={tag === t} onClick={() => setTag(tag === t ? null : t)}>
            {t}
          </Chip>
        ))}
      </div>

      <p className="mt-6 text-sm text-zinc-500" aria-live="polite">
        {results.length} {results.length === 1 ? "prompt" : "prompts"}
      </p>

      {results.length === 0 ? (
        <p className="glass mt-3 rounded-2xl p-10 text-center text-sm text-zinc-400">
          Nothing matches that yet. Try a broader word, or clear the tag.
        </p>
      ) : (
        <ul className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((p) => (
            <li key={p.slug}>
              <PromptCard prompt={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap capitalize transition",
        active
          ? "bg-white text-zinc-950"
          : "bg-white/[0.05] text-zinc-400 ring-1 ring-white/[0.08] hover:bg-white/[0.09] hover:text-white",
      )}
    >
      {children}
    </button>
  );
}
