"use client";

import { Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function WebComparison() {
  const { isDark } = useTheme();

  return (
    <section id="features" className={`relative py-24 px-6 sm:px-12 border-t transition-colors duration-300 ${
      isDark ? "bg-[#141210] border-[#2d2924] text-[#f5efe6]" : "bg-[#f6f1e7] border-[#e8dfd3] text-[#1f1c19]"
    }`}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono uppercase tracking-widest ${
            isDark ? "bg-[#25211c] border-[#38332c] text-amber-400" : "bg-[#ede3d1] border-[#d6c7b0] text-[#92400e]"
          }`}>
            <span>The Paradigm Shift</span>
          </div>
          <h2 className={`text-3xl sm:text-5xl font-serif font-normal tracking-tight ${
            isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"
          }`}>
            The Algorithmic Web vs. The Small Web
          </h2>
          <p className={`font-serif text-sm sm:text-base leading-relaxed ${
            isDark ? "text-[#a89d8f]" : "text-[#6b5f50]"
          }`}>
            The modern internet was designed for engagement monopolies. The Small Web Reader reclaims the original promise: human thought, direct syndication, and zero surveillance.
          </p>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: The Broken Algorithmic Web */}
          <div className={`relative rounded-2xl border p-8 sm:p-10 flex flex-col justify-between shadow-xs transition-colors duration-200 ${
            isDark ? "bg-[#1a1715] border-[#2d2924] text-[#e4dcd1]" : "bg-[#eee5d6] border-[#d8ccb8] text-[#1f1c19]"
          }`}>
            <div className="space-y-6">
              <div className={`flex items-center justify-between pb-4 border-b ${
                isDark ? "border-[#2d2924]" : "border-[#ddcfbb]"
              }`}>
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#9c4221] font-bold">The Corporate Stream</span>
                  <h3 className={`text-2xl font-serif mt-1 ${isDark ? "text-[#f5efe6]" : "text-[#2a241e]"}`}>Algorithmic Feeds</h3>
                </div>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-[#9c4221] ${
                  isDark ? "bg-[#25211c] border-[#38332c]" : "bg-[#e4d7c2] border-[#cebfab]"
                }`}>
                  <XCircle className="w-5 h-5" />
                </div>
              </div>

              <ul className={`space-y-4 text-sm font-serif ${isDark ? "text-[#cac0b3]" : "text-[#574c3e]"}`}>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-[#9c4221] shrink-0 mt-0.5" />
                  <span><strong>Opaque Blackbox Ranking:</strong> Algorithms promote outrage and dopamine triggers over depth.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-[#9c4221] shrink-0 mt-0.5" />
                  <span><strong>Surveillance & Persistent IDs:</strong> Every click, dwell time, and profile is profiled and monetized.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-[#9c4221] shrink-0 mt-0.5" />
                  <span><strong>Ad Clutter & Popups:</strong> Articles hidden behind newsletter modals, trackers, and cookie banners.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-[#9c4221] shrink-0 mt-0.5" />
                  <span><strong>Walled Gardens:</strong> Traps writers and readers inside proprietary platforms without RSS export.</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-[#9c4221] shrink-0 mt-0.5" />
                  <span><strong>Zero Offline Utility:</strong> Without an active connection and ad tracking, content disappears.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: The Small Web Reader */}
          <div className={`relative rounded-2xl border-2 p-8 sm:p-10 flex flex-col justify-between transition-colors duration-200 ${
            isDark
              ? "bg-[#181614] border-[#fbbf24]/50 shadow-[0_16px_36px_rgba(251,191,36,0.06)]"
              : "bg-[#fffdfa] border-[#b45309]/60 shadow-[0_16px_36px_rgba(180,83,9,0.08)]"
          }`}>
            <div className="space-y-6">
              <div className={`flex items-center justify-between pb-4 border-b ${
                isDark ? "border-[#2d2924]" : "border-[#f0e6d6]"
              }`}>
                <div>
                  <span className={`text-xs font-mono uppercase tracking-widest font-bold ${
                    isDark ? "text-[#fbbf24]" : "text-[#b45309]"
                  }`}>The Independent Web</span>
                  <h3 className={`text-2xl font-serif mt-1 ${isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"}`}>The Small Web Reader</h3>
                </div>
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                  isDark
                    ? "bg-amber-950/60 border-amber-800/60 text-amber-400"
                    : "bg-[#fde68a]/50 border-[#f59e0b]/40 text-[#b45309]"
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <ul className={`space-y-4 text-sm font-serif ${isDark ? "text-[#e4dcd1]" : "text-[#383129]"}`}>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-amber-400" : "text-[#b45309]"}`} />
                  <span><strong>Direct RSS & Atom Feeds:</strong> Pure chronological timeline directly from authors' personal domains.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-amber-400" : "text-[#b45309]"}`} />
                  <span><strong>Zero Persistent Trackers:</strong> No third-party analytics, user fingerprinting, or surveillance cookies.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-amber-400" : "text-[#b45309]"}`} />
                  <span><strong>100% Offline Capable:</strong> Full-text caching in client-side IndexedDB for deep reading anywhere.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-amber-400" : "text-[#b45309]"}`} />
                  <span><strong>Discovery by Overlap:</strong> Discover blogs organically through human reader affinities, not algorithms.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "text-amber-400" : "text-[#b45309]"}`} />
                  <span><strong>On-Device AI Synthesis:</strong> Private, extractive executive digests running 100% locally on your machine.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
