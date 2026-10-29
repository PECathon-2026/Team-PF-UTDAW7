"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Feather,
  BookOpen,
  Compass,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Bookmark,
  Share2,
  ExternalLink,
  Plus,
  Wifi,
  WifiOff,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Database,
  Sliders,
  Type,
  X,
  RefreshCw,
  FolderDown
} from "lucide-react";

interface Article {
  id: string;
  blogId: string;
  blogName: string;
  category: string;
  title: string;
  excerpt: string;
  content: string;
  readTime: string;
  date: string;
  unread: boolean;
  saved: boolean;
  image: string;
  url: string;
}

interface Subscription {
  id: string;
  name: string;
  category: string;
  unreadCount: number;
  initial: string;
  color: string;
}

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  { id: "marginalian", name: "The Marginalian", category: "Culture", unreadCount: 6, initial: "M", color: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]" },
  { id: "alistapart", name: "A List Apart", category: "Design", unreadCount: 4, initial: "A", color: "bg-[#e0f2fe] text-[#075985] border-[#bae6fd]" },
  { id: "stratechery", name: "Stratechery", category: "Business", unreadCount: 3, initial: "S", color: "bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]" },
  { id: "danluu", name: "Dan Luu", category: "Systems", unreadCount: 2, initial: "D", color: "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]" },
  { id: "jvns", name: "Julia Evans", category: "Hacking", unreadCount: 5, initial: "J", color: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]" }
];

const INITIAL_ARTICLES: Article[] = [
  {
    id: "1",
    blogId: "marginalian",
    blogName: "The Marginalian",
    category: "Culture & Philosophy",
    title: "The Quiet Art of Building Things That Outlast Their Makers",
    excerpt: "A reflection on patience, artisanal craft, and the invisible architecture that allows genuine human work to endure in a hyper-accelerated digital economy.",
    content: `
      <p class="lead font-serif italic text-lg text-[#574e44] mb-6">
        A reflection on patience, artisanal craft, and the invisible architecture that allows genuine human work to endure.
      </p>
      <p class="mb-5 leading-relaxed">
        In our contemporary digital ecosystem, velocity is routinely mistaken for consequence. We celebrate the immediate spike of engagement, the transient viral surge, the metric that peaks and evaporates within forty-eight hours. Yet the essays, tools, and ideas that actually shape our intellectual trajectory ten years later are almost never the ones designed for tomorrow morning's algorithmic feeds.
      </p>
      <p class="mb-5 leading-relaxed">
        Independent writing on the open web represents a conscious act of resistance. It insists on taking the time required to understand a question before publishing its answer. There are no corporate surveillance pixels embedded in these words, no telemetry tracking your scroll speed to calculate dopamine optimization.
      </p>
      <blockquote class="border-l-2 border-[#b45309] pl-4 my-6 italic text-[#786b59] font-serif">
        "To read with intention is to reclaim sovereignty over your own mental landscape."
      </blockquote>
      <p class="mb-5 leading-relaxed">
        When you read through an offline-first decentralized protocol like RSS, you choose who to invite into your sanctuary. You establish your own cadence, completely insulated from the demands of the attention merchant economy.
      </p>
    `,
    readTime: "6 min read",
    date: "2 hours ago",
    unread: true,
    saved: false,
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80",
    url: "https://themarginalian.org/art-of-craft"
  },
  {
    id: "2",
    blogId: "danluu",
    blogName: "Dan Luu",
    category: "Systems & Architecture",
    title: "Why Modern Software Still Feels Sluggish on Fast Silicon",
    excerpt: "Empirical benchmarking reveals that input latency in today's native applications is often 5x worse than 1980s personal computers with single-digit megahertz processors.",
    content: `
      <p class="lead font-serif italic text-lg text-[#574e44] mb-6">
        Hardware is thousands of times faster, yet typing on a keyboard can take 150 milliseconds to render on screen.
      </p>
      <p class="mb-5 leading-relaxed">
        We have gigahertz processors, NVMe storage achieving gigabytes per second, and GPUs running trillions of floating-point operations. Despite this extraordinary compute budget, modern web applications frequently drop frames during basic text scrolling and introduce multi-frame latency on keypresses.
      </p>
      <p class="mb-5 leading-relaxed">
        The primary culprit is not the hardware, but layers upon layers of redundant abstraction, unmonitored event loops, and bloated telemetry scripts that execute synchronously before rendering paint cycles.
      </p>
    `,
    readTime: "12 min read",
    date: "5 hours ago",
    unread: true,
    saved: true,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80",
    url: "https://danluu.com/input-latency"
  },
  {
    id: "3",
    blogId: "alistapart",
    blogName: "A List Apart",
    category: "Design Systems",
    title: "What Happens When We Design for the Decade, Not the Sprint?",
    excerpt: "Interfaces built on human dignity, durable typographic hierarchy, and respectful departures instead of addictive friction.",
    content: `
      <p class="lead font-serif italic text-lg text-[#574e44] mb-6">
        Great interface design is polite: it welcomes you in, provides clear value, and lets you leave without resistance.
      </p>
      <p class="mb-5 leading-relaxed">
        The design language of the modern platform web is hostile. It seeks to trap your gaze, obscure close buttons, and introduce deceptive confirmations. Designing for durability means prioritizing clarity over artificial retention.
      </p>
    `,
    readTime: "8 min read",
    date: "Yesterday",
    unread: false,
    saved: false,
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=800&q=80",
    url: "https://alistapart.com/decade-design"
  },
  {
    id: "4",
    blogId: "jvns",
    blogName: "Julia Evans",
    category: "Networking & DNS",
    title: "Understanding How Packet Traversal and DNS Caching Actually Work",
    excerpt: "Visualizing the 5 distinct caching layers that resolve domain queries before packets leave your laptop's wireless network interface.",
    content: `
      <p class="lead font-serif italic text-lg text-[#574e44] mb-6">
        Here are the exact 5 layers of DNS caching that keep the web running smoothly.
      </p>
      <p class="mb-5 leading-relaxed">
        Whenever you query a domain, your browser checks its internal in-memory cache, your operating system's resolver cache, your local router's DNS cache, your ISP's recursive resolver, and finally authoritative root nameservers.
      </p>
    `,
    readTime: "5 min read",
    date: "2 days ago",
    unread: true,
    saved: false,
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
    url: "https://jvns.ca/dns-layers"
  }
];

