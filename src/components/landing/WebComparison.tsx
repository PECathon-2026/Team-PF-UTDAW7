"use client";

import { Sparkles, CheckCircle2, XCircle } from "lucide-react";

export default function WebComparison() {
  return (
    <section id="features" className="relative py-24 px-6 sm:px-12 bg-[#f6f1e7] border-t border-[#e8dfd3] text-[#1f1c19]">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede3d1] border border-[#d6c7b0] text-[#92400e] text-xs font-mono uppercase tracking-widest">
            <span>The Paradigm Shift</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#1f1c19] tracking-tight">
            The Algorithmic Web vs. The Small Web
          </h2>
          <p className="font-serif text-[#6b5f50] text-sm sm:text-base leading-relaxed">
            The modern internet was designed for engagement monopolies. The Small Web Reader reclaims the original promise: human thought, direct syndication, and zero surveillance.
          </p>
        </div>

        {/* Side-by-Side Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: The Broken Algorithmic Web */}
          <div className="relative rounded-2xl bg-[#eee5d6] border border-[#d8ccb8] p-8 sm:p-10 flex flex-col justify-between shadow-xs">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#ddcfbb]">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#9c4221] font-bold">The Corporate Stream</span>
                  <h3 className="text-2xl font-serif text-[#2a241e] mt-1">Algorithmic Feeds</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#e4d7c2] border border-[#cebfab] flex items-center justify-center text-[#9c4221]">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>

              <ul className="space-y-4 text-sm font-serif text-[#574c3e]">
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
          <div className="relative rounded-2xl bg-[#fffdfa] border-2 border-[#b45309]/60 p-8 sm:p-10 flex flex-col justify-between shadow-[0_16px_36px_rgba(180,83,9,0.08)]">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#f0e6d6]">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#b45309] font-bold">The Independent Web</span>
                  <h3 className="text-2xl font-serif text-[#1f1c19] mt-1">The Small Web Reader</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#fde68a]/50 border border-[#f59e0b]/40 flex items-center justify-center text-[#b45309]">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>

              <ul className="space-y-4 text-sm font-serif text-[#383129]">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                  <span><strong>Direct RSS & Atom Feeds:</strong> Pure chronological timeline directly from authors' personal domains.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                  <span><strong>100% Anonymous Co-Subscription:</strong> Discover blogs through collective reader overlap with <em>zero accounts or cookies</em>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                  <span><strong>Distraction-Free Readability:</strong> Automatic content extraction with DOMPurify sanitization. Pure, calm text.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                  <span><strong>Offline-First Architecture:</strong> Cached locally in IndexedDB. Keep reading uninterrupted on subways or flights.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#b45309] shrink-0 mt-0.5" />
                  <span><strong>Open Web Portability:</strong> 1-Click OPML export and import. Your library always belongs to you.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
