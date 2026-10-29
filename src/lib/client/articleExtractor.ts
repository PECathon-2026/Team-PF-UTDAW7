import { Readability } from "@mozilla/readability";
import DOMPurify from "dompurify";

export interface ExtractedArticle {
  title: string;
  byline?: string;
  excerpt?: string;
  content: string;
  textContent: string;
  length: number;
}

/**
 * Client-Side Full-Text Article Extractor & Sanitizer.
 * Fetches original article HTML via the /api/fetch CORS proxy,
 * parses main readable content using Mozilla Readability,
 * and rigorously sanitizes HTML with DOMPurify to prevent XSS.
 */
export async function extractFullArticle(
  articleUrl: string,
  fallbackContent: string = ""
): Promise<ExtractedArticle> {
  try {
    const res = await fetch(`/api/fetch?url=${encodeURIComponent(articleUrl)}`);
    if (!res.ok) {
      throw new Error(`Proxy fetch failed with status ${res.status}`);
    }

    const htmlText = await res.text();

    // Parse HTML document in browser DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    // Remove unwanted script, style, and iframe tags before Readability
    const unwanted = doc.querySelectorAll("script, style, iframe, noscript");
    unwanted.forEach((el) => el.remove());

    const reader = new Readability(doc);
    const parsed = reader.parse();

    if (!parsed || !parsed.content) {
      throw new Error("Readability could not isolate main article body.");
    }

    // Rigorous DOMPurify Sanitization (Task C security requirement)
    const sanitizedHtml = DOMPurify.sanitize(parsed.content, {
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "a",
        "b",
        "i",
        "strong",
        "em",
        "strike",
        "code",
        "pre",
        "blockquote",
        "ul",
        "ol",
        "li",
        "figure",
        "figcaption",
        "img",
        "hr",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "sub",
        "sup",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel", "referrerpolicy", "loading"],
    });

    return {
      title: parsed.title || "",
      byline: parsed.byline || "",
      excerpt: parsed.excerpt || "",
      content: sanitizedHtml,
      textContent: parsed.textContent || "",
      length: parsed.length || 0,
    };
  } catch (err: any) {
    console.warn(`Full-text extraction failed for ${articleUrl}, falling back to summary:`, err);

    // Fallback gracefully to feed summary / raw content with DOMPurify sanitization
    const safeFallback = DOMPurify.sanitize(fallbackContent || "<p>Content unavailable.</p>");
    return {
      title: "",
      content: safeFallback,
      textContent: safeFallback.replace(/<[^>]*>/g, ""),
      length: safeFallback.length,
    };
  }
}
