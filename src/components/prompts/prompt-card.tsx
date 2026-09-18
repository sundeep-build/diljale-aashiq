import Link from "next/link";
import { promptHref, type PromptSummary } from "@/lib/prompts";
import { coverStyle } from "./cover";
import { ImageIcon, VideoIcon } from "./studio-icons";

/**
 * Deliberately hook-free, so it renders the same from a server page (related
 * prompts) and from inside the client-side browser.
 */
export function PromptCard({ prompt }: { prompt: PromptSummary }) {
  const isVideo = prompt.category === "video";
  const Icon = isVideo ? VideoIcon : ImageIcon;

  return (
    <Link
      href={promptHref(prompt)}
      className="glass lift group flex h-full flex-col overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[16/9]" style={coverStyle(prompt.slug)}>
        <span className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white/90">
          <Icon className="size-3.5" />
          {isVideo ? "Video" : "Image"}
        </span>
        <span className="absolute right-3 bottom-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] text-white/80">
          {prompt.models[0]}
          {prompt.models.length > 1 && ` +${prompt.models.length - 1}`}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-display text-[17px] leading-snug font-semibold text-white">
          {prompt.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-zinc-400">
          {prompt.summary}
        </p>
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-4">
          {prompt.tags.slice(0, 3).map((t) => (
            <li
              key={t}
              className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[11px] text-zinc-400"
            >
              {t}
            </li>
          ))}
        </ul>
      </div>
    </Link>
  );
}
