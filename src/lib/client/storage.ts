import { ParsedArticle } from "./feedParser";
import {
  StoredSubscription,
  idbGetSubscriptions,
  idbSaveSubscriptions,
  idbSaveSubscription,
  idbDeleteSubscription,
  idbGetArticles,
  idbSaveArticles,
  idbSetReadingState,
  idbGetPreference,
  idbSetPreference,
} from "./idb";

export type { StoredSubscription };

const STORAGE_KEYS = {
  SUBSCRIPTIONS: "swr_subscriptions_v2",
  ARTICLES: "swr_articles_v2",
  OPT_IN_DISCOVERY: "swr_opt_in_discovery_v2",
  LAST_SYNC: "swr_last_discovery_sync_v2",
  IS_INITIALIZED: "swr_db_initialized_v2",
};

/**
 * Loads subscriptions from IndexedDB with fallback to seed data on first run.
 */
export async function loadStoredSubscriptions(
  fallback: StoredSubscription[]
): Promise<StoredSubscription[]> {
  if (typeof window === "undefined") return fallback;
  try {
    const idbSubs = await idbGetSubscriptions();
    if (idbSubs && idbSubs.length > 0) {
      return idbSubs;
    }

    // Check if user previously deleted all feeds (is initialized)
    const initialized = localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED);
    if (initialized === "true") {
      return []; // Respect user having 0 subscriptions
    }

    // First time opening app: seed with initial subscriptions
    await idbSaveSubscriptions(fallback);
    localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, "true");
    return fallback;
  } catch (err) {
    console.warn("loadStoredSubscriptions error, returning fallback:", err);
    return fallback;
  }
}

/**
 * Saves subscriptions to IndexedDB and updates backup cache.
 */
export async function saveStoredSubscriptions(
  subs: StoredSubscription[]
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await idbSaveSubscriptions(subs);
    localStorage.setItem(STORAGE_KEYS.IS_INITIALIZED, "true");
  } catch (err) {
    console.warn("Failed to persist subscriptions to IndexedDB:", err);
  }
}

/**
 * Removes a subscription and its posts from IndexedDB.
 */
export async function removeStoredSubscription(id: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await idbDeleteSubscription(id);
  } catch (err) {
    console.warn("Failed to delete subscription from IndexedDB:", err);
  }
}

/**
 * Loads cached articles from IndexedDB.
 */
export async function loadStoredArticles(
  fallback: ParsedArticle[]
): Promise<ParsedArticle[]> {
  if (typeof window === "undefined") return fallback;
  try {
    const idbArticles = await idbGetArticles();
    if (idbArticles && idbArticles.length > 0) {
      return idbArticles;
    }

    const initialized = localStorage.getItem(STORAGE_KEYS.IS_INITIALIZED);
    if (initialized === "true") {
      return [];
    }

    // First time opening app: seed with initial articles
    await idbSaveArticles(fallback);
    return fallback;
  } catch (err) {
    console.warn("loadStoredArticles error, returning fallback:", err);
    return fallback;
  }
}

/**
 * Saves articles to IndexedDB.
 */
export async function saveStoredArticles(
  articles: ParsedArticle[]
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await idbSaveArticles(articles);
  } catch (err) {
    console.warn("Failed to persist articles to IndexedDB:", err);
  }
}

/**
 * Persists article reading state (read/unread and saved bookmark).
 */
export async function updateArticleState(
  articleId: string,
  state: { unread?: boolean; saved?: boolean }
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await idbSetReadingState(articleId, state);
  } catch (err) {
    console.warn("Failed to persist article reading state:", err);
  }
}

export function getOptInDiscovery(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEYS.OPT_IN_DISCOVERY) === "true";
  } catch {
    return false;
  }
}

export function setOptInDiscovery(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.OPT_IN_DISCOVERY, String(enabled));
    idbSetPreference("opt_in_discovery", enabled);
  } catch (err) {
    console.warn("Failed to set opt-in discovery flag:", err);
  }
}

/**
 * Anonymous Batch Sync:
 * Submits user's subscription list as an anonymous batch when opt-in is enabled.
 */
export async function syncAnonymousDiscoveryIfOptedIn(
  feedUrls: string[]
): Promise<boolean> {
  if (!getOptInDiscovery() || !feedUrls || feedUrls.length === 0) {
    return false;
  }

  // Throttle client syncs to at most once per 30 minutes
  const lastSync = Number(localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 0);
  if (Date.now() - lastSync < 30 * 60 * 1000) {
    return false;
  }

  try {
    const res = await fetch("/api/discover/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ feeds: feedUrls }),
    });

    if (res.ok) {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(Date.now()));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
