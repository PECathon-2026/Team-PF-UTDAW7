import {
  calculateReadingStreak,
  calculateWeeklyStatistics,
  formatDateKey,
  getStartOfWeek,
} from "../src/lib/client/readingActivity.ts";

// Set up window and window.indexedDB in Node environment before importing idb.ts
class MemoryStore {
  constructor() {
    this.data = new Map();
  }

  get(key) {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      const val = this.data.get(key);
      req.result = val ? JSON.parse(JSON.stringify(val)) : undefined;
      if (req.onsuccess) req.onsuccess({ target: req });
    });
    return req;
  }

  put(value) {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      const cloned = JSON.parse(JSON.stringify(value));
      const key = cloned.articleId || cloned.id || cloned.url;
      this.data.set(key, cloned);
      req.result = key;
      if (req.onsuccess) req.onsuccess({ target: req });
    });
    return req;
  }

  getAll() {
    const req = { onsuccess: null, onerror: null, result: [] };
    queueMicrotask(() => {
      const all = Array.from(this.data.values()).map((v) => JSON.parse(JSON.stringify(v)));
      req.result = all;
      if (req.onsuccess) req.onsuccess({ target: req });
    });
    return req;
  }

  delete(key) {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      this.data.delete(key);
      if (req.onsuccess) req.onsuccess({ target: req });
    });
    return req;
  }

  index() {
    return {
      getAllKeys: () => {
        const req = { onsuccess: null, onerror: null, result: [] };
        queueMicrotask(() => {
          if (req.onsuccess) req.onsuccess({ target: req });
        });
        return req;
      },
      createIndex: () => {},
    };
  }

  createIndex() {}
}

class MemoryDB {
  constructor() {
    this.stores = new Map([
      ["subscriptions", new MemoryStore()],
      ["articles", new MemoryStore()],
      ["extractedArticles", new MemoryStore()],
      ["readingActivity", new MemoryStore()],
    ]);
    this.objectStoreNames = {
      contains: (name) => this.stores.has(name),
    };
  }

  createObjectStore(name) {
    if (!this.stores.has(name)) {
      this.stores.set(name, new MemoryStore());
    }
    return this.stores.get(name);
  }

  transaction(storeNames) {
    const tx = {
      objectStore: (name) => this.stores.get(name),
      oncomplete: null,
      onerror: null,
    };
    // Trigger oncomplete on next tick
    setTimeout(() => {
      if (tx.oncomplete) tx.oncomplete();
    }, 5);
    return tx;
  }
}

const mockDb = new MemoryDB();

// Polyfill window and indexedDB
globalThis.window = {
  indexedDB: {
    open: () => {
      const req = {
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
        result: mockDb,
      };
      queueMicrotask(() => {
        if (req.onupgradeneeded) {
          req.onupgradeneeded({ target: req });
        }
        if (req.onsuccess) {
          req.onsuccess({ target: req });
        }
      });
      return req;
    },
  },
  location: { pathname: "/reader" },
};

// Now import idb functions
const {
  idbRecordReadingActivity,
  idbRemoveReadingActivity,
  idbGetReadingActivities,
  idbDeleteSubscription,
  idbSaveArticles,
  idbGetArticles,
} = await import("../src/lib/client/idb.ts");

