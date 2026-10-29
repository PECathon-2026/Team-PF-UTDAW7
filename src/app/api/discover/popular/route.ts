import { NextRequest, NextResponse } from "next/server";
import { getAllFeeds } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) || 50 : 50;

    const feeds = await getAllFeeds();

    return NextResponse.json(
      {
        total: feeds.length,
        feeds: feeds.slice(0, limit),
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "DB_ERROR", message: err.message || "Failed to retrieve popular feeds." },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
