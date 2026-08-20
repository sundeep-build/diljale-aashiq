import { Shell } from "@/components/shell";
import { Hero } from "@/components/hero";
import { DardMeter } from "@/components/dard-meter";
import { Rotations } from "@/components/rotations";
import { TrackList } from "@/components/track-list";
import { TapriMode } from "@/components/tapri-mode";
import { DedicationStudio } from "@/components/dedication-studio";
import { Poster } from "@/components/poster";
import { Install } from "@/components/install";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Shell>
        <Hero />
        <DardMeter />
        <Rotations />
        <TrackList />
        <TapriMode />
        <DedicationStudio />
        <Poster />
        <Install />
      </Shell>
      <Footer />
    </>
  );
}
