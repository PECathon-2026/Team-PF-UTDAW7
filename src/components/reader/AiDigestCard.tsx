"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  Copy,
  X
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
      `AI Digest: ${articleTitle}`,
      "",
      `Summary:`,
      digest.coreThesis,
      "",
      `Key Takeaways:`,
      ...digest.keyTakeaways.map((t, i) => `${i + 1}. ${t}`)
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-2xl bg-[#fdfaf5] border border-[#e2d6c3] shadow-md p-5 space-y-4 font-serif text-[#1f1c19] relative overflow-hidden"
    >
      {/* Top Header: Simple and Clean */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e8dfd1]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#b45309] text-white flex items-center justify-center shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <h3 className="font-serif font-bold text-sm text-[#1f1c19]">
            AI Digest
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg border border-[#e2d6c3] bg-white hover:bg-[#f4ece1] text-[#574e44] text-xs font-mono transition-colors flex items-center gap-1.5"
            title="Copy summary to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#16a34a]" />
                <span className="text-[11px] text-[#16a34a] font-bold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8c7e6c] hover:text-[#1f1c19] hover:bg-[#f4ece1] transition-colors"
            title="Close digest"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Core Thesis / Summary Box */}
      <div className="p-3.5 rounded-xl bg-[#f4ece1]/80 border-l-4 border-[#b45309] border-y border-r border-[#e2d6c3]">
        <p className="font-serif text-sm text-[#2b2621] leading-relaxed">
          {digest.coreThesis}
        </p>
      </div>

      {/* Key Takeaways */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#786b59] font-bold block">
          Key Takeaways
        </span>

        <ul className="space-y-2">
          {digest.keyTakeaways.map((takeaway, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-xs text-[#3b342e] leading-relaxed"
            >
              <span className="w-5 h-5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a] text-[10px] font-mono font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{takeaway}</span>
            </li>
          ))}
        </ul>
      </div>

    </motion.div>
  );
}
