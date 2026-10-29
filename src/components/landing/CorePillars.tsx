"use client";

import { Cpu, Users, Eye, Database, ShieldCheck, Share2, Compass, Network } from "lucide-react";

const PILLARS = [
  {
    icon: Users,
    tag: "Task D • Core Challenge",
    title: "Anonymous Co-Subscription Engine",
    description:
      "No accounts, no tracking cookies, no persistent IDs. Recommendations are calculated purely from collective reader co-occurrence: if readers of Blog A also read Blog B, B is recommended with transparent mathematical reasoning.",
    highlight: "Transparent Why: 'Because you follow Dan Luu, 84% also read Simon Willison'",
  },
  {
    icon: Eye,
    tag: "Task C • Full-Text Reading",
    title: "Mozilla Readability + DOMPurify",
    description:
      "Fetches the raw article through an SSRF-protected CORS gateway, strips out trackers, popups, and clutter using Readability heuristics, and sanitizes all HTML before rendering. Pure, bookish typography.",
    highlight: "Zero XSS Vulnerability • Custom Serifs • Instant Dark/Light Switch",
  },
  {
    icon: Database,
    tag: "Task E • Offline-First Storage",
    title: "IndexedDB Persistent Client Vault",
    description:
      "All subscribed feeds, article summaries, full-text bodies, and read states are saved in your browser's local IndexedDB. Open your laptop on a flight or subway with zero Wi-Fi, and your library loads in 5 milliseconds.",
    highlight: "Instant Zero-Lag Load • Automatic Online Background Sync",
  },
  {
    icon: Network,
    tag: "Bonus Quest • Graph Cosmos",
    title: "'Blogs Like This' Network Graph",
    description:
      "An interactive visual graph view mapping the interconnected topology of independent writers. Explore cosmic constellations of thinkers based on co-subscription clusters and shared blogrolls.",
    highlight: "Force-Directed Dynamic Canvas • Visual Constellation Exploration",
  },
];

export default function CorePillars() {
  return (
    <section className="py-24 px-6 sm:px-12 bg-[#fbf8f2] text-[#1f1c19]">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f3ecdf] border border-[#e2d6c3] text-[#92400e] text-xs font-mono uppercase tracking-widest">
            <span>Engineering Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1f1c19] tracking-tight">
            Built on Principles of Autonomy & Privacy
          </h2>
          <p className="font-serif text-[#6b5f50] text-sm sm:text-base leading-relaxed">
            Every layer is engineered to adhere strictly to the PECathon PS-003 specification: high client-side agency, resilient fallback pipelines, and cryptographic abuse protection.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid md:grid-cols-2 gap-7">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl bg-[#fffdfa] border border-[#e8dfd3] p-8 transition-all duration-300 hover:border-[#b45309]/60 hover:shadow-[0_16px_36px_rgba(180,83,9,0.1)] flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#f5ecdd] border border-[#e2d4c0] flex items-center justify-center text-[#b45309] group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#92400e] bg-[#fdf5e8] px-2.5 py-0.5 rounded-full border border-[#fde68a]">
                      {pillar.tag}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-serif font-medium text-[#1f1c19] group-hover:text-[#b45309] transition-colors">
                    {pillar.title}
                  </h3>

                  <p className="text-sm font-serif text-[#574c3e] leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#f3eadc] flex items-center gap-2 text-xs font-mono text-[#8c7e6c]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b45309]" />
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
