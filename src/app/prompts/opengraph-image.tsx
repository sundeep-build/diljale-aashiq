import { OG_SIZE, promptOgImage } from "@/components/prompts/og-card";
import { getAllPrompts } from "@/lib/prompts";

/* Covers /prompts and both category pages; each prompt has its own. Without
   this they would inherit the radio's card from the root. */
export const alt = "Free AI image and video prompts";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return promptOgImage({
    eyebrow: "Free · Copy-ready",
    title: "AI prompts for images and video",
    subtitle: `${getAllPrompts().length} hand-written prompts for Midjourney, Flux, Veo, Sora, Kling and more`,
  });
}
