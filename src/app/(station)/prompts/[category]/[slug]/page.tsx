import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPrompts,
  getCategory,
  getPrompt,
  getRelatedPrompts,
  promptHref,
  toSummary,
} from "@/lib/prompts";
import { SITE_URL } from "@/lib/site";
import { CopyButton } from "@/components/prompts/copy-button";
import { PromptCard } from "@/components/prompts/prompt-card";
import { coverStyle } from "@/components/prompts/cover";
import { ImageIcon, VideoIcon } from "@/components/prompts/studio-icons";

type Props = { params: Promise<{ category: string; slug: string }> };

/**
 * Every prompt is prerendered at build time. Left `true` so that, once the
 * data moves to a CMS, a prompt published after the last deploy still renders
 * on first request instead of 404ing until the next build.
 */
export const dynamicParams = true;

export function generateStaticParams() {
  return getAllPrompts().map((p) => ({ category: p.category, slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const p = getPrompt(category, slug);
  if (!p) return {};
  const kind = p.category === "video" ? "AI video prompt" : "AI image prompt";
  return {
    title: `${p.title} — ${kind}`,
    description: p.summary,
    keywords: [...p.tags, ...p.models.map((m) => `${m} prompt`)],
    alternates: { canonical: promptHref(p) },
    openGraph: { type: "article", title: `${p.title} — ${kind}`, description: p.summary },
  };
}

export default async function PromptPage({ params }: Props) {
  const { category, slug } = await params;
  const p = getPrompt(category, slug);
  if (!p) notFound();

  const c = getCategory(p.category);
  const related = getRelatedPrompts(p, 3);
  const url = `${SITE_URL}${promptHref(p)}`;
  const Icon = p.category === "video" ? VideoIcon : ImageIcon;

  // Google reads this for rich results. `<` is escaped so prompt text can never
  // close the script tag — see node_modules/next/dist/docs/01-app/02-guides/json-ld.md
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreativeWork",
        name: p.title,
        description: p.summary,
        text: p.prompt,
        keywords: p.tags.join(", "),
        dateCreated: p.added,
        url,
        inLanguage: "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Prompts", item: `${SITE_URL}/prompts` },
          { "@type": "ListItem", position: 2, name: c.label, item: `${SITE_URL}/prompts/${c.slug}` },
          { "@type": "ListItem", position: 3, name: p.title, item: url },
        ],
      },
    ],
  };

  return (
    <article className="page-w pt-8 sm:pt-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-zinc-500">
        <Link href="/prompts" className="hover:text-white">Prompts</Link>
        <span className="mx-2 text-zinc-700">/</span>
        <Link href={`/prompts/${c.slug}`} className="hover:text-white">{c.label}</Link>
      </nav>

      {/* banner: the same generated cover as the card, so the page is
          recognisably "that one" coming from a listing */}
      <header className="relative mt-5 overflow-hidden rounded-3xl p-6 ring-1 ring-white/10 sm:p-10">
        <div aria-hidden className="absolute inset-0 opacity-70" style={coverStyle(p.slug)} />
        <div aria-hidden className="absolute inset-0 bg-linear-to-t from-zinc-950/90 via-zinc-950/40 to-transparent" />
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs font-medium text-white/90">
            <Icon className="size-3.5" />
            {p.category === "video" ? "Video prompt" : "Image prompt"}
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-3xl leading-[1.06] font-extrabold tracking-tight text-balance text-white sm:text-5xl">
            {p.title}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-300">{p.summary}</p>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Works with">
            {p.models.map((m) => (
              <li key={m} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/15">
                {m}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0 space-y-12">
          {/* the prompt, in an editor window */}
          <section className="editor overflow-hidden rounded-2xl" aria-labelledby="the-prompt">
            <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span aria-hidden className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="size-2.5 rounded-full bg-[#febc2e]" />
                  <span className="size-2.5 rounded-full bg-[#28c840]" />
                </span>
                <h2 id="the-prompt" className="font-mono text-xs text-zinc-500">prompt.txt</h2>
              </div>
              <CopyButton text={p.prompt} />
            </div>
            <p className="p-5 font-mono text-[13px] leading-[1.75] whitespace-pre-wrap text-zinc-200 select-all sm:p-6 sm:text-sm">
              {p.prompt}
            </p>

            {p.negative && (
              <div className="border-t border-white/[0.07] px-5 py-4 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-mono text-xs text-rose-300/80">negative_prompt</h3>
                  <CopyButton text={p.negative} label="Copy" variant="ghost" />
                </div>
                <p className="mt-2 font-mono text-[13px] leading-relaxed text-zinc-500 select-all">
                  {p.negative}
                </p>
              </div>
            )}
          </section>

          <section aria-labelledby="tips">
            <h2 id="tips" className="font-display text-2xl font-bold tracking-tight text-white">
              Tips for better results
            </h2>
            <ol className="mt-5 space-y-3">
              {p.tips.map((tip, i) => (
                <li key={tip} className="glass flex gap-4 rounded-2xl p-4 text-[15px] leading-relaxed text-zinc-300">
                  <span className="text-gradient font-display text-lg font-bold">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {tip}
                </li>
              ))}
            </ol>
          </section>

          {p.variations && p.variations.length > 0 && (
            <section aria-labelledby="variations">
              <h2 id="variations" className="font-display text-2xl font-bold tracking-tight text-white">
                Variations to try
              </h2>
              <ul className="mt-5 space-y-3">
                {p.variations.map((v) => (
                  <li key={v} className="glass flex items-start justify-between gap-4 rounded-2xl p-4">
                    <p className="font-mono text-[13px] leading-relaxed text-zinc-300">{v}</p>
                    <CopyButton text={v} label="Copy" variant="ghost" className="shrink-0" />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="glass rounded-2xl p-5" aria-labelledby="settings">
            <h2 id="settings" className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
              Recommended settings
            </h2>
            <dl className="mt-4 divide-y divide-white/[0.06] text-sm">
              {Object.entries(p.settings).map(([k, v]) => (
                <div key={k} className="py-2.5 first:pt-0 last:pb-0">
                  <dt className="text-xs text-zinc-500">{k}</dt>
                  <dd className="mt-0.5 font-medium text-zinc-200">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="glass rounded-2xl p-5" aria-labelledby="tags">
            <h2 id="tags" className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
              Tags
            </h2>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {p.tags.map((t) => (
                <li key={t} className="rounded-md bg-white/[0.05] px-2 py-0.5 text-xs text-zinc-400 capitalize">
                  {t}
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-20" aria-labelledby="related">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 id="related" className="font-display text-3xl font-bold tracking-tight text-white">
              You might also like
            </h2>
            <Link href={`/prompts/${c.slug}`} className="shrink-0 text-sm text-zinc-400 hover:text-white">
              See all →
            </Link>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <PromptCard prompt={toSummary(r)} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
