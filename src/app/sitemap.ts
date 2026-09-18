import type { MetadataRoute } from "next";
import { CATEGORY_SLUGS, getAllPrompts, getPromptsByCategory, promptHref } from "@/lib/prompts";
import { SITE_URL } from "@/lib/site";

/**
 * Everything worth indexing. Dedication pages (/d/…) are personal and marked
 * noindex, so they are deliberately absent.
 *
 * One sitemap holds up to 50,000 URLs. Past that, split it with
 * generateSitemaps — see node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-sitemaps.md
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const prompts = getAllPrompts();
  // newest first, so the head of any list is its most recent change
  const latest = (list: readonly { added: string }[]) => list[0]?.added;

  return [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    {
      url: `${SITE_URL}/prompts`,
      lastModified: latest(prompts),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...CATEGORY_SLUGS.map((c) => ({
      url: `${SITE_URL}/prompts/${c}`,
      lastModified: latest(getPromptsByCategory(c)),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...prompts.map((p) => ({
      url: `${SITE_URL}${promptHref(p)}`,
      lastModified: p.added,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
