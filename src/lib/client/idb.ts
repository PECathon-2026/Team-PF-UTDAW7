/**
 * Native IndexedDB Vault for Small Web Reader (PECathon PS-003).
 * Provides robust offline-first persistence for:
 * 1. Subscriptions (user-added feeds & seeds)
 * 2. Cached Articles (with full extracted HTML & metadata)
 * 3. Reading States (persistent read/unread & saved flags)
 * 4. User Preferences (font, view mode, opt-in status)
 */

import { ParsedArticle } from "./feedParser";

const DB_NAME = "SmallWebReaderDB";
const DB_VERSION = 1;

export interface StoredSubscription {
  id: string;
  name: string;
  category: string;
  feedUrl: string;
  siteUrl?: string;
  unreadCount: number;
  initial: string;
  color: string;
  addedAt?: number;
}

export interface ReadingState {
  articleId: string;
  unread: boolean;
  saved: boolean;
  updatedAt: number;
}

let dbInstance: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported in this environment"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Subscriptions Store
      if (!db.objectStoreNames.contains("subscriptions")) {
        const subStore = db.createObjectStore("subscriptions", { keyPath: "id" });
        subStore.createIndex("by_feedUrl", "feedUrl", { unique: false });
      }

      // 2. Articles Store
      if (!db.objectStoreNames.contains("articles")) {
        const artStore = db.createObjectStore("articles", { keyPath: "id" });
        artStore.createIndex("by_blogId", "blogId", { unique: false });
        artStore.createIndex("by_publishedAt", "publishedAt", { unique: false });
        artStore.createIndex("by_url", "url", { unique: false });
      }

      // 3. Reading States Store (Per-article read/unread/saved persistence)
      if (!db.objectStoreNames.contains("reading_states")) {
        db.createObjectStore("reading_states", { keyPath: "articleId" });
      }

      // 4. Preferences Store
      if (!db.objectStoreNames.contains("preferences")) {
        db.createObjectStore("preferences", { keyPath: "key" });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// ==============================================================================
// Subscriptions Operations
// ==============================================================================

export async function idbGetSubscriptions(): Promise<StoredSubscription[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("subscriptions", "readonly");
      const store = tx.objectStore("subscriptions");
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("idbGetSubscriptions fallback:", err);
    return [];
  }
}

export async function idbSaveSubscription(sub: StoredSubscription): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("subscriptions", "readwrite");
      const store = tx.objectStore("subscriptions");
      const req = store.put(sub);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("idbSaveSubscription error:", err);
  }
}

export async function idbSaveSubscriptions(subs: StoredSubscription[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("subscriptions", "readwrite");
      const store = tx.objectStore("subscriptions");
      for (const s of subs) {
        store.put(s);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("idbSaveSubscriptions error:", err);
  }
}

export async function idbDeleteSubscription(id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["subscriptions", "articles"], "readwrite");
      const subStore = tx.objectStore("subscriptions");
      const artStore = tx.objectStore("articles");

      // Delete subscription record
      subStore.delete(id);

      // Also clean up articles associated with this subscription
      const blogIdx = artStore.index("by_blogId");
      const req = blogIdx.getAllKeys(id);
      req.onsuccess = () => {
        const keys = req.result;
        for (const k of keys) {
          artStore.delete(k);
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("idbDeleteSubscription error:", err);
  }
}

// ==============================================================================
// Articles Operations
// ==============================================================================

export async function idbGetArticles(): Promise<ParsedArticle[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["articles", "reading_states"], "readonly");
      const artStore = tx.objectStore("articles");
      const stateStore = tx.objectStore("reading_states");

      const artReq = artStore.getAll();
      const stateReq = stateStore.getAll();

      tx.oncomplete = () => {
        const articles: ParsedArticle[] = artReq.result || [];
        const states: ReadingState[] = stateReq.result || [];
        const stateMap = new Map<string, ReadingState>();
        for (const s of states) {
          stateMap.set(s.articleId, s);
        }

        // Apply persistent reading states
        const merged = articles.map((a) => {
          const st = stateMap.get(a.id) || stateMap.get(a.url);
          if (st) {
            return {
              ...a,
              unread: st.unread,
              saved: st.saved,
            };
          }
          return a;
        });

        // Chronological sort: newest first
        merged.sort((x, y) => (y.publishedAt || 0) - (x.publishedAt || 0));
        resolve(merged);
      };

      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("idbGetArticles fallback:", err);
    return [];
  }
}

export async function idbSaveArticles(articles: ParsedArticle[]): Promise<void> {
  if (!articles || articles.length === 0) return;
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["articles", "reading_states"], "readwrite");
      const artStore = tx.objectStore("articles");
      const stateStore = tx.objectStore("reading_states");

      for (const a of articles) {
        artStore.put(a);
        // Persist reading state as well
        stateStore.put({
          articleId: a.id,
          unread: a.unread,
          saved: a.saved,
          updatedAt: Date.now(),
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("idbSaveArticles error:", err);
  }
}

export async function idbUpdateArticle(
  id: string,
  updates: Partial<ParsedArticle>
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["articles", "reading_states"], "readwrite");
      const artStore = tx.objectStore("articles");
      const stateStore = tx.objectStore("reading_states");

      const req = artStore.get(id);
      req.onsuccess = () => {
        const existing: ParsedArticle = req.result;
        if (existing) {
          const updated = { ...existing, ...updates };
          artStore.put(updated);

          // Update state table if reading state modified
          if (updates.unread !== undefined || updates.saved !== undefined) {
            stateStore.put({
              articleId: id,
              unread: updates.unread !== undefined ? updates.unread : existing.unread,
              saved: updates.saved !== undefined ? updates.saved : existing.saved,
              updatedAt: Date.now(),
            });
          }
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("idbUpdateArticle error:", err);
  }
}

export async function idbSetReadingState(
  articleId: string,
  state: { unread?: boolean; saved?: boolean }
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["articles", "reading_states"], "readwrite");
      const stateStore = tx.objectStore("reading_states");
      const artStore = tx.objectStore("articles");

      // Update state store
      const stReq = stateStore.get(articleId);
      stReq.onsuccess = () => {
        const current: ReadingState = stReq.result || {
          articleId,
          unread: true,
          saved: false,
          updatedAt: Date.now(),
        };

        const nextState: ReadingState = {
          ...current,
          ...state,
          updatedAt: Date.now(),
        };
        stateStore.put(nextState);

        // Also update article record in articles store if present
        const artReq = artStore.get(articleId);
        artReq.onsuccess = () => {
          const art = artReq.result;
          if (art) {
            artStore.put({
              ...art,
              ...state,
            });
          }
        };
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("idbSetReadingState error:", err);
  }
}

// ==============================================================================
// User Preferences
// ==============================================================================

export async function idbGetPreference<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction("preferences", "readonly");
      const store = tx.objectStore("preferences");
      const req = store.get(key);
      req.onsuccess = () => {
        if (req.result && req.result.value !== undefined) {
          resolve(req.result.value as T);
        } else {
          resolve(defaultValue);
        }
      };
      req.onerror = () => resolve(defaultValue);
    });
  } catch {
    return defaultValue;
  }
}

export async function idbSetPreference<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("preferences", "readwrite");
      const store = tx.objectStore("preferences");
      const req = store.put({ key, value, updatedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("idbSetPreference error:", err);
  }
}
