import { NextRequest, NextResponse } from "next/server";
import { getCoSubscriptionGraph } from "@/lib/server/db";

export async function GET(request: NextRequest) {
  try {
    const graphData = await getCoSubscriptionGraph();

    return NextResponse.json(
      {
        nodesCount: graphData.nodes.length,
        edgesCount: graphData.edges.length,
        graph: graphData,
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
      { error: "GRAPH_ERROR", message: err.message || "Failed to retrieve graph data." },
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
