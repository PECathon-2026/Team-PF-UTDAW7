import { NextRequest, NextResponse } from "next/server";
import { validateSSRF } from "@/lib/server/ssrf";

// Standard browser-compatible headers for fetching RSS/Atom feeds and article HTML
const UPSTREAM_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 (compatible; SmallWebReader/1.0; +https://github.com/PECathon-2026/Team-PF-UTDAW7)";

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json(
      { error: "MISSING_URL", message: "Query parameter 'url' is required." },
      { status: 400 }
    );
  }

  // 1. Enforce strict SSRF Guard (Reject private/loopback/cloud metadata)
  const ssrfCheck = await validateSSRF(urlParam);
  if (!ssrfCheck.safe) {
    return NextResponse.json(
      {
        error: "SSRF_BLOCKED",
        message: ssrfCheck.reason || "Access to internal IP address or protocol is forbidden.",
      },
      {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 2. Prepare conditional headers for bandwidth savings (ETag & If-Modified-Since)
  const headersToSend: Record<string, string> = {
    "User-Agent": UPSTREAM_USER_AGENT,
    Accept:
      "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, application/xhtml+xml, text/plain;q=0.9, */*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch) {
    headersToSend["If-None-Match"] = ifNoneMatch;
  }

  const ifModifiedSince = request.headers.get("if-modified-since");
  if (ifModifiedSince) {
    headersToSend["If-Modified-Since"] = ifModifiedSince;
  }

  try {
    // 3. Fetch upstream target with a 12-second abort timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const upstreamResponse = await fetch(urlParam, {
      method: "GET",
      headers: headersToSend,
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    // 4. Handle 304 Not Modified
    if (upstreamResponse.status === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          "Access-Control-Allow-Origin": "*",
          ETag: upstreamResponse.headers.get("etag") || "",
          "Last-Modified": upstreamResponse.headers.get("last-modified") || "",
        },
      });
    }

    // 5. Check if upstream failed
    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: "UPSTREAM_ERROR",
          message: `Upstream returned status ${upstreamResponse.status} (${upstreamResponse.statusText})`,
          status: upstreamResponse.status,
        },
        {
          status: upstreamResponse.status >= 500 ? 502 : upstreamResponse.status,
          headers: { "Access-Control-Allow-Origin": "*" },
        }
      );
    }

    // 6. Return raw byte stream without server-side parsing or caching
    const rawData = await upstreamResponse.arrayBuffer();
    const contentType =
      upstreamResponse.headers.get("content-type") || "text/plain; charset=utf-8";
    const etag = upstreamResponse.headers.get("etag");
    const lastModified = upstreamResponse.headers.get("last-modified");

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", contentType);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set(
      "Cache-Control",
      "public, max-age=300, stale-while-revalidate=600"
    );

    if (etag) responseHeaders.set("ETag", etag);
    if (lastModified) responseHeaders.set("Last-Modified", lastModified);

    return new Response(rawData, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "TIMEOUT", message: "The feed host timed out after 12 seconds." },
        { status: 504, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    return NextResponse.json(
      {
        error: "FETCH_FAILED",
        message: err.message || "Failed to reach remote host.",
      },
      { status: 502, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, If-None-Match, If-Modified-Since",
    },
  });
}
