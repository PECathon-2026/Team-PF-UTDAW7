"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  Network,
  Rss,
  Check,
  Plus,
  Loader2,
  ExternalLink,
  Flame,
  HelpCircle,
  Share2,
} from "lucide-react";
import {
  getOptInDiscovery,
  setOptInDiscovery,
  syncAnonymousDiscoveryIfOptedIn,
} from "@/lib/client/storage";
import BlogCardSpotlight from "./BlogCardSpotlight";

interface Recommendation {
  feed: {
    id: string;
    normalizedUrl: string;
    originalUrl: string;
    siteUrl: string;
    title: string;
    description: string;
    category: string;
    popularity: number;
  };
  score: number;
  reason: string;
  sourceBlogTitle?: string;
  coSubCount?: number;
}

interface GraphData {
  nodes: {
    id: string;
    title: string;
    category: string;
    popularity: number;
    url: string;
    siteUrl: string;
  }[];
  edges: {
    source: string;
    target: string;
    weight: number;
  }[];
}

interface DiscoveryViewProps {
  subscribedUrls: string[];
  onSubscribe: (url: string, title?: string) => Promise<void>;
  onToast: (msg: string) => void;
}

export default function DiscoveryView({
  subscribedUrls,
  onSubscribe,
  onToast,
}: DiscoveryViewProps) {
  const [viewMode, setViewMode] = useState<"recommendations" | "graph">("recommendations");
  const [optIn, setOptIn] = useState<boolean>(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [subscribingUrl, setSubscribingUrl] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Load opt-in state and fetch recommendations on mount or when subscriptions change
  useEffect(() => {
    setOptIn(getOptInDiscovery());
    fetchRecommendations();
    fetchGraph();
  }, [subscribedUrls.join(",")]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/discover/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptions: subscribedUrls, limit: 12 }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.warn("Failed to load recommendations:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGraph = async () => {
    try {
      const res = await fetch("/api/discover/graph");
      if (res.ok) {
        const data = await res.json();
        setGraphData(data.graph || null);
      }
    } catch (err) {
      console.warn("Failed to load graph:", err);
    }
  };

  const handleToggleOptIn = async () => {
    const nextVal = !optIn;
    setOptIn(nextVal);
    setOptInDiscovery(nextVal);

    if (nextVal) {
      onToast("Anonymous Discovery sharing enabled (Salted IP hash)");
      await syncAnonymousDiscoveryIfOptedIn(subscribedUrls);
    } else {
      onToast("Anonymous Discovery sharing disabled");
    }
  };

  const handleSubscribeClick = async (url: string, title: string) => {
    setSubscribingUrl(url);
    try {
      await onSubscribe(url, title);
    } finally {
      setSubscribingUrl(null);
    }
  };

  // Normalized check for whether user is subscribed
  const isSubscribed = (url: string) => {
    return subscribedUrls.some(
      (s) =>
        s.toLowerCase().replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "") ===
        url.toLowerCase().replace(/https?:\/\/(www\.)?/, "").replace(/\/$/, "")
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#e8dfd1] pb-5 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#f3ecdf] text-[#92400e] text-[11px] font-mono font-medium mb-2">
            <Sparkles className="w-3 h-3 text-[#b45309]" />
            <span>Anonymous Co-Subscription Intelligence</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1f1c19]">
            Discover the Small Web
          </h2>
          <p className="font-serif text-xs sm:text-sm text-[#786b59] mt-1.5 max-w-2xl">
            Recommendations calculated purely from reader subscription overlap. No tracking cookies, no engagement algorithms, and zero persistent user identifiers.
          </p>
        </div>

        {/* View Switcher Pill */}
        <div className="flex items-center gap-1 p-1 bg-[#f4ece1] rounded-xl border border-[#e2d6c3] self-start sm:self-auto">
          <button
            onClick={() => setViewMode("recommendations")}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition-all ${
              viewMode === "recommendations"
                ? "bg-[#fdfaf5] text-[#b45309] shadow-xs font-bold"
                : "text-[#786b59] hover:text-[#1f1c19]"
            }`}
          >
            Curated Shelf
          </button>
          <button
            onClick={() => setViewMode("graph")}
            className={`px-3 py-1.5 rounded-lg text-xs font-serif font-medium transition-all flex items-center gap-1.5 ${
              viewMode === "graph"
                ? "bg-[#fdfaf5] text-[#b45309] shadow-xs font-bold"
                : "text-[#786b59] hover:text-[#1f1c19]"
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Visual Graph</span>
          </button>
        </div>
      </div>

      {/* 2. Privacy & Opt-in Boundary Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#fffdfa] border border-[#e8dfd1] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <BlogCardSpotlight isDark={false} size={110} />
        <div className="flex items-start gap-3 relative z-10">
          <div className="p-2 rounded-xl bg-[#f2e9db] text-[#b45309] mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-sm text-[#1f1c19] flex items-center gap-2">
              <span>Anonymous Contribution Protocol</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                Task D Rubric
              </span>
            </h4>
            <p className="font-serif text-xs text-[#786b59] leading-relaxed max-w-xl">
              When enabled, your client submits subscribed feed URLs as a single anonymous batch to help calculate co-reading weights. No reading history, time spent, or clickstreams are ever shared. Protected by short-lived salted SHA-256 IP rate-limiting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-center relative z-10">
          <span className="text-xs font-mono font-medium text-[#574e44]">
            {optIn ? "Opted In" : "Disabled (Private)"}
          </span>
          <button
            onClick={handleToggleOptIn}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${
              optIn ? "bg-[#b45309]" : "bg-[#d6caba]"
            }`}
            title="Toggle anonymous discovery contribution"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                optIn ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* 3. Main Discovery Content */}
      {viewMode === "recommendations" ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-[#1f1c19] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b45309]" />
              <span>Recommended Independent Blogs</span>
            </h3>
            <span className="text-xs font-mono text-[#8c7e6c]">
              {recommendations.length} recommendations
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#b45309]" />
              <p className="font-serif text-xs text-[#786b59]">
                Calculating co-subscription overlap matrix...
              </p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-16 text-center space-y-2 border border-dashed border-[#e2d6c3] rounded-2xl bg-[#fdfaf5]">
              <p className="font-serif text-sm text-[#574e44]">No new recommendations available.</p>
              <p className="font-serif text-xs text-[#8c7e6c]">
                You are already subscribed to our top discovery picks!
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {recommendations.map((rec) => {
                const subscribed = isSubscribed(rec.feed.normalizedUrl);
                const isSubmitting = subscribingUrl === rec.feed.normalizedUrl;

                return (
                  <div
                    key={rec.feed.id}
                    className="p-5 rounded-2xl border border-[#e8dfd1] bg-[#fdfaf5] hover:border-[#b45309]/40 hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <BlogCardSpotlight isDark={false} />
                    <div className="space-y-2.5 relative z-10">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f4ece1] text-[#78350f] font-bold">
                          {rec.feed.category}
                        </span>
                        <a
                          href={rec.feed.siteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#8c7e6c] hover:text-[#b45309] transition-colors"
                          title="Visit blog"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <h4 className="font-serif font-bold text-lg text-[#1f1c19] leading-snug">
                        {rec.feed.title}
                      </h4>

                      <p className="font-serif text-xs text-[#6b5f50] leading-relaxed line-clamp-2">
                        {rec.feed.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#f0e6d6] flex items-center justify-between gap-2 relative z-10">
                      {/* Transparent Reason Tag (Task D / Bonus Quest) */}
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#92400e] bg-[#fef3c7] px-2.5 py-1 rounded-lg border border-[#fde68a] truncate">
                        <Sparkles className="w-3 h-3 text-[#b45309] flex-shrink-0" />
                        <span className="truncate">{rec.reason}</span>
                      </div>

                      {/* Subscribe Action Button */}
                      <button
                        onClick={() =>
                          handleSubscribeClick(rec.feed.normalizedUrl, rec.feed.title)
                        }
                        disabled={subscribed || isSubmitting}
                        className={`px-3 py-1.5 rounded-xl text-xs font-serif font-medium transition-all flex items-center gap-1.5 flex-shrink-0 shadow-xs ${
                          subscribed
                            ? "bg-[#e8dfd1] text-[#786b59] cursor-default"
                            : "bg-[#b45309] hover:bg-[#92400e] text-white"
                        }`}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : subscribed ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#15803d]" />
                            <span>Subscribed</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Subscribe</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 4. Interactive Co-Subscription Visual Graph (Bonus Quest) */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-base text-[#1f1c19] flex items-center gap-2">
                <Network className="w-4 h-4 text-[#b45309]" />
                <span>"Blogs Like This" Co-Subscription Network</span>
              </h3>
              <p className="font-serif text-xs text-[#786b59]">
                Interactive map of independent blogs connected by reader co-subscription overlap.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 rounded-2xl border border-[#e8dfd1] bg-[#fffdfa] shadow-sm relative overflow-hidden">
            <BlogCardSpotlight isDark={false} size={120} />
            {graphData ? (
              <svg
                viewBox="0 0 800 480"
                className="w-full h-auto max-h-[500px] select-none"
              >
                <defs>
                  <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#b45309" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Co-subscription Edges */}
                <g className="edges opacity-40">
                  {graphData.edges.map((edge, idx) => {
                    const sourceNodeIdx = graphData.nodes.findIndex((n) => n.id === edge.source);
                    const targetNodeIdx = graphData.nodes.findIndex((n) => n.id === edge.target);
                    if (sourceNodeIdx === -1 || targetNodeIdx === -1) return null;

                    // Compute node coordinates around circular orbits
                    const nTotal = graphData.nodes.length;
                    const angleA = (sourceNodeIdx / nTotal) * 2 * Math.PI;
                    const angleB = (targetNodeIdx / nTotal) * 2 * Math.PI;

                    const radius = 170;
                    const x1 = 400 + Math.cos(angleA) * radius;
                    const y1 = 240 + Math.sin(angleA) * (radius * 0.75);
                    const x2 = 400 + Math.cos(angleB) * radius;
                    const y2 = 240 + Math.sin(angleB) * (radius * 0.75);

                    const isHighlighted =
                      selectedNode === edge.source || selectedNode === edge.target;

                    return (
                      <line
                        key={idx}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isHighlighted ? "#b45309" : "#c4b5a0"}
                        strokeWidth={isHighlighted ? 2.5 : Math.min(Math.max(edge.weight / 25, 1), 3)}
                        strokeOpacity={isHighlighted ? 0.9 : 0.4}
                      />
                    );
                  })}
                </g>

                {/* Nodes */}
                <g className="nodes">
                  {graphData.nodes.map((node, idx) => {
                    const nTotal = graphData.nodes.length;
                    const angle = (idx / nTotal) * 2 * Math.PI;
                    const radius = 170;
                    const cx = 400 + Math.cos(angle) * radius;
                    const cy = 240 + Math.sin(angle) * (radius * 0.75);

                    const isSelected = selectedNode === node.id;
                    const subscribed = isSubscribed(node.url);

                    return (
                      <g
                        key={node.id}
                        onClick={() => setSelectedNode(isSelected ? null : node.id)}
                        className="cursor-pointer group"
                      >
                        {isSelected && (
                          <circle cx={cx} cy={cy} r={28} fill="url(#nodeGlow)" />
                        )}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 16 : 12}
                          fill={subscribed ? "#b45309" : "#fdfaf5"}
                          stroke={subscribed ? "#78350f" : "#8c7e6c"}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-all duration-300 group-hover:scale-125"
                        />
                        <text
                          x={cx}
                          y={cy + 22}
                          textAnchor="middle"
                          className={`text-[10px] font-serif font-bold transition-colors ${
                            isSelected
                              ? "fill-[#b45309] font-bold"
                              : "fill-[#4a4237] group-hover:fill-[#1f1c19]"
                          }`}
                        >
                          {node.title.split(" ")[0]}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            ) : (
              <div className="py-20 text-center text-xs font-serif text-[#8c7e6c]">
                Loading graph structure...
              </div>
            )}

            {/* Selected Node Card Overlay */}
            {selectedNode && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 p-4 rounded-xl bg-[#fdfaf5] border border-[#b45309]/50 shadow-xl space-y-2 animate-in fade-in slide-in-from-bottom-2">
                {(() => {
                  const node = graphData?.nodes.find((n) => n.id === selectedNode);
                  if (!node) return null;
                  const subscribed = isSubscribed(node.url);

                  return (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4ece1] text-[#92400e]">
                          {node.category}
                        </span>
                        <button
                          onClick={() => setSelectedNode(null)}
                          className="text-xs font-mono text-[#8c7e6c] hover:text-[#1f1c19]"
                        >
                          ✕
                        </button>
                      </div>
                      <h4 className="font-serif font-bold text-base text-[#1f1c19]">
                        {node.title}
                      </h4>
                      <p className="text-xs font-serif text-[#6b5f50]">
                        Independent blog in the Small Web discovery index.
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <a
                          href={node.siteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-[#b45309] flex items-center gap-1 hover:underline"
                        >
                          <span>Visit site</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          onClick={() => handleSubscribeClick(node.url, node.title)}
                          disabled={subscribed}
                          className={`px-3 py-1 rounded-lg text-xs font-serif font-medium ${
                            subscribed
                              ? "bg-[#e8dfd1] text-[#786b59]"
                              : "bg-[#b45309] hover:bg-[#92400e] text-white"
                          }`}
                        >
                          {subscribed ? "Subscribed ✓" : "+ Subscribe"}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
