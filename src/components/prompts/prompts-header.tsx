import Link from "next/link";
import { ImageIcon, Sparkle, VideoIcon } from "./studio-icons";

/**
 * The prompts section's own header. Not the station's TopBar: that one needs
 * the RadioProvider (and with it the YouTube player) mounted above it, and a
 * page of text has no business paying for a music player it never plays.
 *
 * The only blurred surface in the section, and only from `md` up — it is one
 * 64px strip over a static page, so there is no animation underneath to make
 * it re-blur every frame.
 */
export function PromptsHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-zinc-950/85 md:bg-zinc-950/60 md:backdrop-blur-md">
      <div className="page-w flex h-14 items-center gap-3 sm:h-16">
        <Link href="/prompts" className="group flex shrink-0 items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-linear-to-br from-violet-500 via-fuchsia-500 to-amber-400 text-white shadow-[0_6px_20px_-6px_rgb(168_85_247/0.7)] transition-transform group-hover:rotate-12">
            <Sparkle className="size-4" />
          </span>
          <span className="font-display text-[15px] font-bold tracking-tight text-white">
            AI <span className="text-gradient">Prompts</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1" aria-label="Prompt categories">
          <NavLink href="/prompts/image" icon={<ImageIcon className="size-3.5" />}>
            Image
          </NavLink>
          <NavLink href="/prompts/video" icon={<VideoIcon className="size-3.5" />}>
            Video
          </NavLink>
          <Link
            href="/"
            className="ml-1 hidden rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-zinc-400 transition hover:border-white/25 hover:text-white min-[420px]:block"
          >
            Radio ↗
          </Link>
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
    >
      {icon}
      {children}
    </Link>
  );
}
