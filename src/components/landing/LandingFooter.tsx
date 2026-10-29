"use client";

import Link from "next/link";
import { BookOpen, Compass, ArrowRight, Heart, Wifi, Shield, GitBranch } from "lucide-react";

export default function LandingFooter() {
  return (
    <footer className="relative bg-[#1a1715] text-[#fbf7ee] border-t border-[#332e29] pt-20 pb-12 px-6 sm:px-12">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Call to Action Banner */}
        <div className="relative rounded-2xl bg-gradient-to-r from-[#29231f] via-[#211c19] to-[#29231f] border border-[#443a33] p-10 sm:p-14 text-center space-y-6 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-[#d97706]/10 blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3d332c] border border-[#594a3e] text-[#fde68a] text-xs font-mono uppercase tracking-widest">
            <BookOpen className="w-3.5 h-3.5 text-[#d97706]" />
            <span>Ready to Begin?</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-serif font-normal text-white max-w-2xl mx-auto leading-tight">
            Take Back Your Reading Attention.
          </h2>

          <p className="font-serif text-[#b8ada0] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            No signups. No email newsletters. No tracking cookies. Your personal library starts now in your browser.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/reader"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#d97706] to-[#b45309] text-[#1c1917] font-serif font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-[#d97706]/20 hover:scale-105"
            >
              <BookOpen className="w-4 h-4" /> Launch Web Reader
            </Link>
            <Link
              href="/discover"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#26211d] border border-[#4d4137] text-white font-serif font-medium text-sm hover:bg-[#332c26] transition-all"
            >
              <Compass className="w-4 h-4 text-[#d97706]" /> Browse Discover
            </Link>
          </div>
        </div>

        {/* Footer Navigation & Credits */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-[#292420] text-xs font-serif text-[#a89e90]">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-[#d97706] flex items-center justify-center text-[#1c1917] font-serif font-bold text-sm">
                ¶
              </div>
              <span className="font-serif font-medium text-sm text-white">The Small Web Reader</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#8c8274]">
              Anonymous discovery for independent blogs. Built for PECathon 2026.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <span className="font-mono uppercase tracking-wider text-[#d97706] text-[10px] font-bold">
              Navigation
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li><Link href="/" className="hover:text-white transition-colors">Home & 3D Tunnel</Link></li>
              <li><Link href="/reader" className="hover:text-white transition-colors">Timeline & Library</Link></li>
              <li><Link href="/discover" className="hover:text-white transition-colors">Anonymous Discovery</Link></li>
              <li><a href="#features" className="hover:text-white transition-colors">Architecture Comparison</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <span className="font-mono uppercase tracking-wider text-[#d97706] text-[10px] font-bold">
              Specification
            </span>
            <ul className="space-y-1.5 text-[11px]">
              <li><span className="text-[#8c8274]">Problem Statement:</span> PS-003</li>
              <li><span className="text-[#8c8274]">Team:</span> PF-UTDAW7</li>
              <li><span className="text-[#8c8274]">Privacy:</span> Zero Persistent IDs</li>
              <li><span className="text-[#8c8274]">Storage:</span> IndexedDB Offline First</li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <span className="font-mono uppercase tracking-wider text-[#d97706] text-[10px] font-bold">
              Repository
            </span>
            <div className="space-y-2 text-[11px]">
              <a
                href="https://github.com/PECathon-2026/Team-PF-UTDAW7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-white hover:text-[#d97706] transition-colors"
              >
                <GitBranch className="w-4 h-4 text-[#d97706]" /> Team-PF-UTDAW7
              </a>
              <p className="text-[10px] text-[#786f63]">
                Branch: <code>landing-page</code>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#241f1c] text-[10px] font-mono text-[#786f63]">
          <div>PECathon 2026 • Punjab Engineering College</div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-[#22c55e]" /> SSRF Protected</span>
            <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-[#fde68a]" /> Offline Capable</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
