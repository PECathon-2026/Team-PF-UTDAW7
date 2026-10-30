"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Flame, CalendarCheck, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ReadingActivityEvent } from "@/lib/client/idb";
import { calculateWeeklyStatistics, WeeklyStatistics } from "@/lib/client/readingActivity";

interface WeeklyActivityCardProps {
  activities: ReadingActivityEvent[];
  savedTotal: number;
  isDark?: boolean;
  className?: string;
}

export default function WeeklyActivityCard({
  activities,
  savedTotal,
  isDark = false,
  className = "",
}: WeeklyActivityCardProps) {
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [stats, setStats] = useState<WeeklyStatistics | null>(null);

  // Client-side effect ensures real-time evaluation with local timezone and prevents SSR hydration mismatch
  useEffect(() => {
    setStats(calculateWeeklyStatistics(activities, weekOffset, new Date()));
  }, [activities, weekOffset]);

  const handlePrevWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    if (weekOffset < 0) {
      setWeekOffset((prev) => prev + 1);
    }
  };

  // Safe fallback while hydrating on client
  const currentStats: WeeklyStatistics = stats || {
    weekOffset,
    weekLabel: weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : `${Math.abs(weekOffset)}w ago`,
    dateRangeLabel: "Current Week",
    totalThisWeek: 0,
    totalLastWeek: 0,
    comparisonText: "Reading activity tracker active",
    comparisonType: "neutral",
    activeDaysCount: 0,
    currentStreak: 0,
    deepTimeMinutes: 0,
    deepTimeFormatted: "0m",
    dailyBars: [
      { dayIndex: 0, dayLabel: "M", dayName: "Mon", dateString: "", dateKey: "", count: 0, heightPercent: 0, heightPx: 10, isToday: false, isActive: false },
      { dayIndex: 1, dayLabel: "T", dayName: "Tue", dateString: "", dateKey: "", count: 0, heightPercent: 0, heightPx: 10, isToday: false, isActive: false },
      { dayIndex: 2, dayLabel: "W", dayName: "Wed", dateString: "", dateKey: "", count: 0, heightPercent: 0, heightPx: 10, isToday: false, isActive: false },
      { dayIndex: 3, dayLabel: "T", dayName: "Thu", dateString: "", dateKey: "", count: 0, heightPercent: 0, heightPx: 10, isToday: false, isActive: false },
      { dayIndex: 4, dayLabel: "F", dayName: "Fri", dateString: "", dateKey: "", count: 0, heightPercent: 0, heightPx: 10, isToday: true, isActive: false },
      { dayIndex: 5, dayLabel: "S", dayName: "Sat", dateString: "", dateKey: "", count: 0, heightPercent: 0, heightPx: 10, isToday: false, isActive: false },
      { dayIndex: 6, dayLabel: "S", dayName: "Sun", dateString: "", dateKey: "", count: 0, heightPercent: 0, heightPx: 10, isToday: false, isActive: false },
    ],
    canGoNext: weekOffset < 0,
    canGoPrev: true,
  };

  return (
    <div
      className={`rounded-2xl p-5 shadow-xs space-y-4 border transition-colors select-none ${
        isDark
          ? "bg-[#181614] border-[#2d2924] text-[#f5efe6]"
          : "bg-[#fdfaf5] border-[#e8dfd1] text-[#1f1c19]"
      } ${className}`}
    >
      {/* Header: Title and Week Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className={`font-serif font-bold text-sm tracking-tight ${isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"}`}>
            Weekly Activity
          </h4>
          <p className={`text-[10px] font-mono mt-0.5 ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>
            {currentStats.weekLabel} • {currentStats.dateRangeLabel}
          </p>
        </div>

        {/* Week Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevWeek}
            className={`p-1 rounded-md transition-colors ${
              isDark
                ? "hover:bg-[#25211c] text-[#a89d8f] hover:text-[#fbbf24]"
                : "hover:bg-[#f4ece1] text-[#786b59] hover:text-[#b45309]"
            }`}
            title="View previous week activity"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleNextWeek}
            disabled={!currentStats.canGoNext}
            className={`p-1 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
              isDark
                ? "hover:bg-[#25211c] text-[#a89d8f] hover:text-[#fbbf24]"
                : "hover:bg-[#f4ece1] text-[#786b59] hover:text-[#b45309]"
            }`}
            title={currentStats.canGoNext ? "View next week activity" : "Currently viewing this week"}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3-Column Metrics Row (Matching exact layout from original UI) */}
      <div
        className={`grid grid-cols-3 text-center border-b pb-3 font-serif ${
          isDark ? "border-[#2d2924]" : "border-[#e8dfd1]"
        }`}
      >
        <div>
          <div className={`text-xl font-bold transition-all ${isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"}`}>
            {currentStats.totalThisWeek}
          </div>
          <div className={`text-[10px] font-mono ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>
            essays read
          </div>
        </div>

        <div>
          <div className={`text-xl font-bold transition-all ${isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"}`}>
            {savedTotal}
          </div>
          <div className={`text-[10px] font-mono ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>
            saved
          </div>
        </div>

        <div>
          <div className="text-xl font-bold text-[#b45309] transition-all">
            {currentStats.deepTimeFormatted}
          </div>
          <div className={`text-[10px] font-mono ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>
            deep time
          </div>
        </div>
      </div>

      {/* Seven-Day Daily Reading Bar Chart */}
      <div className="space-y-1.5">
        <div className="flex items-end justify-between h-16 pt-2 px-1">
          {currentStats.dailyBars.map((bar) => {
            return (
              <div
                key={bar.dayIndex}
                className="flex flex-col items-center gap-1.5 flex-1 group relative cursor-default"
                title={`${bar.count} ${bar.count === 1 ? "essay" : "essays"} read on ${bar.dayName}${bar.dateString ? `, ${bar.dateString}` : ""}`}
              >
                {/* Tooltip on hover */}
                <div
                  className={`absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-[9px] font-mono px-1.5 py-0.5 rounded shadow whitespace-nowrap ${
                    isDark ? "bg-[#25211c] text-[#f5efe6] border border-[#38332c]" : "bg-[#1f1c19] text-[#fbf8f2]"
                  }`}
                >
                  {bar.count} read
                </div>

                {/* Vertical Bar */}
                <div
                  style={{ height: `${bar.heightPx}px` }}
                  className={`w-4 rounded-t transition-all duration-300 ${
                    bar.isToday
                      ? "bg-[#b45309] shadow-xs"
                      : bar.count > 0
                      ? isDark
                        ? "bg-amber-600/70 hover:bg-amber-500"
                        : "bg-[#b45309]/75 hover:bg-[#b45309]"
                      : isDark
                      ? "bg-[#2d2924] hover:bg-[#38332c]"
                      : "bg-[#e2d6c3] hover:bg-[#d6caba]"
                  }`}
                />

                {/* Day Letter Label (M, T, W, T, F, S, S) */}
                <span
                  className={`text-[9px] font-mono transition-colors ${
                    bar.isToday
                      ? "font-bold text-[#b45309]"
                      : bar.count > 0
                      ? isDark
                        ? "text-[#f5efe6] font-medium"
                        : "text-[#1f1c19] font-medium"
                      : isDark
                      ? "text-[#8c8172]"
                      : "text-[#8c7e6c]"
                  }`}
                >
                  {bar.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer: Streak, Active Days & Week-over-Week Comparison */}
      <div
        className={`pt-3 border-t text-[11px] font-mono flex items-center justify-between ${
          isDark ? "border-[#2d2924] text-[#a89d8f]" : "border-[#e8dfd1] text-[#786b59]"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <CalendarCheck className="w-3 h-3 text-[#b45309]" />
          <span>{currentStats.activeDaysCount}/7 active days</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Flame className={`w-3 h-3 ${currentStats.currentStreak > 0 ? "text-[#b45309] animate-pulse" : "text-[#8c7e6c]"}`} />
          <span>
            {currentStats.currentStreak > 0 ? `${currentStats.currentStreak}d streak` : "0d streak"}
          </span>
        </div>
      </div>

      {/* Week-over-Week Trend Indicator */}
      <div
        className={`text-[10px] font-mono px-2.5 py-1.5 rounded-lg flex items-center justify-between ${
          isDark ? "bg-[#1f1c19] text-[#a89d8f]" : "bg-[#f4ece1]/70 text-[#786b59]"
        }`}
      >
        <span className="flex items-center gap-1">
          {currentStats.comparisonType === "increase" ? (
            <TrendingUp className="w-3 h-3 text-[#10b981]" />
          ) : currentStats.comparisonType === "decrease" ? (
            <TrendingDown className="w-3 h-3 text-[#b45309]" />
          ) : (
            <Minus className="w-3 h-3 text-[#8c7e6c]" />
          )}
          <span>Vs prior week:</span>
        </span>
        <span className="font-semibold">{currentStats.comparisonText}</span>
      </div>
    </div>
  );
}
