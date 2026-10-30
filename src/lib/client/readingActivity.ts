import { ReadingActivityEvent } from "./idb";

export interface DayBarData {
  dayIndex: number;      // 0 = Mon, 6 = Sun
  dayLabel: string;      // "M", "T", "W", "T", "F", "S", "S"
  dayName: string;       // "Mon", "Tue", etc.
  dateString: string;    // "Oct 30"
  dateKey: string;       // "YYYY-MM-DD"
  count: number;         // number of articles read on this day
  heightPercent: number; // 0 to 100%
  heightPx: number;      // 8px to 56px for bar rendering
  isToday: boolean;
  isActive: boolean;     // count > 0
}

export interface WeeklyStatistics {
  weekOffset: number;        // 0 = current week, -1 = last week, etc.
  weekLabel: string;         // e.g. "This Week" or "Last Week"
  dateRangeLabel: string;    // e.g. "Oct 26 – Nov 1"
  totalThisWeek: number;     // total articles read in selected week
  totalLastWeek: number;     // total articles read in prior week
  comparisonText: string;    // "+3 vs last week", "-1 vs last week", "Equal to last week"
  comparisonType: "increase" | "decrease" | "equal" | "neutral";
  activeDaysCount: number;   // active days out of 7 (e.g. 5)
  currentStreak: number;     // consecutive days with at least 1 article read
  deepTimeMinutes: number;   // sum of reading time in minutes
  deepTimeFormatted: string; // e.g. "3h 24m"
  dailyBars: DayBarData[];   // 7 days from Monday to Sunday
  canGoNext: boolean;        // true if weekOffset < 0
  canGoPrev: boolean;        // always true to view older history
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * Returns Monday at 00:00:00.000 local time for a given date and weekOffset.
 */
export function getStartOfWeek(date?: Date, weekOffset: number = 0): Date {
  const d = date ? new Date(date) : new Date();
  const day = (d.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
  d.setDate(d.getDate() - day + weekOffset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formats a Date object into local "YYYY-MM-DD" string key for date-based grouping.
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calculates current reading streak: consecutive days with at least 1 article read,
 * ending today or yesterday (allows user to maintain streak before reading today).
 */
export function calculateReadingStreak(
  events: ReadingActivityEvent[],
  nowDate?: Date
): number {
  const activeEvents = events.filter((e) => e && e.active !== false);
  if (activeEvents.length === 0) return 0;

  const now = nowDate || new Date();
  const readDatesSet = new Set<string>();
  for (const e of activeEvents) {
    const d = new Date(e.timestamp);
    readDatesSet.add(formatDateKey(d));
  }

  const todayKey = formatDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  let streak = 0;
  let checkDate = new Date(now);

  if (readDatesSet.has(todayKey)) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (readDatesSet.has(yesterdayKey)) {
    streak = 1;
    checkDate = new Date(yesterday);
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    return 0;
  }

  // Walk backward day by day
  while (true) {
    const key = formatDateKey(checkDate);
    if (readDatesSet.has(key)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Computes all weekly statistics and bar data for a given week offset.
 */
export function calculateWeeklyStatistics(
  events: ReadingActivityEvent[],
  weekOffset: number = 0,
  nowDate?: Date
): WeeklyStatistics {
  const now = nowDate || new Date();
  const activeEvents = events.filter((e) => e && e.active !== false);

  const startOfThisWeek = getStartOfWeek(now, weekOffset);
  const endOfThisWeek = new Date(startOfThisWeek);
  endOfThisWeek.setDate(endOfThisWeek.getDate() + 6);
  endOfThisWeek.setHours(23, 59, 59, 999);

  const startOfPrevWeek = getStartOfWeek(now, weekOffset - 1);
  const endOfPrevWeek = new Date(startOfPrevWeek);
  endOfPrevWeek.setDate(endOfPrevWeek.getDate() + 6);
  endOfPrevWeek.setHours(23, 59, 59, 999);

  // Group events by date key
  const countByDateKey = new Map<string, number>();
  let deepTimeMinutes = 0;
  let totalThisWeek = 0;
  let totalLastWeek = 0;

  for (const ev of activeEvents) {
    const ts = ev.timestamp;
    // Check if in selected week
    if (ts >= startOfThisWeek.getTime() && ts <= endOfThisWeek.getTime()) {
      const d = new Date(ts);
      const key = formatDateKey(d);
      countByDateKey.set(key, (countByDateKey.get(key) || 0) + 1);
      totalThisWeek += 1;
      deepTimeMinutes += ev.readTimeMinutes || 6;
    }

    // Check if in prior week
    if (ts >= startOfPrevWeek.getTime() && ts <= endOfPrevWeek.getTime()) {
      totalLastWeek += 1;
    }
  }

  // Build daily bars for the 7 days of the selected week (Mon to Sun)
  const todayKey = formatDateKey(now);
  const rawBars: Array<{
    dayIndex: number;
    dayLabel: string;
    dayName: string;
    dateString: string;
    dateKey: string;
    count: number;
    isToday: boolean;
    isActive: boolean;
  }> = [];

  let maxDailyCount = 0;
  let activeDaysCount = 0;

  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(startOfThisWeek);
    dayDate.setDate(dayDate.getDate() + i);
    const key = formatDateKey(dayDate);
    const count = countByDateKey.get(key) || 0;

    if (count > 0) activeDaysCount += 1;
    if (count > maxDailyCount) maxDailyCount = count;

    const isToday = key === todayKey;
    const dateString = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    rawBars.push({
      dayIndex: i,
      dayLabel: DAY_LABELS[i],
      dayName: DAY_NAMES[i],
      dateString,
      dateKey: key,
      count,
      isToday,
      isActive: count > 0,
    });
  }

  // Scale bar heights proportionally (min 10px, max 56px for visual balance)
  const chartHeightCeiling = Math.max(maxDailyCount, 3);
  const dailyBars: DayBarData[] = rawBars.map((b) => {
    let heightPercent = 0;
    let heightPx = 10; // Baseline stub

    if (b.count > 0) {
      heightPercent = Math.min(100, Math.round((b.count / chartHeightCeiling) * 100));
      heightPx = Math.max(14, Math.round((b.count / chartHeightCeiling) * 56));
    } else if (b.isToday) {
      heightPx = 12; // Slight highlight stub for today even if 0 reads yet
    }

    return {
      ...b,
      heightPercent,
      heightPx,
    };
  });

  // Calculate streak across entire history
  const currentStreak = calculateReadingStreak(activeEvents, now);

  // Deep time formatting (e.g. "3h 24m" or "45m")
  const hours = Math.floor(deepTimeMinutes / 60);
  const mins = deepTimeMinutes % 60;
  const deepTimeFormatted =
    deepTimeMinutes === 0
      ? "0m"
      : hours > 0
      ? `${hours}h ${mins}m`
      : `${mins}m`;

  // Date range label
  const startMonth = startOfThisWeek.toLocaleDateString("en-US", { month: "short" });
  const endMonth = endOfThisWeek.toLocaleDateString("en-US", { month: "short" });
  const startDay = startOfThisWeek.getDate();
  const endDay = endOfThisWeek.getDate();

  const dateRangeLabel =
    startMonth === endMonth
      ? `${startMonth} ${startDay} – ${endDay}`
      : `${startMonth} ${startDay} – ${endMonth} ${endDay}`;

  let weekLabel = "This Week";
  if (weekOffset === -1) {
    weekLabel = "Last Week";
  } else if (weekOffset < -1) {
    weekLabel = `${Math.abs(weekOffset)}w ago`;
  }

  // Week comparison
  let comparisonText = "No activity yet";
  let comparisonType: "increase" | "decrease" | "equal" | "neutral" = "neutral";

  if (totalLastWeek === 0 && totalThisWeek === 0) {
    comparisonText = "No reading activity yet";
    comparisonType = "neutral";
  } else if (totalLastWeek === 0 && totalThisWeek > 0) {
    comparisonText = `+${totalThisWeek} new this week`;
    comparisonType = "increase";
  } else {
    const diff = totalThisWeek - totalLastWeek;
    if (diff > 0) {
      comparisonText = `+${diff} vs last week`;
      comparisonType = "increase";
    } else if (diff < 0) {
      comparisonText = `${diff} vs last week`;
      comparisonType = "decrease";
    } else {
      comparisonText = "Equal to last week";
      comparisonType = "equal";
    }
  }

  return {
    weekOffset,
    weekLabel,
    dateRangeLabel,
    totalThisWeek,
    totalLastWeek,
    comparisonText,
    comparisonType,
    activeDaysCount,
    currentStreak,
    deepTimeMinutes,
    deepTimeFormatted,
    dailyBars,
    canGoNext: weekOffset < 0,
    canGoPrev: true,
  };
}
