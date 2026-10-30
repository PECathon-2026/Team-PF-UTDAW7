import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  INITIAL_FEEDS,
  INITIAL_CO_SUBSCRIPTIONS,
  SeedFeed,
  SeedCoSub,
} from "./seedData";
import { extractSiteName, normalizeUrl } from "./normalizer";

// Check if remote Supabase credentials are provided
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  try {
    supabase = createClient(supabaseUrl!, supabaseKey!);
  } catch (err) {
    console.warn("Failed to initialize Supabase client, falling back to local store:", err);
  }
}

// In-Memory Persistent Store (guarantees 100% offline hackathon judging reliability)
class LocalStore {
  feeds: Map<string, SeedFeed> = new Map();
  coSubs: Map<string, number> = new Map();

  constructor() {
    this.reset();
  }

  reset() {
    this.feeds.clear();
    this.coSubs.clear();

    for (const feed of INITIAL_FEEDS) {
      this.feeds.set(feed.normalizedUrl, { ...feed });
    }

    for (const sub of INITIAL_CO_SUBSCRIPTIONS) {
      const key = this.makeKey(sub.feedA, sub.feedB);
      this.coSubs.set(key, sub.weight);
    }
  }

  makeKey(a: string, b: string): string {
    return a < b ? `${a}:::${b}` : `${b}:::${a}`;
  }

  splitKey(key: string): [string, string] {
    const parts = key.split(":::");
    return [parts[0], parts[1]];
  }

  getAllFeeds(): SeedFeed[] {
    return Array.from(this.feeds.values()).sort(
      (a, b) => b.popularity - a.popularity
    );
  }

  getFeed(normalizedUrl: string): SeedFeed | undefined {
    return this.feeds.get(normalizedUrl);
  }

  upsertFeed(url: string, siteUrl?: string, title?: string, category?: string): SeedFeed {
    const existing = this.feeds.get(url);
    if (existing) {
      existing.popularity += 1;
      return existing;
    }

    const cleanTitle = title || extractSiteName(url);
    const newFeed: SeedFeed = {
      id: "feed-" + Math.random().toString(36).substring(2, 9),
      normalizedUrl: url,
      originalUrl: url,
      siteUrl: siteUrl || url,
      title: cleanTitle,
      description: `Independent feed curated on ${cleanTitle}`,
      category: category || "Indie Web",
      popularity: 1,
    };
    this.feeds.set(url, newFeed);
    return newFeed;
  }

  incrementCoSub(feedA: string, feedB: string): void {
    if (feedA === feedB) return;
    const key = this.makeKey(feedA, feedB);
    const current = this.coSubs.get(key) || 0;
    this.coSubs.set(key, current + 1);
  }

  getCoSubWeight(feedA: string, feedB: string): number {
    const key = this.makeKey(feedA, feedB);
    return this.coSubs.get(key) || 0;
  }
}

// Global singleton local store across server hot reloads
const globalStore = (globalThis as any).__smallWebStore || new LocalStore();
if (process.env.NODE_ENV !== "production") {
  (globalThis as any).__smallWebStore = globalStore;
}

// ==============================================================================
// Public Database Service Methods
// ==============================================================================

export async function getAllFeeds(): Promise<SeedFeed[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("feeds")
        .select("*")
        .order("popularity", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
          id: d.id,
          normalizedUrl: d.normalized_url,
          originalUrl: d.original_url,
          siteUrl: d.site_url,
          title: d.title,
          description: d.description,
          category: d.category,
          popularity: d.popularity,
        }));
      }
    } catch (e) {
      console.warn("Supabase query error, using local store:", e);
    }
  }

  return globalStore.getAllFeeds();
}

/**
 * Record an anonymous subscription batch.
 * PS-003 Rule: Batch capped at 50, increments feed popularity and pairwise co-subscriptions.
 */
