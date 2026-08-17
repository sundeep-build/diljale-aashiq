import { PLAYLIST_URL, TRACKS } from "@/data/tracks";
import { BrokenHeart, Heart } from "./icons";

const MARQUEE = [
  "दिलजले आशिक़",
  "24×7 dard ka radio",
  "raat 2 baje",
  "koi na, sab theek ho jayega",
  "एक और गाना",
];

export function Footer() {
  return (
    /* `content-visibility` here also parks the marquee: an off-screen ticker
       was keeping the compositor awake for the whole page. */
    <footer className="lazy-section relative z-10 border-t border-cream/10 bg-ink/85">
      {/* endless ticker */}
      <div className="overflow-hidden border-b border-cream/10 py-3">
        <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-8" aria-hidden={copy === 1}>
              {MARQUEE.map((text, i) => (
                <span
                  key={`${copy}-${i}`}
                  className="flex items-center gap-8 font-display text-sm tracking-[0.2em] text-muted/60 uppercase"
                >
                  {text}
                  <BrokenHeart className="size-3 text-rose/60" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="page-w py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
          <div className="max-w-sm">
            <p className="brush text-3xl">
              <span className="text-rose">Diljale</span>{" "}
              <span className="text-cream">Aashiq</span>
            </p>
            <p className="font-deva mt-0.5 text-sm text-muted">दिलजले आशिक़</p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              A small radio station playing {TRACKS.length} stories of broken
              hearts. Every song streams from YouTube&rsquo;s official player,
              off a single YouTube Music playlist — we host nothing ourselves.
            </p>
          </div>

          <div className="text-xs text-muted">
            <p className="mb-2 tracking-[0.18em] text-cream/70 uppercase">Rotations</p>
            <ul className="space-y-1">
              <li><a href="#dial" className="hover:text-cream">Dard-o-Meter</a></li>
              <li><a href="#rotations" className="hover:text-cream">All rotations</a></li>
              <li><a href="#tapri" className="hover:text-cream">Tapri Mode</a></li>
              <li><a href="#dedicate" className="hover:text-cream">Make a dedication</a></li>
              <li>
                <a
                  href={PLAYLIST_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-cream"
                >
                  YouTube Music playlist ↗
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* the strip along the bottom of the sleeve */}
        <div className="mt-10 flex flex-col items-center gap-3 border-t border-cream/10 pt-6 text-center sm:flex-row sm:justify-between sm:text-left">
          <span className="flex items-center gap-2 font-display text-[10px] font-bold tracking-[0.2em] text-muted uppercase sm:text-[11px]">
            Vol. 1
            <Heart className="size-3 text-rose" />
          </span>
          <span className="flex items-center gap-2 font-display text-[10px] font-bold tracking-[0.18em] text-cream/70 uppercase sm:text-[11px] sm:tracking-[0.2em]">
            Dil se… sirf tere liye
            <BrokenHeart className="size-3.5 text-rose" />
          </span>
        </div>

        <p className="mt-6 max-w-3xl text-center text-[11px] leading-relaxed text-muted/60 sm:text-left">
          All songs, artwork and playback rights belong to their respective
          artists, labels and YouTube. This site is just a labour of love — no
          audio is stored, proxied or re-streamed here.
        </p>
      </div>
    </footer>
  );
}
