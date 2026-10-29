"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  Clock,
  ArrowRight,
  TrendingDown,
  X,
  BookOpen
} from "lucide-react";
import { ArticleDigest } from "@/lib/summarizer";

interface AiDigestCardProps {
  digest: ArticleDigest;
  articleTitle: string;
  onClose: () => void;
}

export default function AiDigestCard({
  digest,
  articleTitle,
  onClose
}: AiDigestCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = [
      `Summary of: ${articleTitle}`,
      "",
      `Core Thesis:`,
      digest.coreThesis,
      "",
      `Key Takeaways:`,
      ...digest.keyTakeaways.map((t, i) => `${i + 1}. ${t}`),
      "",
      `Extracted via Small Web Reader (On-Device Private NLP)`
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -15, scale: 0.98 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-2xl bg-[#fdfaf5] border border-[#d4af37]/40 shadow-md p-6 space-y-5 font-serif text-[#1f1c19] relative overflow-hidden"
    >
      {/* Subtle Warm Amber Glow Gradient */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-[#b45309]/10 to-transparent pointer-events-none rounded-tr-2xl" />

      {/* Header with Title and Privacy Badge */}
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] text-[10px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#b45309]" />
              AI Executive Digest
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-[10px] font-mono font-medium">
              <ShieldCheck className="w-3 h-3 text-[#16a34a]" />
              On-Device NLP • Zero Cloud Leakage
            </span>
          </div>

          <h3 className="font-serif font-bold text-base text-[#1f1c19] mt-1">
            30-Second Synthesis
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg border border-[#e2d6c3] bg-white hover:bg-[#f4ece1] text-[#574e44] text-xs font-mono transition-colors flex items-center gap-1"
            title="Copy summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#16a34a]" />
                <span className="text-[10px] text-[#16a34a] font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8c7e6c] hover:text-[#1f1c19] hover:bg-[#f4ece1] transition-colors"
            title="Dismiss digest"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Core Thesis Card */}
      <div className="p-4 rounded-xl bg-[#f5ede2]/80 border-l-4 border-[#b45309] border-y border-r border-[#e2d6c3] space-y-1 relative z-10">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#92400e] font-bold block">
          Central Thesis
        </span>
        <p className="font-serif italic text-sm text-[#2b2621] leading-relaxed">
          "{digest.coreThesis}"
        </p>
      </div>

      {/* 3 Key Takeaways */}
      <div className="space-y-2.5 relative z-10">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#786b59] font-bold block">
          Key Takeaways
        </span>

        <ul className="space-y-2">
          {digest.keyTakeaways.map((takeaway, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-xs text-[#423b33] leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom Metrics Bar */}
      <div className="pt-3 border-t border-[#e8dfd1] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#786b59] relative z-10">
        {/* Topics Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] uppercase text-[#8c7e6c]">Keywords:</span>
          {digest.keyTopics.map(topic => (
            <span
              key={topic}
              className="px-2 py-0.5 rounded-md bg-[#f4ece1] text-[#78350f] text-[10px] font-medium border border-[#e2d6c3]"
            >
              #{topic}
            </span>
          ))}
        </div>

        {/* Time Saved Metric */}
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1 text-[#b45309] font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>~{digest.readingTimeSavedMinutes}m saved</span>
          </span>
          <span className="text-[#d6caba]">•</span>
          <span className="text-[#8c7e6c]">
            {digest.reductionPercentage}% condensed
          </span>
        </div>
      </div>

    </motion.div>
  );
}
