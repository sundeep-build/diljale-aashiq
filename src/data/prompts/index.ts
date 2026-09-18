import type { CategoryMeta, PromptCategory } from "./types";
import { IMAGE_PROMPTS } from "./image";
import { VIDEO_PROMPTS } from "./video";

export type { CategoryMeta, Prompt, PromptCategory } from "./types";

/** Adding a category = one entry here, one data file, one line in ALL_PROMPTS. */
export const CATEGORIES: Record<PromptCategory, CategoryMeta> = {
  image: {
    slug: "image",
    label: "Image prompts",
    heading: "AI Image Prompts",
    blurb:
      "Copy-ready prompts for Midjourney, Flux, GPT Image, Ideogram and Stable Diffusion — with settings, negative prompts and tips for getting them right.",
  },
  video: {
    slug: "video",
    label: "Video prompts",
    heading: "AI Video Prompts",
    blurb:
      "Shot-by-shot prompts for Veo, Sora, Kling, Runway and Luma — camera moves, duration, aspect ratio and what to tweak when a clip goes wrong.",
  },
};

export const ALL_PROMPTS = [...IMAGE_PROMPTS, ...VIDEO_PROMPTS];
