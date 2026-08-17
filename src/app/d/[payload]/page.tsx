import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { decodeDedication } from "@/lib/dedication";
import { ROTATION_BY_SLUG } from "@/data/rotations";
import { Shell } from "@/components/shell";
import { DedicationCard } from "@/components/dedication-card";
import { DedicationPlayer } from "@/components/dedication-player";
import { Footer } from "@/components/footer";

type Props = { params: Promise<{ payload: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { payload } = await params;
  const d = decodeDedication(payload);
  if (!d) return { title: "Ye dedication nahi mila" };

  const from = d.from.trim() ? ` — ${d.from} ki taraf se` : "";
  return {
    title: `${d.to} ke naam ek gaana`,
    description: `“${d.note}”${from} · ${d.track.title} — ${d.track.artists}`,
    openGraph: {
      title: `${d.to} ke naam ek gaana 💔`,
      description: `“${d.note}”${from}`,
      type: "music.song",
    },
    // a dedication is personal — keep it out of search results
    robots: { index: false, follow: false },
  };
}

export default async function DedicationPage({ params }: Props) {
  const { payload } = await params;
  const d = decodeDedication(payload);
  if (!d) notFound();

  const accent = ROTATION_BY_SLUG[d.track.rotation].from;

  return (
    <>
      <Shell initialTrack={d.track} withBar={false}>
        <section className="page-w max-w-xl pt-10 pb-6 sm:pt-16">
          <div className="animate-rise">
            <DedicationCard
              to={d.to}
              from={d.from}
              note={d.note}
              track={d.track}
              accent={accent}
            />
          </div>

          <div className="animate-rise mt-5" style={{ animationDelay: "140ms" }}>
            <DedicationPlayer accent={accent} />
          </div>

          <div
            className="animate-rise mt-8 text-center"
            style={{ animationDelay: "260ms" }}
          >
            <p className="text-sm text-muted">Tum bhi kisi ko bhejna chahoge?</p>
            <Link
              href="/#dedicate"
              className="mt-3 inline-block rounded-full border border-cream/15 px-6 py-2.5 text-sm font-medium text-cream/85 transition hover:border-rose/50"
            >
              Apna dedication banao
            </Link>
            <p className="mt-6 text-[11px] text-muted/60">
              Diljale Aashiq · 24×7 dard ka radio
            </p>
          </div>

          <div className="h-16" />
        </section>
      </Shell>
      <Footer />
    </>
  );
}
