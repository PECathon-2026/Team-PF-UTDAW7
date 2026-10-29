"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({
  className = "",
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Render placeholder to avoid layout shift before hydration
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-[#e2d6c3] bg-white/80 dark:bg-[#221f1c] dark:border-[#38332c] flex items-center justify-center opacity-60 ${className}`}
        aria-hidden="true"
      >
        <Moon className="w-4 h-4 text-[#786b59]" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light paper theme" : "Switch to dark midnight theme"}
      title={isDark ? "Switch to Daylight Paper (Light Mode)" : "Switch to Midnight Library (Dark Mode)"}
      className={`relative inline-flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer select-none group ${
        isDark
          ? "bg-[#221f1c] border-[#38332c] text-amber-400 hover:bg-[#2b2723] hover:border-amber-400/50 shadow-sm"
          : "bg-white border-[#e2d6c3] text-[#574e44] hover:bg-[#f4ece1] hover:text-[#1f1c19] shadow-2xs"
      } ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Moon className="w-4 h-4 text-[#574e44] group-hover:-rotate-12 transition-transform duration-300" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="text-xs font-serif font-medium hidden sm:inline">
          {isDark ? "Light" : "Dark"}
        </span>
      )}
    </button>
  );
}
