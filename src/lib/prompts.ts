import {
  ALL_PROMPTS,
  CATEGORIES,
  type Prompt,
  type PromptCategory,
} from "@/data/prompts";

/**
 * Every read of the prompt library goes through here, so moving the data to a
 * CMS or database later means rewriting this file and nothing else. Keep the
 * pages ignorant of where prompts come from.
 */

/** Newest first. Sorted once at module load, not on every render. */
const SORTED = ALL_PROMPTS.slice().sort((a, b) => b.added.localeCompare(a.added));

const BY_SLUG = new Map(SORTED.map((p) => [p.slug, p]));

if (process.env.NODE_ENV !== "production" && BY_SLUG.size !== ALL_PROMPTS.length) {
  // a duplicate slug silently shadows a page — fail loudly while writing content
  throw new Error("Duplicate prompt slug in src/data/prompts");
}

export const CATEGORY_SLUGS = Object.keys(CATEGORIES) as PromptCategory[];

export function isCategory(value: string): value is PromptCategory {
  return value in CATEGORIES;
}

export function getCategory(slug: PromptCategory) {
  return CATEGORIES[slug];
}

export function getAllPrompts(): readonly Prompt[] {
  return SORTED;
}

export function getPromptsByCategory(category: PromptCategory): Prompt[] {
  return SORTED.filter((p) => p.category === category);
}

/** A prompt only exists under its own category — /prompts/video/<image-slug> is a 404. */
export function getPrompt(category: string, slug: string): Prompt | undefined {
  const p = BY_SLUG.get(slug);
  return p && p.category === category ? p : undefined;
}

/** Same category, ranked by shared tags, newest breaking ties. */
export function getRelatedPrompts(prompt: Prompt, limit = 4): Prompt[] {
  const tags = new Set(prompt.tags);
  return SORTED.filter((p) => p.category === prompt.category && p.slug !== prompt.slug)
    .map((p) => ({ p, score: p.tags.filter((t) => tags.has(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ p }) => p);
}

/** Tags in a set of prompts, most used first — drives the filter chips. */
export function getTopTags(prompts: readonly Prompt[], limit = 12): string[] {
  const counts = new Map<string, number>();
  for (const p of prompts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([t]) => t);
}

export function promptHref(p: Pick<Prompt, "category" | "slug">) {
  return `/prompts/${p.category}/${p.slug}`;
}

/**
 * What a listing card needs, and nothing more. Listing pages hand this to a
 * client component, so the full prompt text, tips and settings would otherwise
 * be serialised into the page payload a second time for every card.
 */
export type PromptSummary = Pick<
  Prompt,
  "slug" | "category" | "title" | "summary" | "models" | "tags"
>;

export function toSummary(p: Prompt): PromptSummary {
  const { slug, category, title, summary, models, tags } = p;
  return { slug, category, title, summary, models, tags };
}
