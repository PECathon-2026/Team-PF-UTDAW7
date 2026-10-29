import { ParsedArticle } from "./feedParser";

const STORAGE_KEYS = {
  SUBSCRIPTIONS: "swr_subscriptions_v1",
  ARTICLES: "swr_articles_v1",
  OPT_IN_DISCOVERY: "swr_opt_in_discovery_v1",
  LAST_SYNC: "swr_last_discovery_sync_v1",
};

export interface StoredSubscription {
  id: string;
  name: string;
  category: string;
  feedUrl: string;
  siteUrl?: string;
  unreadCount: number;
  initial: string;
  color: string;
}

export function loadStoredSubscriptions(fallback: StoredSubscription[]): StoredSubscription[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredSubscriptions(subs: StoredSubscription[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
  } catch (err) {
    console.warn("Failed to persist subscriptions to localStorage:", err);
  }
}

export function loadStoredArticles(fallback: ParsedArticle[]): ParsedArticle[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARTICLES);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function saveStoredArticles(articles: ParsedArticle[]): void {
  if (typeof window === "undefined") return;
  try {
    // Keep up to 250 most recent articles to prevent exceeding storage quotas
    const slice = articles.slice(0, 250);
    localStorage.setItem(STORAGE_KEYS.ARTICLES, JSON.stringify(slice));
  } catch (err) {
    console.warn("Failed to persist articles to localStorage:", err);
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
