"use client";

import type { Track } from "@/data/tracks";
import { RadioProvider } from "./radio-provider";
import { Backdrop } from "./backdrop";
import { Lightning } from "./lightning";
import { TopBar } from "./top-bar";
import { RadioBar } from "./radio-bar";

/**
 * Everything that needs the radio lives inside here. Pages mount their own
 * shell so a dedication page can boot the station on its own song.
 */
export function Shell({
  children,
  initialTrack,
  withBar = true,
}: {
  children: React.ReactNode;
  initialTrack?: Track;
  withBar?: boolean;
}) {
  return (
    <RadioProvider initialTrack={initialTrack}>
      <Backdrop />
      {/* Bijli sits OVER the page, not inside the backdrop, because the hero
          photograph covers the whole first screen — lightning behind it would
          be invisible exactly where the storm should be most obvious. Above
          the content, below the two control bars, so the street lights up
          without the player becoming unreadable. See lightning.tsx. */}
      <Lightning />
      <TopBar />
      {/* The bar lives at the END of <main> on purpose. `position: sticky`
          pins it to the viewport bottom while main scrolls, then lets it come
          to rest at main's end — so it parks above the footer instead of
          covering it. A fixed bar cannot do that without scroll maths. */}
      <main className="relative z-10 flex min-h-dvh flex-col">
        {children}
        {withBar && <RadioBar />}
      </main>
    </RadioProvider>
  );
}