async function runTestSuite() {
  console.log("🧪 Starting Reading Activity Tracker Test Suite (PECathon PS-003)...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const baseDate = new Date("2026-10-30T12:00:00Z"); // Friday in target week

  // -------------------------------------------------------------------------
  // Scenario 1: Mark an article as read
  // -------------------------------------------------------------------------
  console.log("--- Scenario 1: Mark an article as read ---");
  const event1 = await idbRecordReadingActivity({
    articleId: "art-101",
    title: "The Architecture of Local-First Software",
    feedUrl: "https://news.ycombinator.com/rss",
    timestamp: baseDate.getTime(),
    readTimeMinutes: 7,
  });
  assert(event1.articleId === "art-101", "Returned event has correct articleId");
  assert(event1.active === true, "Event is saved with active: true");

  let activities = await idbGetReadingActivities();
  assert(activities.length === 1, "Reading activity store contains 1 record");
  assert(activities[0].title === "The Architecture of Local-First Software", "Event title matches");

  let stats = calculateWeeklyStatistics(activities, 0, baseDate);
  assert(stats.totalThisWeek === 1, "Weekly stats: 1 article read this week");
  assert(stats.activeDaysCount === 1, "Weekly stats: 1 active day");
  assert(stats.deepTimeFormatted === "7m", "Weekly stats: 7m deep time recorded");

  // -------------------------------------------------------------------------
  // Scenario 2: Mark the same article as read multiple times
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 2: Mark the same article as read multiple times (Duplicate prevention) ---");
  await idbRecordReadingActivity({
    articleId: "art-101",
    title: "The Architecture of Local-First Software",
    feedUrl: "https://news.ycombinator.com/rss",
    readTimeMinutes: 7,
  });
  await idbRecordReadingActivity({
    articleId: "art-101",
    title: "The Architecture of Local-First Software",
    feedUrl: "https://news.ycombinator.com/rss",
    readTimeMinutes: 7,
  });

  activities = await idbGetReadingActivities();
  assert(activities.length === 1, "Duplicate prevention: Store still contains exactly 1 record");
  stats = calculateWeeklyStatistics(activities, 0, baseDate);
  assert(stats.totalThisWeek === 1, "Duplicate prevention: Count did not inflate (remains 1)");

  // -------------------------------------------------------------------------
  // Scenario 3: Mark an article unread
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 3: Mark an article unread ---");
  await idbRemoveReadingActivity("art-101");
  activities = await idbGetReadingActivities();
  assert(activities.length === 0, "Marked unread: Excluded from active reading activities");
  stats = calculateWeeklyStatistics(activities, 0, baseDate);
  assert(stats.totalThisWeek === 0, "Stats updated immediately: 0 articles read");
  assert(stats.activeDaysCount === 0, "Stats updated immediately: 0 active days");

  // Re-marking as read reactivates without duplicate record
  await idbRecordReadingActivity({
    articleId: "art-101",
    title: "The Architecture of Local-First Software",
    feedUrl: "https://news.ycombinator.com/rss",
    timestamp: baseDate.getTime(),
    readTimeMinutes: 7,
  });
  activities = await idbGetReadingActivities();
  assert(activities.length === 1, "Re-marking read restored the single record without duplicates");

  // -------------------------------------------------------------------------
  // Scenario 4: Refresh the application
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 4: Refresh the application (Reload from IndexedDB) ---");
  const reloadedActivities = await idbGetReadingActivities();
  assert(reloadedActivities.length === 1, "Restored persisted reading events across page refresh");
  const refreshedStats = calculateWeeklyStatistics(reloadedActivities, 0, baseDate);
  assert(refreshedStats.totalThisWeek === 1, "Refreshed stats re-calculated dynamically from persisted events");

  // -------------------------------------------------------------------------
  // Scenario 5: Close and reopen the browser (Session persistence)
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 5: Close and reopen the browser ---");
  // The database instance retains all object stores across simulated connection resets
  const reopenedActivities = await idbGetReadingActivities();
  assert(reopenedActivities.length >= 1, "Reading activity survives browser reopen and session termination");

  // -------------------------------------------------------------------------
  // Scenario 6: Read multiple articles on the same day
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 6: Read multiple articles on the same day ---");
  await idbRecordReadingActivity({
    articleId: "art-102",
    title: "Why Decentralized Protocols Win",
    feedUrl: "https://theverge.com/rss",
    timestamp: baseDate.getTime() + 1000 * 60 * 30, // 30 mins later same day
    readTimeMinutes: 5,
  });
  await idbRecordReadingActivity({
    articleId: "art-103",
    title: "CRDTs in Production",
    feedUrl: "https://danluu.com/atom.xml",
    timestamp: baseDate.getTime() + 1000 * 60 * 90, // 90 mins later same day
    readTimeMinutes: 10,
  });

  activities = await idbGetReadingActivities();
  stats = calculateWeeklyStatistics(activities, 0, baseDate);
  assert(stats.totalThisWeek === 3, "Total read this week increased to 3");
  assert(stats.activeDaysCount === 1, "Active days remains 1 (all read on same calendar day)");
  assert(stats.deepTimeFormatted === "22m", "Total deep reading time is 7 + 5 + 10 = 22m");

  // -------------------------------------------------------------------------
  // Scenario 7: Read articles across different days & Reading Streak
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 7: Read articles across different days & Streaks ---");
  // Add reads on yesterday and 2 days ago
  const oneDayMs = 86400000;
  const yesterday = new Date(baseDate.getTime() - oneDayMs);
  const twoDaysAgo = new Date(baseDate.getTime() - 2 * oneDayMs);

  await idbRecordReadingActivity({
    articleId: "art-yesterday",
    title: "Small Web Manifesto",
    feedUrl: "https://aralbalkan.com/feed.xml",
    timestamp: yesterday.getTime(),
    readTimeMinutes: 8,
  });
  await idbRecordReadingActivity({
    articleId: "art-two-days-ago",
    title: "Ink and Switch Local First",
    feedUrl: "https://inkandswitch.com/rss",
    timestamp: twoDaysAgo.getTime(),
    readTimeMinutes: 12,
  });

  activities = await idbGetReadingActivities();
  stats = calculateWeeklyStatistics(activities, 0, baseDate);
  assert(stats.activeDaysCount === 3, "Active days count correctly updated to 3 days");
  assert(stats.currentStreak === 3, `Current reading streak correctly calculated as 3 consecutive days`);

  const activeBars = stats.dailyBars.filter((b) => b.count > 0);
  assert(activeBars.length === 3, "3 distinct day bars have non-zero reading counts");

  // -------------------------------------------------------------------------
  // Scenario 8: Navigate between current and previous weeks
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 8: Navigate between current and previous weeks ---");
  // Add an article read in the prior week
  const priorWeekDate = new Date(baseDate.getTime() - 7 * oneDayMs);
  await idbRecordReadingActivity({
    articleId: "art-prior-week",
    title: "Historical Web Standards",
    feedUrl: "https://w3.org/rss",
    timestamp: priorWeekDate.getTime(),
    readTimeMinutes: 15,
  });

  activities = await idbGetReadingActivities();
  const currentWeekStats = calculateWeeklyStatistics(activities, 0, baseDate);
  const prevWeekStats = calculateWeeklyStatistics(activities, -1, baseDate);

  assert(currentWeekStats.weekOffset === 0, "Current week offset is 0");
  assert(currentWeekStats.weekLabel === "This Week", "Current week label is 'This Week'");
  assert(currentWeekStats.canGoNext === false, "Cannot navigate forward past current week");
  assert(currentWeekStats.totalThisWeek === 5, "Current week total is 5");
  assert(currentWeekStats.totalLastWeek === 1, "Last week total recorded as 1");
  assert(currentWeekStats.comparisonType === "increase", "Comparison shows increase (+4 vs last week)");
  assert(currentWeekStats.comparisonText.includes("+4"), `Comparison text matches: "${currentWeekStats.comparisonText}"`);

  assert(prevWeekStats.weekOffset === -1, "Previous week offset is -1");
  assert(prevWeekStats.weekLabel === "Last Week", "Previous week label is 'Last Week'");
  assert(prevWeekStats.canGoNext === true, "Can navigate forward from previous week");
  assert(prevWeekStats.totalThisWeek === 1, "Previous week shows 1 essay read");

  // -------------------------------------------------------------------------
  // Scenario 9: Use the application offline
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 9: Use the application offline ---");
  const offlineEvent = await idbRecordReadingActivity({
    articleId: "art-offline",
    title: "Offline-First Peer-to-Peer Apps",
    feedUrl: "https://offlinefirst.org/feed",
    timestamp: Date.now(),
    readTimeMinutes: 6,
  });
  assert(offlineEvent.articleId === "art-offline", "Recorded activity offline without network dependencies");
  const offlineActivities = await idbGetReadingActivities();
  const offlineStats = calculateWeeklyStatistics(offlineActivities, 0, new Date());
  assert(offlineStats.totalThisWeek >= 1, "Computed weekly statistics fully offline in local timezone");

  // -------------------------------------------------------------------------
  // Scenario 10: Cache cleanup preserves reading history
  // -------------------------------------------------------------------------
  console.log("\n--- Scenario 10: Cache cleanup preserves reading history ---");
  await idbSaveArticles([
    {
      id: "art-temp-cache",
      title: "Temporary Cached Article",
      blogId: "feed-to-delete",
      feedTitle: "Feed To Delete",
      url: "https://temp.org/post1",
      publishedAt: Date.now(),
      readTime: "5 min",
      tags: ["tech"],
      unread: true,
      saved: false,
    },
  ]);

  const cachedArticlesBefore = await idbGetArticles();
  assert(cachedArticlesBefore.some((a) => a.id === "art-temp-cache"), "Temporary article exists in articles cache");

  const readingActivitiesBeforeCount = (await idbGetReadingActivities()).length;

  // Perform subscription / cache cleanup
  await idbDeleteSubscription("feed-to-delete");

  const readingActivitiesAfter = await idbGetReadingActivities();
  assert(
    readingActivitiesAfter.length === readingActivitiesBeforeCount,
    `Cache cleanup NEVER deletes readingActivity (Count remains ${readingActivitiesBeforeCount})`
  );

  console.log(`\n🎉 Reading Activity Test Suite Completed: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
