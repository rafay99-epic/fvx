import { createFileRoute } from "@tanstack/react-router";
import { AnywhereBand } from "@/components/home/anywhere-band";
import { Features } from "@/components/home/features";
import { InstallCta } from "@/components/home/install-cta";
import { PinSources } from "@/components/home/pin-sources";
import { PinWalk } from "@/components/home/pin-walk";
import { Usage } from "@/components/home/usage";
import { VersionHero } from "@/components/home/version-hero";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <title>fvx: per-project Flutter SDK switching</title>
      <VersionHero />
      <PinWalk />
      <PinSources />
      <AnywhereBand />
      <Features />
      <Usage />
      <InstallCta />
    </>
  );
}
