import { NextRequest, NextResponse } from "next/server";
import { hashIpAddress, checkRateLimit } from "@/lib/server/rateLimit";
import { validateSSRF } from "@/lib/server/ssrf";
import { recordBatchSubscriptions } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  // 1. Abuse-Resistance: Salted SHA-256 Hash Rate Limiting
  const forwardedFor = request.headers.get("x-forwarded-for");
  const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  const ipHash = hashIpAddress(rawIp);

  const rateCheck = checkRateLimit(ipHash);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: "RATE_LIMITED",
        message: `Too many submissions. Please wait ${rateCheck.resetInSeconds} seconds before submitting again.`,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateCheck.resetInSeconds),
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  // 2. Parse & Validate Payload
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "INVALID_JSON", message: "Request body must be valid JSON." },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  const feeds = body?.feeds;
  if (!Array.isArray(feeds) || feeds.length === 0) {
    return NextResponse.json(
      { error: "INVALID_FEEDS", message: "'feeds' must be a non-empty array of URLs." },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  // Cap batch size to 50
  const cappedFeeds = feeds.slice(0, 50);

  // 3. Integrity Check: Reject private/local IP ranges on all submitted feed URLs
  const validatedUrls: string[] = [];
  for (const url of cappedFeeds) {
    if (typeof url !== "string") continue;
    const check = await validateSSRF(url);
    if (check.safe) {
      validatedUrls.push(url);
    }
  }

  if (validatedUrls.length === 0) {
    return NextResponse.json(
      {
        error: "NO_VALID_PUBLIC_FEEDS",
        message: "No valid public feed URLs were detected in the submission batch.",
      },
      { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }

  // 4. Record Co-Subscription Batch
  const result = await recordBatchSubscriptions(validatedUrls);

  return NextResponse.json(
    {
      success: true,
      feedsProcessed: result.feedsProcessed,
      pairsIncremented: result.pairsIncremented,
      remainingSubmissionsInWindow: rateCheck.remaining,
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
