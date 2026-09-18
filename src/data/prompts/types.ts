/** The shape every prompt in the library shares, image or video. */

export type PromptCategory = "image" | "video";

export type Prompt = {
  /** URL segment — unique across the whole library, not just its category. */
  slug: string;
  category: PromptCategory;
  title: string;
  /** One or two sentences. Doubles as the card blurb and the meta description. */
  summary: string;
  /** The prompt itself, exactly as it should be pasted. */
  prompt: string;
  /** For the image models that take one. */
  negative?: string;
  /** Tools it was written for — it will usually work in others too. */
  models: string[];
  /** Label → value, e.g. "Aspect ratio" → "16:9". Rendered as a table. */
  settings: Record<string, string>;
  tags: string[];
  /**
   * What to change and why. This is what makes a page worth indexing — a bare
   * prompt with nothing around it is exactly the "thin content" AdSense
   * rejects sites for.
   */
  tips: string[];
  /** Shorter alternate takes on the same idea. */
  variations?: string[];
  /** ISO date. Orders "latest" and feeds the sitemap's lastModified. */
  added: string;
};

export type CategoryMeta = {
  slug: PromptCategory;
  label: string;
  /** <title> and <h1> for the category page. */
  heading: string;
  blurb: string;
};
