import { parseFeedXml, ParsedArticle } from "./feedParser";
import {
  StoredSubscription,
  idbSaveArticles,
  idbSaveSubscription,
  idbGetArticles,
} from "./idb";

export interface SyncResult {
  updatedArticles: ParsedArticle[];
  newPostsCount: number;
  errors: string[];
}

/**
 * Refreshes a single feed in the background without clearing cached data on network failures.
 */
export async function refreshSingleFeed(
  sub: StoredSubscription,
  existingArticles: ParsedArticle[]
): Promise<{ articles: ParsedArticle[]; newCount: number; error?: string }> {
  if (!sub.feedUrl) {
    return { articles: existingArticles.filter((a) => a.blogId === sub.id), newCount: 0 };
  }

  // Filter existing articles belonging to this feed
  const existingForFeed = existingArticles.filter((a) => a.blogId === sub.id);
  const existingMap = new Map<string, ParsedArticle>();
  for (const a of existingForFeed) {
    existingMap.set(a.url || a.id, a);
    existingMap.set(a.id, a);
  }

  try {
    const res = await fetch(`/api/fetch?url=${encodeURIComponent(sub.feedUrl)}`);
    if (!res.ok) {
      // Server error or upstream down: DO NOT OVERWRITE VALID CACHED POSTS
      return {
        articles: existingForFeed,
        newCount: 0,
        error: `Feed fetch returned HTTP ${res.status}`,
      };
    }

    const xml = await res.text();
    const parsed = parseFeedXml(xml, sub.feedUrl);

    if (!parsed.articles || parsed.articles.length === 0) {
      // Empty or unparseable feed: retain cached posts (Task B resilience requirement)
      return {
        articles: existingForFeed,
        newCount: 0,
        error: "No articles returned in XML payload",
      };
    }

    let newCount = 0;
    const mergedArticles: ParsedArticle[] = [];

    for (const fresh of parsed.articles) {
      // Match by URL or by Title
      const cached = existingMap.get(fresh.url) || existingMap.get(fresh.id);

      if (cached) {
        // PRESERVE user actions & reading states
        mergedArticles.push({
          ...fresh,
          id: cached.id,
          blogId: sub.id,
          blogName: sub.name,
          unread: cached.unread, // PRESERVES READ STATE
          saved: cached.saved,   // PRESERVES SAVED STATE
          // If full article was already extracted, keep extracted full text
          content:
            cached.content && cached.content.length > 800
              ? cached.content
              : fresh.content,
        });
      } else {
        newCount += 1;
        mergedArticles.push({
          ...fresh,
          blogId: sub.id,
          blogName: sub.name,
          unread: true,
          saved: false,
        });
      }
    }

    // Persist to IndexedDB
    await idbSaveArticles(mergedArticles);

    // Update subscription unread count
    const unreadCount = mergedArticles.filter((a) => a.unread).length;
    await idbSaveSubscription({
      ...sub,
      unreadCount,
    });

    return { articles: mergedArticles, newCount };
  } catch (err: any) {
    // Network offline or timeout: preserve valid cached posts
    return {
      articles: existingForFeed,
      newCount: 0,
      error: err.message || "Network offline",
    };
  }
}

/**
 * Refreshes all subscribed feeds in parallel in the background.
 * Guarantees zero data loss if offline or if any feed fails.
 */
export async function refreshAllFeeds(
  subscriptions: StoredSubscription[],
  currentArticles: ParsedArticle[]
): Promise<SyncResult> {
  const errors: string[] = [];
  let totalNew = 0;

  // Track articles from subscriptions being refreshed
  const refreshedBlogIds = new Set(subscriptions.map((s) => s.id));
  const otherArticles = currentArticles.filter((a) => !refreshedBlogIds.has(a.blogId));

  const results = await Promise.allSettled(
    subscriptions.map((sub) => refreshSingleFeed(sub, currentArticles))
  );

  const allRefreshedArticles: ParsedArticle[] = [...otherArticles];

  for (let i = 0; i < results.length; i++) {
    const res = results[i];
    const sub = subscriptions[i];

    if (res.status === "fulfilled") {
      allRefreshedArticles.push(...res.value.articles);
      totalNew += res.value.newCount;
      if (res.value.error) {
        errors.push(`${sub.name}: ${res.value.error}`);
      }
    } else {
      errors.push(`${sub.name}: ${res.reason?.message || "Sync failed"}`);
      // Fallback: retain existing articles for this blog
      const existing = currentArticles.filter((a) => a.blogId === sub.id);
      allRefreshedArticles.push(...existing);
    }
  }

  // Deduplicate and sort chronologically
  const uniqueMap = new Map<string, ParsedArticle>();
  for (const a of allRefreshedArticles) {
    const key = a.url || a.id;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, a);
    }
  }

  const sortedArticles = Array.from(uniqueMap.values()).sort(
    (a, b) => (b.publishedAt || 0) - (a.publishedAt || 0)
  );

  return {
    updatedArticles: sortedArticles,
    newPostsCount: totalNew,
    errors,
  };
}
