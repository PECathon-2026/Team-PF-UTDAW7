import { NextRequest, NextResponse } from "next/server";
import { getRecommendations } from "@/lib/server/db";

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty if testing
    }

    const subscriptions: string[] = Array.isArray(body?.subscriptions)
      ? body.subscriptions
      : [];
    const limit = typeof body?.limit === "number" ? Math.min(body.limit, 30) : 10;

    const recommendations = await getRecommendations(subscriptions, limit);

    return NextResponse.json(
      {
        count: recommendations.length,
        recommendations,
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "RECOMMENDATION_ERROR", message: err.message || "Failed to calculate recommendations." },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("urls");
  const limitParam = request.nextUrl.searchParams.get("limit");

  const subscriptions = urlParam ? urlParam.split(",").map((s) => s.trim()) : [];
  const limit = limitParam ? parseInt(limitParam, 10) || 10 : 10;

  const recommendations = await getRecommendations(subscriptions, limit);

  return NextResponse.json(
    {
      count: recommendations.length,
      recommendations,
    },
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    }
  );
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
