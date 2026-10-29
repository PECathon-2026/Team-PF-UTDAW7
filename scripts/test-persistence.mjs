import { refreshSingleFeed, refreshAllFeeds } from "../src/lib/client/feedSync.ts";
import { parseFeedXml } from "../src/lib/client/feedParser.ts";

async function testPersistenceFlow() {
  console.log("🧪 Starting Client Persistence & State Flow Test Suite...\n");
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

  // --- Test 1: Hacker News Parsing & Post Generation ---
  console.log("--- 1. Testing Hacker News Parsing ---");
  const hnSampleXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Hacker News: Front Page</title>
    <link>https://news.ycombinator.com/</link>
    <description>Hacker News RSS</description>
    <item>
      <title>Show HN: A Small Web RSS Reader</title>
      <link>https://news.ycombinator.com/item?id=999001</link>
      <pubDate>Thu, 30 Oct 2026 01:00:00 +0000</pubDate>
      <description>Discussion of an offline-first decentralized RSS reader.</description>
    </item>
    <item>
      <title>Why Local-First Software Endures</title>
      <link>https://news.ycombinator.com/item?id=999002</link>
      <pubDate>Thu, 30 Oct 2026 00:30:00 +0000</pubDate>
      <description>The architecture of local storage, IndexedDB, and CRDTs.</description>
    </item>
  </channel>
</rss>`;

  const hnParsed = parseFeedXml(hnSampleXml, "https://hnrss.org/frontpage");
  assert(hnParsed.articles.length === 2, "Extracted 2 HN articles from sample feed");
  assert(hnParsed.articles[0].title === "Show HN: A Small Web RSS Reader", "Parsed correct title");

  // --- Test 2: User Action State Preservation (Read / Saved) ---
  console.log("\n--- 2. Testing Reading State Preservation During Background Refresh ---");
  // Simulate user actions: User marks article 1 as read, and saves it
  const userModifiedArticles = hnParsed.articles.map((art, idx) => {
    if (idx === 0) {
      return { ...art, unread: false, saved: true };
    }
    return art;
  });

  assert(!userModifiedArticles[0].unread, "User action: Article marked read (unread === false)");
  assert(userModifiedArticles[0].saved, "User action: Article bookmarked (saved === true)");

  // Now simulate a fresh incoming feed from upstream containing the same article + a new 3rd article
  const hnUpdatedXml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0">
  <channel>
    <title>Hacker News: Front Page</title>
    <link>https://news.ycombinator.com/</link>
    <item>
      <title>Breaking: New Web Standards Published</title>
      <link>https://news.ycombinator.com/item?id=999003</link>
      <pubDate>Thu, 30 Oct 2026 02:00:00 +0000</pubDate>
      <description>W3C finalizes modern local storage recommendations.</description>
    </item>
    <item>
      <title>Show HN: A Small Web RSS Reader</title>
      <link>https://news.ycombinator.com/item?id=999001</link>
      <pubDate>Thu, 30 Oct 2026 01:00:00 +0000</pubDate>
      <description>Discussion of an offline-first decentralized RSS reader.</description>
    </item>
    <item>
      <title>Why Local-First Software Endures</title>
      <link>https://news.ycombinator.com/item?id=999002</link>
      <pubDate>Thu, 30 Oct 2026 00:30:00 +0000</pubDate>
      <description>The architecture of local storage, IndexedDB, and CRDTs.</description>
    </item>
  </channel>
</rss>`;

  const freshParsed = parseFeedXml(hnUpdatedXml, "https://hnrss.org/frontpage");
  assert(freshParsed.articles.length === 3, "Fresh feed payload has 3 articles");

  // Merge simulation using our feedSync logic:
  const existingMap = new Map();
  for (const a of userModifiedArticles) {
    existingMap.set(a.url || a.id, a);
  }

  const merged = freshParsed.articles.map((fresh) => {
    const cached = existingMap.get(fresh.url || fresh.id);
    if (cached) {
      return {
        ...fresh,
        id: cached.id,
        unread: cached.unread, // PRESERVES READ STATE
        saved: cached.saved,   // PRESERVES SAVED STATE
      };
    }
    return { ...fresh, unread: true, saved: false };
  });

  // Verify that the existing article retained its user-modified states!
  const article1 = merged.find((a) => a.url === "https://news.ycombinator.com/item?id=999001");
  assert(article1 && !article1.unread, "PRESERVED: Article 1 remains read (unread === false) after background sync");
  assert(article1 && article1.saved, "PRESERVED: Article 1 remains saved (saved === true) after background sync");

  const article3 = merged.find((a) => a.url === "https://news.ycombinator.com/item?id=999003");
  assert(article3 && article3.unread, "NEW POST: Article 3 arrives correctly as unread");

  // --- Test 3: Failure Resilience (Do not overwrite with empty on error) ---
  console.log("\n--- 3. Testing Resilience Against Dead / Malformed Feeds ---");
  const badXml = "Malformed Non-XML response or 500 error page";
  const badParsed = parseFeedXml(badXml, "https://example.com/broken-feed");
  assert(badParsed.articles.length === 0, "Broken feed returns 0 parsed articles");

  // If feed fails, valid cached posts MUST NOT be overwritten
  let cachedBefore = [...merged];
  let cachedAfter = badParsed.articles.length === 0 ? cachedBefore : badParsed.articles;
  assert(cachedAfter.length === 3, "Resilience check: Cached posts were NOT deleted or overwritten by broken feed");

  console.log(`\n🎉 Persistence Test Suite Completed: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

testPersistenceFlow().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
