/**
 * Client-Side RSS & Atom Feed Parser with Autodiscovery and Extreme Resilience.
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
  publishedAt?: number;
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
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
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

function getTagText(parent: Element | Document, tag: string): string {
  const direct = parent.getElementsByTagName(tag)[0];
  if (direct && direct.textContent) return direct.textContent.trim();
  const query = parent.querySelector(tag);
  return query?.textContent?.trim() || "";
}

/**
 * Autodiscover an RSS or Atom feed URL from any given website URL.
 */
export async function autodiscoverFeedUrl(siteUrl: string): Promise<string> {
  let cleanUrl = siteUrl.trim();
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = "https://" + cleanUrl;
  }

  // Smart alias for Hacker News: uses the public high-availability hnrss gateway
  // because news.ycombinator.com/rss actively blocks proxy crawlers with HTTP 419
  if (
    cleanUrl.includes("news.ycombinator.com") ||
    cleanUrl.includes("ycombinator") ||
    cleanUrl.toLowerCase().includes("hackernews")
  ) {
    return "https://hnrss.org/frontpage";
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
    if (typeof window !== "undefined" && typeof DOMParser !== "undefined") {
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
    }
  } catch {
    // Continue to fallback paths
  }

  // Regex fallback for <link rel="alternate"> in case DOMParser was constrained
  const regexLink = initialText.match(/<link[^>]+rel=["']alternate["'][^>]*>/gi);
  if (regexLink) {
    for (const tag of regexLink) {
      if (/type=["'][^"']*(rss|atom|xml)[^"']*["']/i.test(tag)) {
        const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
        if (hrefMatch && hrefMatch[1]) {
          return new URL(hrefMatch[1], cleanUrl).toString();
        }
      }
    }
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
  if (cleanXml.charCodeAt(0) === 0xfeff) {
    cleanXml = cleanXml.slice(1);
  }

  const hostname = new URL(feedUrl).hostname.replace(/^www\./, "");
  const feedId = "feed-" + Math.abs(hashString(feedUrl));

  let feedTitle = "";
  let feedDescription = "";
  let siteUrl = "";
  const articles: ParsedArticle[] = [];

  // Parse using browser DOMParser if available
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    let doc = parser.parseFromString(cleanXml, "text/xml");

    if (doc.querySelector("parsererror")) {
      doc = parser.parseFromString(cleanXml, "text/html");
    }

    const isAtom = doc.querySelector("feed") !== null;

    if (isAtom) {
      const feedNode = doc.querySelector("feed")!;
      feedTitle = cleanText(getTagText(feedNode, "title")) || hostname;
      feedDescription = cleanText(getTagText(feedNode, "subtitle"));

      const siteLink = feedNode.querySelector('link[rel="alternate"]') || feedNode.querySelector("link");
      siteUrl = siteLink?.getAttribute("href") || feedUrl;

      const entries = Array.from(feedNode.querySelectorAll("entry"));
      for (const entry of entries) {
        const title = cleanText(getTagText(entry, "title")) || "Untitled Entry";
        const linkTag = entry.querySelector('link[rel="alternate"]') || entry.querySelector("link");
        const url = linkTag?.getAttribute("href") || getTagText(entry, "id") || feedUrl;

        const dateStr = getTagText(entry, "published") || getTagText(entry, "updated") || "";
        const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();

        const summaryText = getTagText(entry, "summary");
        const contentText = getTagText(entry, "content") || summaryText;

        const excerpt = cleanText(summaryText || contentText).slice(0, 220) + "...";
        const readTime = calculateReadingTime(contentText || summaryText);

        let image = "";
        const imgMatch = (contentText || summaryText).match(/<img[^>]+src=["']([^"']+)["']/i);
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
      // RSS 2.0 or RDF
      const channel = doc.querySelector("channel") || doc;
      feedTitle = cleanText(getTagText(channel, "title")) || hostname;
      feedDescription = cleanText(getTagText(channel, "description"));
      siteUrl = getTagText(channel, "link") || feedUrl;

      const items = Array.from(doc.querySelectorAll("item"));
      for (const item of items) {
        const title = cleanText(getTagText(item, "title")) || "Untitled Article";
        const url = getTagText(item, "link") || getTagText(item, "guid") || feedUrl;

        const dateStr = getTagText(item, "pubDate") || getTagText(item, "date") || "";
        const timestamp = dateStr ? new Date(dateStr).getTime() : Date.now();

        const encodedContent = item.getElementsByTagName("content:encoded")[0]?.textContent || "";
        const description = getTagText(item, "description");
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
  }

  // Regex Fallback if articles is empty (handles broken or unclosed XML tags)
  if (articles.length === 0) {
    feedTitle = feedTitle || hostname;
    const blocks =
      cleanXml.match(/<item[\s\S]*?<\/item>/gi) ||
      cleanXml.match(/<entry[\s\S]*?<\/entry>/gi) ||
      [];

    for (const block of blocks) {
      const titleMatch = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      const linkMatch =
        block.match(/<link[^>]+href=["']([^"']+)["']/i) ||
        block.match(/<link[^>]*>([\s\S]*?)<\/link>/i) ||
        block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
      const descMatch =
        block.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i) ||
        block.match(/<content[^>]*>([\s\S]*?)<\/content>/i) ||
        block.match(/<description[^>]*>([\s\S]*?)<\/description>/i) ||
        block.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);
      const dateMatch =
        block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i) ||
        block.match(/<published[^>]*>([\s\S]*?)<\/published>/i) ||
        block.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i);

      const title = cleanText(titleMatch ? titleMatch[1] : "Untitled Entry");
      const url = cleanText(linkMatch ? linkMatch[1] : feedUrl);
      const content = descMatch ? descMatch[1] : "";
      const excerpt = cleanText(content).slice(0, 220) + "...";
      const timestamp = dateMatch ? new Date(dateMatch[1]).getTime() : Date.now();

      articles.push({
        id: "art-" + Math.abs(hashString(url || title)),
        blogId: feedId,
        blogName: feedTitle,
        category: "Indie Web",
        title,
        excerpt,
        content: content || `<p>${excerpt}</p>`,
        readTime: calculateReadingTime(content),
        date: formatRelativeTime(timestamp),
        publishedAt: timestamp,
        unread: true,
        saved: false,
        image: `https://images.unsplash.com/photo-${1455390582262 + (articles.length % 5)}?auto=format&fit=crop&w=800&q=80`,
        url,
      });
    }
  }

  // Sort articles chronologically (newest first)
  articles.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

  return {
    id: feedId,
    name: feedTitle || hostname,
    feedUrl,
    siteUrl: siteUrl || feedUrl,
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
