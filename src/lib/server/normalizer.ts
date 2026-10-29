/**
 * URL Normalizer for Small Web Reader co-subscription engine.
 * Ensures consistent canonical URLs to prevent duplicate entries and gaming.
 */

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "source",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
  "hash",
  "_hsenc",
  "_hsmi",
  "mkt_tok",
]);

export function normalizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("Invalid URL input");
  }

  let trimmed = rawUrl.trim();

  // Add protocol if missing
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Malformed URL: ${rawUrl}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Unsupported protocol. Only HTTP and HTTPS are permitted.");
  }

  // Canonicalize hostname
  let hostname = parsed.hostname.toLowerCase();
  if (hostname.startsWith("www.")) {
    hostname = hostname.slice(4);
  }
  parsed.hostname = hostname;

  // Remove default ports
  if (
    (parsed.protocol === "http:" && parsed.port === "80") ||
    (parsed.protocol === "https:" && parsed.port === "443")
  ) {
    parsed.port = "";
  }

  // Remove fragment/hash
  parsed.hash = "";

  // Strip tracking parameters
  const newParams = new URLSearchParams();
  parsed.searchParams.forEach((val, key) => {
    const lowerKey = key.toLowerCase();
    if (!TRACKING_PARAMS.has(lowerKey)) {
      newParams.append(key, val);
    }
  });
  newParams.sort();
  parsed.search = newParams.toString() ? `?${newParams.toString()}` : "";

  // Normalize path
  let pathname = parsed.pathname.replace(/\/+/g, "/");
  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }
  parsed.pathname = pathname;

  return parsed.toString();
}

/**
 * Extracts a clean site name from a URL for display purposes.
 */
export function extractSiteName(urlStr: string): string {
  try {
    const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return urlStr;
  }
}