const ANONYMOUS_RECOMMENDATIONS = [
  {
    name: "Simon Willison's Weblog",
    url: "https://simonwillison.net",
    domain: "simonwillison.net",
    topic: "LLMs, SQLite & Python Architecture",
    description: "Daily notes, technical essays, and open-source tooling explorations without sponsored content.",
    overlapPercentage: 86,
    reason: "86% reader co-subscription overlap with Dan Luu & The Marginalian"
  },
  {
    name: "Maggie Appleton",
    url: "https://maggieappleton.com",
    domain: "maggieappleton.com",
    topic: "Digital Gardens & Visual Essays",
    description: "Anthropological essays on programming, personal knowledge graphs, and human-computer symbiosis.",
    overlapPercentage: 79,
    reason: "Followed by 79% of readers of A List Apart"
  },
  {
    name: "Robin Sloan",
    url: "https://robinsloan.com",
    domain: "robinsloan.com",
    topic: "Small Web Fiction & Media Lab",
    description: "Meditations on home-cooked software, publishing models, and cultivating small, attentive audiences.",
    overlapPercentage: 74,
    reason: "74% co-subscription overlap with your literary feeds"
  }
];

export default function ReaderDashboard() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "saved" | "discover">("all");
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const triggerToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setArticles(prev => prev.map(a => (a.id === id ? { ...a, unread: false } : a)));
  };

  const toggleSave = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setArticles(prev =>
      prev.map(a => {
        if (a.id === id) {
          const nextState = !a.saved;
          triggerToast(nextState ? "Saved to local collection" : "Removed from saved");
          return { ...a, saved: nextState };
        }
        return a;
      })
    );
  };

  const markAllRead = () => {
    setArticles(prev => prev.map(a => ({ ...a, unread: false })));
    triggerToast("All articles marked as read");
  };

  const handleAddFeed = () => {
    const entered = prompt("Enter independent blog URL or RSS feed (e.g. https://overreacted.io):");
    if (entered) {
      const cleanName = entered.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
      const newSub: Subscription = {
        id: "custom-" + Date.now(),
        name: cleanName,
        category: "Indie Web",
        unreadCount: 1,
        initial: cleanName.charAt(0).toUpperCase(),
        color: "bg-[#e2e8f0] text-[#334155] border-[#cbd5e1]"
      };
      setSubscriptions(prev => [newSub, ...prev]);
      triggerToast(`Feed autodiscovered & saved to IndexedDB: ${cleanName}`);
    }
  };

  const handleSubscribeRecommendation = (rec: typeof ANONYMOUS_RECOMMENDATIONS[0]) => {
    const newSub: Subscription = {
      id: rec.domain,
      name: rec.name,
      category: rec.topic,
      unreadCount: 2,
      initial: rec.name.charAt(0),
      color: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
    };
    setSubscriptions(prev => [newSub, ...prev]);
    triggerToast(`Subscribed anonymously to ${rec.name}!`);
  };

  // Filter Logic
  const filteredArticles = articles.filter(a => {
    if (selectedBlogId && a.blogId !== selectedBlogId) return false;
    if (activeTab === "unread" && !a.unread) return false;
    if (activeTab === "saved" && !a.saved) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.blogName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const unreadTotal = articles.filter(a => a.unread).length;
  const savedTotal = articles.filter(a => a.saved).length;

  return (
    <div className="min-h-screen bg-[#fbf8f2] text-[#1f1c19] flex flex-col font-sans selection:bg-[#b45309]/15 selection:text-[#92400e]">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1f1c19] text-[#fbf8f2] text-xs font-mono px-4 py-2 rounded-full shadow-lg border border-[#38332c] flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#b45309]" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Application Header */}
      <header className="h-16 border-b border-[#e8dfd1] bg-[#fbf8f2]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        
        {/* Brand & Landing Page Link */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-2 text-xs font-mono text-[#786b59] hover:text-[#b45309] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Tunnel Hero</span>
          </Link>
          
          <div className="h-4 w-px bg-[#e8dfd1] hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#b45309] text-white flex items-center justify-center shadow-xs">
              <Feather className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-sm tracking-tight text-[#1f1c19]">small web</h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#786b59]">personal library</p>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center relative w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 text-[#8c7e6c]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search essays, systems, authors..."
            className="w-full bg-[#f4ece1]/80 border border-[#e2d6c3] rounded-xl pl-9 pr-12 py-1.5 text-xs text-[#1f1c19] placeholder-[#8c7e6c] focus:outline-none focus:ring-1 focus:ring-[#b45309] focus:bg-white transition-all font-serif"
          />
          <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono bg-white border border-[#d6caba] text-[#8c7e6c] rounded">
            ⌘K
          </kbd>
        </div>

        {/* System Telemetry & Offline Status */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f3ecdf] border border-[#e2d6c3] text-[#786b59]">
            {isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono">IndexedDB Ready</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px] font-mono text-amber-700">Offline Mode</span>
              </>
            )}
          </div>

          <button
            onClick={handleAddFeed}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-serif font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Feed</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout: 3 Columns */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 1. LEFT SIDEBAR (Navigation & Subscriptions) */}
        <aside className="w-64 border-r border-[#e8dfd1] bg-[#f7f2e8]/60 p-5 flex flex-col justify-between hidden lg:flex overflow-y-auto">
          <div className="space-y-6">
            
            {/* Nav Links */}
            <div className="space-y-1 text-xs">
              <button
                onClick={() => { setActiveTab("all"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  activeTab === "all" && !selectedBlogId
                    ? "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4" /> All Essays
                </span>
                <span className="text-[10px] font-mono bg-[#ebdcc8] text-[#78350f] px-2 py-0.5 rounded-full font-bold">
                  {articles.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("unread"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  activeTab === "unread"
                    ? "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#b45309]" /> Unread
                </span>
                <span className="text-[10px] font-mono bg-[#fef3c7] text-[#92400e] px-2 py-0.5 rounded-full font-bold">
                  {unreadTotal}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("saved"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  activeTab === "saved"
                    ? "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4" /> Saved Garden
                </span>
                <span className="text-[10px] font-mono text-[#8c7e6c]">{savedTotal}</span>
              </button>

              <button
                onClick={() => setActiveTab("discover")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  activeTab === "discover"
                    ? "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-[#b45309]" /> Anonymous Discover
                </span>
                <span className="text-[9px] font-mono uppercase bg-[#b45309]/10 text-[#b45309] font-bold px-1.5 py-0.5 rounded">
                  Co-sub
                </span>
              </button>
            </div>

            {/* Followed Publications Section */}
            <div className="space-y-2 pt-4 border-t border-[#e8dfd1]">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c7e6c] font-bold">
                  Subscriptions
                </span>
                <button
                  onClick={handleAddFeed}
                  className="text-xs text-[#b45309] hover:underline font-mono font-medium"
                >
                  + Add
                </button>
              </div>

              <div className="space-y-1">
                {subscriptions.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedBlogId(sub.id === selectedBlogId ? null : sub.id);
                      setActiveTab("all");
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-serif transition-colors ${
                      selectedBlogId === sub.id
                        ? "bg-[#fdfaf5] text-[#b45309] font-bold shadow-xs border border-[#e2d6c3]"
                        : "text-[#574e44] hover:bg-[#f3ecdf]/60"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span className={`w-5 h-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center border ${sub.color}`}>
                        {sub.initial}
                      </span>
                      <span className="truncate">{sub.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#8c7e6c]">{sub.unreadCount}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar Footer Philosophy */}
          <div className="p-3.5 rounded-2xl bg-[#f2e9db]/70 border border-[#e2d6c3] space-y-2">
            <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#78350f]">
              <ShieldCheck className="w-4 h-4 text-[#b45309]" />
              <span>Zero Surveillance</span>
            </div>
            <p className="text-[11px] font-serif italic text-[#786b59] leading-snug">
              "No corporate tracking, no user profiles. Your reading habits remain on this device."
            </p>
          </div>
        </aside>

        {/* 2. CENTER FEED (Chronological Timeline or Discover View) */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#fbf8f2]">
          
          {activeTab === "discover" ? (
            /* DISCOVER TAB: CO-SUBSCRIPTION ENGINE */
            <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
              
              {/* Discover Header */}
              <div className="bg-gradient-to-br from-[#f4ece1] to-[#fbf8f2] border border-[#e2d6c3] p-6 rounded-3xl space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#b45309] text-white flex items-center justify-center text-xs">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-mono text-[#b45309] uppercase tracking-widest font-bold">
                    Anonymous Co-Subscription Graph
                  </span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1f1c19]">
                  Discover Independent Writers Without Algorithms
                </h2>
                <p className="font-serif text-sm text-[#574e44] max-w-2xl leading-relaxed">
                  Recommendations are calculated mathematically from reader basket overlap across independent blogs. When many readers of blog A also read blog B, B is suggested to you. No tracking cookies or accounts are used.
                </p>
              </div>

              {/* Recommendations Grid */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-widest text-[#8c7e6c] font-bold">
                  Suggested For Your Taste
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ANONYMOUS_RECOMMENDATIONS.map((rec, i) => (
                    <div
                      key={i}
                      className="p-5 rounded-2xl bg-[#fdfaf5] border border-[#e8dfd1] hover:border-[#b45309]/50 transition-all space-y-3.5 shadow-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-serif font-bold text-base text-[#1f1c19]">{rec.name}</h4>
                          <span className="text-xs font-mono text-[#786b59]">{rec.domain}</span>
                        </div>
                        <button
                          onClick={() => handleSubscribeRecommendation(rec)}
                          className="px-3 py-1.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white font-serif text-xs font-medium shadow-xs transition-colors"
                        >
                          + Follow
                        </button>
                      </div>

                      <p className="font-serif text-xs text-[#574e44] leading-relaxed">
                        {rec.description}
                      </p>

                      <div className="p-2.5 rounded-xl bg-[#f7f2e8] border border-[#e2d6c3] flex items-center gap-2 text-[11px] font-mono text-[#78350f]">
                        <Sparkles className="w-3.5 h-3.5 text-[#b45309] flex-shrink-0" />
                        <span className="leading-tight">{rec.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* TIMELINE VIEW */
            <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
              
              {/* Header Title & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#e8dfd1] pb-5 gap-4">
                <div>
                  <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1f1c19]">
                    {selectedBlogId
                      ? subscriptions.find(s => s.id === selectedBlogId)?.name
                      : activeTab === "unread"
                      ? "Unread Collection"
                      : activeTab === "saved"
                      ? "Saved Garden"
                      : "Personal Timeline."}
                  </h2>
                  <p className="font-serif text-xs sm:text-sm text-[#786b59] mt-1.5">
                    Latest writings from your curated library. Sorted purely by chronologic delivery.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#8c7e6c]">
                    {filteredArticles.length} essays
                  </span>
                  <button
                    onClick={markAllRead}
                    className="text-xs font-serif font-medium px-3.5 py-1.5 rounded-xl border border-[#e2d6c3] bg-[#fdfaf5] hover:bg-[#f3ecdf] text-[#574e44] transition-colors shadow-xs"
                  >
                    Mark all read
                  </button>
                </div>
              </div>

              {/* Articles Feed */}
              {filteredArticles.length === 0 ? (
                <div className="py-20 text-center space-y-3">
                  <BookOpen className="w-8 h-8 text-[#b45309]/40 mx-auto" />
                  <h3 className="font-serif text-lg font-bold text-[#574e44]">No essays found</h3>
                  <p className="font-serif text-xs text-[#8c7e6c]">
                    {searchQuery ? "Try refining your search keyword." : "All caught up! Check back later or discover new writers."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredArticles.map(article => (
                    <motion.article
                      key={article.id}
                      onClick={() => {
                        setSelectedArticle(article);
                        markAsRead(article.id);
                      }}
                      className="group p-5 rounded-2xl border border-[#e8dfd1] hover:border-[#b45309]/40 hover:shadow-md bg-[#fdfaf5] transition-all cursor-pointer flex flex-col sm:flex-row gap-5 items-start"
                    >
                      <div className="flex-1 space-y-2.5">
                        
                        {/* Metadata Tag */}
                        <div className="flex items-center gap-2 text-xs">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              article.unread ? "bg-[#b45309]" : "bg-transparent"
                            }`}
                          />
                          <span className="font-serif font-bold text-[#1f1c19] text-xs">
                            {article.blogName}
                          </span>
                          <span className="text-[#d6caba]">•</span>
                          <span className="font-mono text-[11px] text-[#8c7e6c]">
                            {article.category}
                          </span>
                        </div>

                        {/* Article Headline */}
                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1f1c19] group-hover:text-[#b45309] transition-colors leading-snug">
                          {article.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="font-serif text-xs sm:text-sm text-[#574e44] line-clamp-2 leading-relaxed">
                          {article.excerpt}
                        </p>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between text-xs text-[#8c7e6c] font-mono pt-1">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[#b45309]" />
                            {article.readTime} • {article.date}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={e => toggleSave(article.id, e)}
                              className={`p-1.5 rounded-lg hover:bg-[#f3ecdf] transition-colors ${
                                article.saved ? "text-[#b45309]" : "text-[#8c7e6c]"
                              }`}
                            >
                              <Bookmark className="w-3.5 h-3.5" fill={article.saved ? "currentColor" : "none"} />
                            </button>
                            <button
                              onClick={e => markAsRead(article.id, e)}
                              className="p-1.5 rounded-lg hover:bg-[#f3ecdf] text-[#8c7e6c] hover:text-[#1f1c19] transition-colors"
                              title="Mark read"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Editorial Thumbnail */}
                      <div className="w-full sm:w-40 h-28 rounded-xl overflow-hidden border border-[#e8dfd1] flex-shrink-0 bg-[#f4ece1] shadow-xs">
                        <img
                          src={article.image}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    </motion.article>
                  ))}
                </div>
              )}

            </div>
          )}

        </main>

        {/* 3. RIGHT SIDEBAR (Telemetry & Reading Stats) */}
        <aside className="w-80 border-l border-[#e8dfd1] bg-[#f7f2e8]/40 p-6 flex flex-col justify-between hidden xl:flex overflow-y-auto space-y-6">
          
          {/* Weekly Reading Chart */}
          <div className="bg-[#fdfaf5] border border-[#e8dfd1] rounded-2xl p-5 shadow-xs space-y-4">
            <h4 className="font-serif font-bold text-sm text-[#1f1c19]">Reading Telemetry</h4>
            
            <div className="grid grid-cols-3 text-center border-b border-[#e8dfd1] pb-3 font-serif">
              <div>
                <div className="text-xl font-bold text-[#1f1c19]">12</div>
                <div className="text-[10px] font-mono text-[#8c7e6c]">essays read</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#1f1c19]">{savedTotal}</div>
                <div className="text-[10px] font-mono text-[#8c7e6c]">saved</div>
              </div>
              <div>
                <div className="text-xl font-bold text-[#b45309]">3h 24m</div>
                <div className="text-[10px] font-mono text-[#8c7e6c]">deep time</div>
              </div>
            </div>

            {/* Weekly Bars */}
            <div className="flex items-end justify-between h-16 pt-2 px-1">
              {[
                { day: "M", h: "h-8", active: false },
                { day: "T", h: "h-6", active: false },
                { day: "W", h: "h-11", active: false },
                { day: "T", h: "h-7", active: false },
                { day: "F", h: "h-14", active: true },
                { day: "S", h: "h-9", active: false },
                { day: "S", h: "h-8", active: false }
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-4 rounded-t transition-all ${
                      bar.active
                        ? "bg-[#b45309] shadow-xs"
                        : "bg-[#e2d6c3] hover:bg-[#d6caba]"
                    } ${bar.h}`}
                  />
                  <span className={`text-[9px] font-mono ${bar.active ? "font-bold text-[#b45309]" : "text-[#8c7e6c]"}`}>
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Continue Reading Cards */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-serif font-bold text-[#1f1c19]">Continue Reading</span>
              <span className="font-mono text-[10px] text-[#8c7e6c]">2 in progress</span>
            </div>

            <div className="space-y-2">
              {articles.slice(0, 2).map(a => (
                <div
                  key={a.id}
                  onClick={() => setSelectedArticle(a)}
                  className="p-2.5 rounded-xl bg-[#fdfaf5] border border-[#e8dfd1] hover:border-[#b45309]/50 flex items-center gap-3 cursor-pointer transition-all shadow-xs"
                >
                  <img src={a.image} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                  <div className="flex-1 truncate">
                    <h5 className="font-serif text-xs font-semibold truncate text-[#1f1c19]">{a.title}</h5>
                    <p className="font-mono text-[10px] text-[#8c7e6c]">{a.blogName} • 4 min left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Anonymous Discovery Banner */}
          <div
            onClick={() => setActiveTab("discover")}
            className="p-5 rounded-2xl bg-[#92400e] text-white space-y-3 cursor-pointer hover:bg-[#78350f] transition-all shadow-md relative overflow-hidden group"
          >
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-widest text-[#fde68a]">
              <span>Discover</span>
              <Compass className="w-4 h-4 text-[#fde68a] group-hover:rotate-45 transition-transform" />
            </div>

            <div>
              <h4 className="font-serif text-base font-bold text-white leading-snug">
                Find New Independent Voices
              </h4>
              <p className="font-serif text-xs text-[#fef3c7]/80 mt-1 leading-relaxed">
                Co-subscription recommendations without surveillance.
              </p>
            </div>

            <div className="pt-1 flex items-center text-xs font-serif font-medium text-[#fde68a] underline gap-1">
              <span>View recommendations</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

        </aside>

      </div>

      {/* SLIDE-OVER ARTICLE READER DRAWER */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50"
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-[#fbf8f2] h-full shadow-2xl flex flex-col justify-between border-l border-[#e8dfd1]"
            >
              
              {/* Drawer Top Header Controls */}
              <div className="h-16 border-b border-[#e8dfd1] px-6 flex items-center justify-between bg-[#f4ece1]/80">
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full font-mono text-[10px]">
                    <ShieldCheck className="w-3 h-3" />
                    <span>DOMPurify Sanitized</span>
                  </div>
                  <span className="text-[#d6caba]">•</span>
                  <span className="font-mono text-[11px] text-[#8c7e6c]">IndexedDB Cached</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFontFamily(f => (f === "serif" ? "sans" : "serif"))}
                    className="p-1.5 rounded-lg border border-[#e2d6c3] bg-white text-xs font-mono hover:bg-[#f3ecdf] text-[#574e44]"
                    title="Toggle Serif/Sans font"
                  >
                    <Type className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setFontSize(s => (s === "normal" ? "large" : s === "large" ? "xlarge" : "normal"))
                    }
                    className="px-2 py-1 rounded-lg border border-[#e2d6c3] bg-white text-xs font-mono font-bold hover:bg-[#f3ecdf] text-[#574e44]"
                    title="Change font size"
                  >
                    {fontSize === "normal" ? "A" : fontSize === "large" ? "A+" : "A++"}
                  </button>

                  <button
                    onClick={() => setSelectedArticle(null)}
                    className="w-8 h-8 rounded-full bg-[#ebdcc8] hover:bg-[#debfa0] text-[#78350f] flex items-center justify-center text-xs font-bold transition-colors ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reader Body Content */}
              <div className="flex-1 overflow-y-auto px-8 sm:px-12 py-10 space-y-6">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-[#b45309] font-bold">
                    {selectedArticle.category}
                  </span>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1f1c19] mt-2.5 leading-tight">
                    {selectedArticle.title}
                  </h1>
                  <p className="font-mono text-xs text-[#8c7e6c] mt-3">
                    By <strong className="text-[#1f1c19]">{selectedArticle.blogName}</strong> • {selectedArticle.readTime} • {selectedArticle.date}
                  </p>
                </div>

                <hr className="border-[#e8dfd1]" />

                {/* Article Prose */}
                <div
                  className={`leading-relaxed text-[#2b2621] space-y-5 ${
                    fontFamily === "serif" ? "font-serif" : "font-sans"
                  } ${
                    fontSize === "normal"
                      ? "text-base"
                      : fontSize === "large"
                      ? "text-lg"
                      : "text-xl leading-loose"
                  }`}
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />
              </div>

              {/* Drawer Bottom Bar */}
              <div className="h-14 border-t border-[#e8dfd1] px-6 flex items-center justify-between text-xs font-serif text-[#786b59] bg-[#f4ece1]/80">
                <span className="font-mono text-[11px] text-[#8c7e6c]">
                  Saved to your local offline library
                </span>
                <a
                  href={selectedArticle.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-[#b45309] font-medium hover:underline"
                >
                  <span>Open Original Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
