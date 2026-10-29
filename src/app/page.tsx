import PerspectiveTunnelHero from "@/components/ui/perspective-tunnel-hero";
import WebComparison from "@/components/landing/WebComparison";
import CorePillars from "@/components/landing/CorePillars";
import CuratedShelf from "@/components/landing/CuratedShelf";
import SecurityThreatModel from "@/components/landing/SecurityThreatModel";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <main className="w-full min-h-screen bg-[#fbf8f2] text-[#1f1c19] selection:bg-[#fde68a] selection:text-[#92400e]">
      {/* Hero Section: 3D Perspective Tunnel */}
      <PerspectiveTunnelHero />

      {/* The Core Problem & Solution Comparison */}
      <WebComparison />

      {/* Technical Architecture & Pillars */}
      <CorePillars />

      {/* Official PS-003 Seed Dataset & Curated Independent Shelf */}
      <CuratedShelf />

      {/* Rubric Security & Threat Model with Live Inspector */}
      <SecurityThreatModel />

      {/* Footer & Final Call to Action */}
      <LandingFooter />
    </main>
  );
}