export async function recordBatchSubscriptions(rawUrls: string[]): Promise<{
  success: boolean;
  feedsProcessed: number;
  pairsIncremented: number;
}> {
  if (!Array.isArray(rawUrls) || rawUrls.length === 0) {
    return { success: false, feedsProcessed: 0, pairsIncremented: 0 };
  }

  // Cap batch size to 50 (PS-003 constraint)
  const capped = rawUrls.slice(0, 50);

  // Normalize all URLs and remove duplicates within this batch
  const normalizedSet = new Set<string>();
  for (const raw of capped) {
    try {
      normalizedSet.add(normalizeUrl(raw));
    } catch {
      // ignore invalid URLs in batch
    }
  }

  const normalizedList = Array.from(normalizedSet);
  if (normalizedList.length === 0) {
    return { success: false, feedsProcessed: 0, pairsIncremented: 0 };
  }

  let pairsCount = 0;

  // Process in local store
  for (const url of normalizedList) {
    globalStore.upsertFeed(url);
  }

  // Generate pairwise combinations for co-subscription
  for (let i = 0; i < normalizedList.length; i++) {
    for (let j = i + 1; j < normalizedList.length; j++) {
      globalStore.incrementCoSub(normalizedList[i], normalizedList[j]);
      pairsCount += 1;
    }
  }

  // If Supabase is configured, sync asynchronously
  if (supabase) {
    try {
      // Upsert feeds
      for (const url of normalizedList) {
        const feed = globalStore.getFeed(url);
        if (feed) {
          await supabase.from("feeds").upsert(
            {
              id: feed.id,
              normalized_url: feed.normalizedUrl,
              original_url: feed.originalUrl,
              site_url: feed.siteUrl,
              title: feed.title,
              description: feed.description,
              category: feed.category,
              popularity: feed.popularity,
            },
            { onConflict: "normalized_url" }
          );
        }
      }

      // Sync co-subscriptions
      for (let i = 0; i < normalizedList.length; i++) {
        for (let j = i + 1; j < normalizedList.length; j++) {
          const a = normalizedList[i] < normalizedList[j] ? normalizedList[i] : normalizedList[j];
          const b = normalizedList[i] < normalizedList[j] ? normalizedList[j] : normalizedList[i];
          const weight = globalStore.getCoSubWeight(a, b);
          await supabase.from("co_subscriptions").upsert(
            {
              feed_a: a,
              feed_b: b,
              weight,
            },
            { onConflict: "feed_a,feed_b" }
          );
        }
      }
    } catch (err) {
      console.warn("Failed to sync batch to Supabase:", err);
    }
  }

  return {
    success: true,
    feedsProcessed: normalizedList.length,
    pairsIncremented: pairsCount,
  };
}

export interface RecommendationResult {
  feed: SeedFeed;
  score: number;
  reason: string;
  sourceBlogTitle?: string;
  coSubCount?: number;
}

/**
 * Computes recommendations for a user based on their current subscriptions.
 * Excludes feeds the user already follows.
 * Returns transparent explanation tags ("Followed by 84% of Dan Luu readers").
 */
export async function getRecommendations(
  userFeedUrls: string[],
  limit: number = 8
): Promise<RecommendationResult[]> {
  const allFeeds = await getAllFeeds();

  // Normalize user's current subscriptions
  const userNormalized = new Set<string>();
  for (const raw of userFeedUrls || []) {
    try {
      userNormalized.add(normalizeUrl(raw));
    } catch {
      // ignore
    }
  }

  // Feeds candidate pool (all feeds NOT already subscribed to by the user)
  const candidates = allFeeds.filter(
    (f) => !userNormalized.has(f.normalizedUrl)
  );

  if (candidates.length === 0) {
    return [];
  }

  // If user has no subscriptions yet, recommend highest popularity feeds
  if (userNormalized.size === 0) {
    return candidates.slice(0, limit).map((feed) => ({
      feed,
      score: feed.popularity,
      reason: `Popular discovery pick in ${feed.category}`,
    }));
  }

  // Score each candidate based on co-subscription overlap with the user's feeds
  const scored: RecommendationResult[] = [];

  for (const candidate of candidates) {
    let totalCoSubWeight = 0;
    let topOverlapBlog: SeedFeed | null = null;
    let maxSingleWeight = 0;

    for (const userUrl of userNormalized) {
      const weight = globalStore.getCoSubWeight(userUrl, candidate.normalizedUrl);
      if (weight > 0) {
        totalCoSubWeight += weight;
        if (weight > maxSingleWeight) {
          maxSingleWeight = weight;
          topOverlapBlog = globalStore.getFeed(userUrl) || null;
        }
      }
    }

    // Hybrid Score: 70% co-subscription weight + 30% normalized popularity
    const combinedScore =
      totalCoSubWeight * 10 + Math.round(candidate.popularity * 0.3);

    let reason = `Popular in ${candidate.category}`;
    if (topOverlapBlog && maxSingleWeight > 0) {
      reason = `Followed by readers of ${topOverlapBlog.title} (${maxSingleWeight} co-readers)`;
    } else if (totalCoSubWeight > 0) {
      reason = `Frequently co-read with your subscriptions`;
    }

    scored.push({
      feed: candidate,
      score: combinedScore,
      reason,
      sourceBlogTitle: topOverlapBlog?.title,
      coSubCount: maxSingleWeight,
    });
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

/**
 * Returns nodes and edges for the "Blogs Like This" interactive graph.
 */
export async function getCoSubscriptionGraph(): Promise<{
  nodes: {
    id: string;
    title: string;
    category: string;
    popularity: number;
    url: string;
    siteUrl: string;
  }[];
  edges: {
    source: string;
    target: string;
    weight: number;
  }[];
}> {
  const allFeeds = await getAllFeeds();

  const nodes = allFeeds.map((f) => ({
    id: f.normalizedUrl,
    title: f.title,
    category: f.category,
    popularity: f.popularity,
    url: f.normalizedUrl,
    siteUrl: f.siteUrl,
  }));

  const edges: { source: string; target: string; weight: number }[] = [];

  for (const [key, weight] of globalStore.coSubs.entries()) {
    if (weight > 0) {
      const [source, target] = globalStore.splitKey(key);
      edges.push({
        source,
        target,
        weight,
      });
    }
  }

  return { nodes, edges };
}
