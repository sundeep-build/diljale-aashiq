import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CATEGORY_SLUGS,
  getCategory,
  getPromptsByCategory,
  getTopTags,
  isCategory,
  toSummary,
} from "@/lib/prompts";
import { PromptBrowser } from "@/components/prompts/prompt-browser";
import { ImageIcon, VideoIcon } from "@/components/prompts/studio-icons";

type Props = { params: Promise<{ category: string }> };

/** The categories are a closed set — anything else is a 404, not a render. */
export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};
  const c = getCategory(category);
  return {
    title: `${c.heading} — free & copy-ready`,
    description: c.blurb,
    alternates: { canonical: `/prompts/${category}` },
    openGraph: { title: c.heading, description: c.blurb },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  if (!isCategory(category)) notFound();

  const c = getCategory(category);
  const prompts = getPromptsByCategory(category);
  const Icon = category === "video" ? VideoIcon : ImageIcon;

  return (
    <div className="page-w">
      <section className="pt-10 pb-10 sm:pt-16">
        <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
          <Link href="/prompts" className="hover:text-white">Prompts</Link>
          <span className="mx-2 text-zinc-700">/</span>
          <span className="text-zinc-300">{c.label}</span>
        </nav>

        <div className="mt-6 flex items-start gap-4">
          <span className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-violet-500/30 to-fuchsia-500/20 text-white ring-1 ring-white/15 sm:grid">
            <Icon className="size-6" />
          </span>
          <div className="max-w-3xl">
            <h1 className="font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance text-white sm:text-5xl">
              {c.heading.replace(/Prompts$/, "")}
              <span className="text-gradient">Prompts</span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">{c.blurb}</p>
          </div>
        </div>
      </section>

      <PromptBrowser prompts={prompts.map(toSummary)} tags={getTopTags(prompts)} />
    </div>
  );
}
