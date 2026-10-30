"use client";

import { Shield, Cpu, RefreshCw, Network } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const PILLARS = [
  {
    icon: Shield,
    title: "Zero-Knowledge Affinity Engine",
    description:
      "Blog overlap and affinity graphs are generated purely from aggregate co-subscription mathematical tallies. Individual IP addresses are salted, hashed, and erased within 24 hours.",
    highlight: "Zero Cookies • No Session Fingerprints • Ephemeral Epistemic Identity",
  },
  {
    icon: Cpu,
    title: "100% Client-Side Private Storage",
    description:
      "All your feeds, reading states, unread counts, and full-text articles are indexed locally in your browser's IndexedDB. Your reading habits never touch an external cloud telemetry server.",
    highlight: "Offline-First Engine • Pure Client IndexedDB • Zero Remote Backdoors",
  },
  {
    icon: RefreshCw,
    title: "SSRF-Protected Feed Fetching",
    description:
      "All RSS/Atom syndication requests pass through an active defense proxy that resolves DNS, validates IP ranges, and drops loopback/private RFC-1918 addresses before fetching XML feeds.",
    highlight: "Hardened DNS Resolution • Loopback Blocking • Strict RFC Compliance",
  },
  {
    icon: Network,
    title: "P2P Constellation Graph Discovery",
    description:
      "An interactive visual graph view mapping the interconnected topology of independent writers. Explore cosmic constellations of thinkers based on co-subscription clusters and shared blogrolls.",
    highlight: "Force-Directed Dynamic Canvas • Visual Constellation Exploration",
  },
];

export default function CorePillars() {
  const { isDark } = useTheme();

  return (
    <section className={`py-24 px-6 sm:px-12 transition-colors duration-300 ${
      isDark ? "bg-[#121110] text-[#f5efe6]" : "bg-[#fbf8f2] text-[#1f1c19]"
    }`}>
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono uppercase tracking-widest ${
            isDark ? "bg-[#25211c] border-[#38332c] text-amber-400" : "bg-[#f3ecdf] border-[#e2d6c3] text-[#92400e]"
          }`}>
            <span>Engineering Architecture</span>
          </div>
          <h2 className={`text-3xl sm:text-5xl font-serif font-normal tracking-tight ${
            isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"
          }`}>
            Built on Principles of Autonomy & Privacy
          </h2>
        </div>

        {/* Pillars Grid */}
        <div className="grid md:grid-cols-2 gap-7">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className={`group relative rounded-2xl p-8 transition-all duration-300 flex flex-col justify-between border ${
                  isDark
                    ? "bg-[#181614] border-[#2d2924] hover:border-amber-500/50 hover:shadow-[0_16px_36px_rgba(251,191,36,0.06)]"
                    : "bg-[#fffdfa] border-[#e8dfd3] hover:border-[#b45309]/60 hover:shadow-[0_16px_36px_rgba(180,83,9,0.1)]"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center group-hover:scale-105 transition-transform ${
                      isDark
                        ? "bg-[#25211c] border-[#38332c] text-amber-400"
                        : "bg-[#f5ecdd] border-[#e2d4c0] text-[#b45309]"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className={`text-xl sm:text-2xl font-serif font-medium transition-colors ${
                    isDark ? "text-[#f5efe6] group-hover:text-amber-400" : "text-[#1f1c19] group-hover:text-[#b45309]"
                  }`}>
                    {pillar.title}
                  </h3>

                  <p className={`text-sm font-serif leading-relaxed ${
                    isDark ? "text-[#aba092]" : "text-[#574c3e]"
                  }`}>
                    {pillar.description}
                  </p>
                </div>

                <div className={`mt-6 pt-4 border-t flex items-center gap-2 text-xs font-mono ${
                  isDark ? "border-[#2d2924] text-[#8c8172]" : "border-[#f3eadc] text-[#8c7e6c]"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-amber-400" : "bg-[#b45309]"}`} />
                  <span>{pillar.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
