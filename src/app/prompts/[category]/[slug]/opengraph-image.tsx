import { OG_SIZE, promptOgImage } from "@/components/prompts/og-card";
import { getAllPrompts, getPrompt } from "@/lib/prompts";

export const alt = "AI prompt";
export const size = OG_SIZE;
export const contentType = "image/png";

// one PNG per prompt, rendered at build time rather than on each share
export function generateStaticParams() {
  return getAllPrompts().map((p) => ({ category: p.category, slug: p.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const p = getPrompt(category, slug);

  return promptOgImage({
    eyebrow: category === "video" ? "AI video prompt" : "AI image prompt",
    title: p?.title ?? "AI prompt",
    subtitle: p ? p.models.slice(0, 4).join(" · ") : "",
  });
}
