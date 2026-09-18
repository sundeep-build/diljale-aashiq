import Link from "next/link";
import { CATEGORIES } from "@/data/prompts";
import { CONTACT_EMAIL } from "@/lib/site";
import { Sparkle } from "./studio-icons";

/**
 * Not the station footer: that one's links are in-page anchors (#dial,
 * #tapri…) that only resolve on the home page.
 */
export function PromptsFooter() {
  return (
    <footer className="mt-24 border-t border-white/[0.06]">
      <div className="page-w flex flex-col gap-10 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <p className="flex items-center gap-2 font-display text-base font-bold text-white">
            <Sparkle className="size-4 text-fuchsia-400" />
            <span>
              AI <span className="text-gradient">Prompts</span>
            </span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Hand-written, tested prompts for AI image and video tools. Free to
            copy and use in your own work.
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            Suggest a prompt:{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </div>

        <ul className="space-y-2 text-sm text-zinc-400">
          <li className="mb-3 text-xs font-semibold tracking-wider text-zinc-500 uppercase">
            Browse
          </li>
          <li>
            <Link href="/prompts" className="hover:text-white">All prompts</Link>
          </li>
          {Object.values(CATEGORIES).map((c) => (
            <li key={c.slug}>
              <Link href={`/prompts/${c.slug}`} className="hover:text-white">
                {c.heading}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/" className="hover:text-white">Diljale Aashiq radio</Link>
          </li>
        </ul>
      </div>
      <p className="page-w pb-8 text-xs text-zinc-600">
        © {new Date().getFullYear()} Diljale Aashiq · AI Prompts
      </p>
    </footer>
  );
}
