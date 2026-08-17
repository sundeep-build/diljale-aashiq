"use client";

import { PLAYLIST_URL } from "@/data/tracks";
import { useInstall } from "./use-install";
import { Cassette, YouTubeMusic } from "./icons";

export function Install() {
  const { installed, canInstall, install } = useInstall();

  return (
    <section className="relative z-10 page-w py-10 sm:py-14">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel flex flex-col justify-between overflow-hidden rounded-3xl p-5 sm:p-8">
          <div>
            <Cassette className="h-8 w-12 text-rose" />
            <h3 className="mt-4 font-display text-xl font-extrabold sm:text-2xl">
              Install on phone{" "}
              <span className="font-deva text-base font-normal text-muted">
                जेब में रेडियो
              </span>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Install it like an app — full screen, no app store, opens straight
              from your home screen.
            </p>
          </div>
          <div className="mt-6">
            {installed ? (
              <span className="inline-block rounded-full border border-rose/35 bg-rose/10 px-5 py-2.5 text-sm text-rose-soft">
                Install ho chuka hai
              </span>
            ) : canInstall ? (
              <button
                onClick={install}
                className="rounded-full bg-rose px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_30px_-10px_var(--color-rose)] transition active:scale-95"
              >
                Install now
              </button>
            ) : (
              <p className="text-xs leading-relaxed text-muted">
                <span className="text-cream/80">iPhone:</span> Share button →
                “Add to Home Screen”.
                <br />
                <span className="text-cream/80">Android:</span> browser menu →
                “Install app”.
              </p>
            )}
          </div>
        </div>

        <a
          href={PLAYLIST_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="panel panel-hover group flex flex-col justify-between overflow-hidden rounded-3xl p-5 sm:p-8"
        >
          <div>
            <YouTubeMusic className="size-9 text-[#ff0033]" />
            <h3 className="mt-4 font-display text-xl font-extrabold sm:text-2xl">
              Full playlist{" "}
              <span className="font-deva text-base font-normal text-muted">
                सुनते रहो
              </span>
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The station plays exactly this playlist — jo isme add hota hai,
              wahi yahan bajta hai. Save it and listen your own way.
            </p>
          </div>
          <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-rose-soft">
            Open playlist
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </a>
      </div>
    </section>
  );
}
