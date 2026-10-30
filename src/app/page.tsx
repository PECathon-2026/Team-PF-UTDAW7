"use client";

import PerspectiveTunnelHero from "@/components/ui/perspective-tunnel-hero";
import WebComparison from "@/components/landing/WebComparison";
import CorePillars from "@/components/landing/CorePillars";
import SecurityThreatModel from "@/components/landing/SecurityThreatModel";
import LandingFooter from "@/components/landing/LandingFooter";
import { useTheme } from "@/context/ThemeContext";

export default function Home() {
  const { isDark } = useTheme();

  return (
    <main
      className={`w-full min-h-screen transition-colors duration-300 ${
        isDark ? "bg-[#121110] text-[#f5efe6]" : "bg-[#fbf8f2] text-[#1f1c19]"
      } selection:bg-[#fde68a] selection:text-[#92400e]`}
    >
      {/* Hero Section: 3D Perspective Tunnel */}
      <PerspectiveTunnelHero />

      {/* The Core Problem & Solution Comparison */}
      <WebComparison />

      {/* Technical Architecture & Pillars */}
      <CorePillars />

      {/* Rubric Security & Threat Model with Live Inspector */}
      <SecurityThreatModel />

      {/* Footer & Final Call to Action */}
      <LandingFooter />
    </main>
  );
}
