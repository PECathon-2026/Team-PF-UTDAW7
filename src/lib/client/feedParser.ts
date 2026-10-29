/**
 * Client-Side RSS & Atom Feed Parser with Autodiscovery and Error Resilience.
 * PS-003: Task B: Autodiscovery, RSS/Atom support, chronological timeline, resilience.
 */

export interface ParsedArticle {
  id: string;
  blogId: string;
  blogName: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  readTime: string;
  date: string;
  publishedAt: number;
  unread: boolean;
  saved: boolean;
  image: string;
  url: string;
}

export interface ParsedFeed {
  id: string;
  name: string;
  feedUrl: string;
  siteUrl: string;
  description: string;
  category: string;
  articles: ParsedArticle[];
}

function cleanText(raw?: string | null): string {
  if (!raw) return "";
  return raw
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateReadingTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function formatRelativeTime(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) return "Recent";
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;

  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Autodiscover an RSS or Atom feed URL from any given website URL.
 */
export async function autodiscoverFeedUrl(siteUrl: string): Promise<string> {
  let cleanUrl = siteUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = "https://" + cleanUrl;
  }

  const proxyFetch = async (target: string) => {
    const res = await fetch(`/api/fetch?url=${encodeURIComponent(target)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  };

  // 1. Fetch initial target
  let initialText = "";
  try {
    initialText = await proxyFetch(cleanUrl);
  } catch (err: any) {
    throw new Error(`Could not access ${cleanUrl}: ${err.message || "Failed to fetch"}`);
  }

  // If already an XML feed (RSS or Atom)
  if (
    initialText.includes("<rss") ||
    initialText.includes("<feed") ||
    initialText.includes("<rdf:RDF")
  ) {
    return cleanUrl;
  }

  // 2. Parse HTML looking for <link rel="alternate" ...>
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(initialText, "text/html");
    const linkTags = Array.from(doc.querySelectorAll('link[rel="alternate"]'));

    for (const tag of linkTags) {
      const type = (tag.getAttribute("type") || "").toLowerCase();
      const href = tag.getAttribute("href");
      if (
        (type.includes("rss") || type.includes("atom") || type.includes("xml")) &&
        href
      ) {
        return new URL(href, cleanUrl).toString();
      }
    }
  } catch {
    // Continue to fallback paths
  }

  // 3. Fallback: probe common feed suffixes
  const commonPaths = [
    "/feed",
    "/atom.xml",
    "/rss.xml",
    "/feed.xml",
    "/index.xml",
    "/rss",
  ];

  for (const path of commonPaths) {
    const candidate = new URL(path, cleanUrl).toString();
    try {
      const text = await proxyFetch(candidate);
      if (
        text.includes("<rss") ||
        text.includes("<feed") ||
        text.includes("<rdf:RDF")
      ) {
        return candidate;
      }
    } catch {
      // ignore
    }
  }

  // If none matched, default to original URL
  return cleanUrl;
}

/**
 * Parse raw RSS 2.0 or Atom XML text into normalized feed structures.
 */
export function parseFeedXml(xmlString: string, feedUrl: string): ParsedFeed {
  let cleanXml = xmlString.trim();
  // Strip UTF-8 BOM if present
  if (cleanXml.charCodeAt(0) === 0xfeff) {
    cleanXml = cleanXml.slice(1);
  }

  const parser = new DOMParser();
  let doc = parser.parseFromString(cleanXml, "text/xml");

  if (doc.querySelector("parsererror")) {
    // Attempt fallback parsing as text/html for malformed XML
    doc = parser.parseFromString(cleanXml, "text/html");
  }

  const feedId = "feed-" + Math.abs(hashString(feedUrl));

  // Determine feed category and name
  const hostname = new URL(feedUrl).hostname.replace(/^www\./, "");
  let feedTitle = "";
  let feedDescription = "";
  let siteUrl = "";

  const articles: ParsedArticle[] = [];

  // Check if Atom Feed (<feed>)
  const isAtom = doc.querySelector("feed") !== null;

  if (isAtom) {
    const feedNode = doc.querySelector("feed")!;
    feedTitle = cleanText(feedNode.querySelector("title")?.textContent) || hostname;
    feedDescription = cleanText(feedNode.querySelector("subtitle")?.textContent);

    const siteLink = feedNode.querySelector('link[rel="alternate"]') || feedNode.querySelector("link");
    siteUrl = siteLink?.getAttribute("href") || feedUrl;

    const entries = Array.from(feedNode.querySelectorAll("entry"));
    for (const entry of entries) {
      const title = cleanText(entry.querySelector("title")?.textContent) || "Untitled Entry";
      const linkTag = entry.querySelector('link[rel="alternate"]') || entry.querySelector("link");
      const url = linkTag?.getAttribute("href") || entry.querySelector("id")?.textContent || feedUrl;

      const dateStr =
        entry.querySelector("published")?.textContent ||
        entry.querySelector("updated")?.textContent ||
        "";
      const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();

      const summaryText = entry.querySelector("summary")?.textContent || "";
      const contentText =
        entry.querySelector("content")?.textContent || summaryText;

      const excerpt = cleanText(summaryText || contentText).slice(0, 220) + "...";
      const readTime = calculateReadingTime(contentText || summaryText);

      // Extract image if available
      let image = "";
      const imgMatch = (contentText || "").match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        image = imgMatch[1];
      } else {
        image = `https://images.unsplash.com/photo-${1455390582262 + (articles.length % 5)}?auto=format&fit=crop&w=800&q=80`;
      }

      articles.push({
        id: "art-" + Math.abs(hashString(url || title)),
        blogId: feedId,
        blogName: feedTitle,
        category: "Indie Web",
        title,
        excerpt,
        content: contentText || `<p>${excerpt}</p>`,
        readTime,
        date: formatRelativeTime(timestamp),
        publishedAt: timestamp,
        unread: true,
        saved: false,
        image,
        url,
      });
    }
  } else {
    // RSS 2.0 (<rss><channel>) or RDF (<rdf:RDF>)
    const channel = doc.querySelector("channel") || doc;
    feedTitle = cleanText(channel.querySelector("title")?.textContent) || hostname;
    feedDescription = cleanText(channel.querySelector("description")?.textContent);
    siteUrl = channel.querySelector("link")?.textContent?.trim() || feedUrl;

    const items = Array.from(doc.querySelectorAll("item"));
    for (const item of items) {
      const title = cleanText(item.querySelector("title")?.textContent) || "Untitled Article";
      const url =
        item.querySelector("link")?.textContent?.trim() ||
        item.querySelector("guid")?.textContent?.trim() ||
        feedUrl;

      const dateStr =
        item.querySelector("pubDate")?.textContent ||
        item.querySelector("date")?.textContent ||
        "";
      const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();

      const encodedContent = item.getElementsByTagName("content:encoded")[0]?.textContent || "";
      const description = item.querySelector("description")?.textContent || "";
      const rawContent = encodedContent || description;

      const excerpt = cleanText(description || encodedContent).slice(0, 220) + "...";
      const readTime = calculateReadingTime(rawContent);

      let image = "";
      const enclosure = item.querySelector('enclosure[type^="image"]');
      if (enclosure?.getAttribute("url")) {
        image = enclosure.getAttribute("url")!;
      } else {
        const imgMatch = rawContent.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
          image = imgMatch[1];
        } else {
          image = `https://images.unsplash.com/photo-${1455390582262 + (articles.length % 5)}?auto=format&fit=crop&w=800&q=80`;
        }
      }

      articles.push({
        id: "art-" + Math.abs(hashString(url || title)),
        blogId: feedId,
        blogName: feedTitle,
        category: "Indie Web",
        title,
        excerpt,
        content: rawContent || `<p>${excerpt}</p>`,
        readTime,
        date: formatRelativeTime(timestamp),
        publishedAt: timestamp,
        unread: true,
        saved: false,
        image,
        url,
      });
    }
  }

  // Sort articles chronologically (newest first)
  articles.sort((a, b) => b.publishedAt - a.publishedAt);

  return {
    id: feedId,
    name: feedTitle,
    feedUrl,
    siteUrl,
    description: feedDescription,
    category: "Indie Web",
    articles,
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
