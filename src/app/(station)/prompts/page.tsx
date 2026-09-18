import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/data/prompts";
import {
  getAllPrompts,
  getPromptsByCategory,
  getTopTags,
  toSummary,
} from "@/lib/prompts";
import { PromptBrowser } from "@/components/prompts/prompt-browser";
import { coverStyle } from "@/components/prompts/cover";
import { Arrow, ImageIcon, Sparkle, VideoIcon } from "@/components/prompts/studio-icons";

export const metadata: Metadata = {
  // absolute: the layout's "%s · AI Prompts" template would repeat itself here
  title: { absolute: "Free AI Image & Video Prompts — copy-ready · Diljale Aashiq" },
  alternates: { canonical: "/prompts" },
};

export default function PromptsHome() {
  const prompts = getAllPrompts();
  const tools = new Set(prompts.flatMap((p) => p.models)).size;

  return (
    <div className="page-w">
      <section className="mx-auto max-w-3xl pt-16 pb-12 text-center sm:pt-24">
        <p className="glass mx-auto inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-zinc-300">
          <Sparkle className="size-3.5 text-fuchsia-400" />
          {prompts.length} free prompts · updated every week
        </p>
        <h1 className="mt-6 font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-tight text-balance text-white sm:text-6xl lg:text-7xl">
          Prompts that make AI <span className="text-gradient">look good</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
          Hand-written image and video prompts with the exact settings to use and
          what to fix when it goes wrong. Copy, paste, create.
        </p>

        <dl className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-3">
          <Stat value={prompts.length} label="Prompts" />
          <Stat value={Object.keys(CATEGORIES).length} label="Categories" />
          <Stat value={tools} label="AI tools" />
        </dl>
      </section>

      <section className="grid gap-5 md:grid-cols-2" aria-label="Categories">
        {Object.values(CATEGORIES).map((c) => {
          const list = getPromptsByCategory(c.slug);
          const Icon = c.slug === "video" ? VideoIcon : ImageIcon;
          return (
            <Link
              key={c.slug}
              href={`/prompts/${c.slug}`}
              className="glass lift group relative overflow-hidden rounded-3xl p-6 sm:p-8"
            >
              {/* the category's own cover, faded in behind the text */}
              <div
                aria-hidden
                className="absolute inset-0 opacity-35 transition-opacity group-hover:opacity-50"
                style={coverStyle(c.slug)}
              />
              <div className="relative">
                <span className="grid size-11 place-items-center rounded-xl bg-white/10 text-white ring-1 ring-white/15">
                  <Icon className="size-5" />
                </span>
                <h2 className="mt-5 font-display text-2xl font-bold text-white sm:text-3xl">
                  {c.heading}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-300">{c.blurb}</p>
                <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-white">
                  Browse {list.length} prompts
                  <Arrow className="size-4 transition-transform group-hover:translate-x-1" />
                </p>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="mt-20" aria-labelledby="latest">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 id="latest" className="font-display text-3xl font-bold tracking-tight text-white">
              Latest prompts
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Fresh additions, newest first.</p>
          </div>
        </div>
        <PromptBrowser prompts={prompts.map(toSummary)} tags={getTopTags(prompts)} />
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="glass rounded-2xl px-3 py-3">
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-2xl font-bold text-white">{value}</span>
        <span className="text-xs text-zinc-500">{label}</span>
      </dd>
    </div>
  );
}
