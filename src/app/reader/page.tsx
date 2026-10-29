"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Feather,
  BookOpen,
  ArrowLeft,
  Search,
  CheckCircle2,
  Clock,
  Bookmark,
  ExternalLink,
  Plus,
  Sparkles,
  ShieldCheck,
  Type,
  X,
  ChevronDown,
  Filter,
  Trash2,
  Rss,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Orbit,
  Moon,
  Headphones
} from "lucide-react";
import ConstellationGraph from "@/components/graph/ConstellationGraph";
import ListenModePlayer from "@/components/reader/ListenModePlayer";
import AiDigestCard from "@/components/reader/AiDigestCard";
import { generateOnDeviceDigest, ArticleDigest } from "@/lib/summarizer";

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
  { id: "jvns", name: "Julia Evans", category: "Systems", unreadCount: 5, initial: "J", color: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]" }
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
    saved: true,
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
    category: "Systems & Architecture",
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
    saved: true,
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
    url: "https://jvns.ca/dns-layers"
  }
];

export default function ReaderDashboard() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "saved">("all");
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");
  const [notification, setNotification] = useState<string | null>(null);

  // Mystic Mikado Constellation State
  const [viewMode, setViewMode] = useState<"timeline" | "graph">("timeline");
  const [isConstellationModalOpen, setIsConstellationModalOpen] = useState(false);

  // Listen Mode (TTS Audio Player) State
  const [isListenModeActive, setIsListenModeActive] = useState(false);
  const [activeSpeechParagraph, setActiveSpeechParagraph] = useState(0);
  const [isSpeechPlaying, setIsSpeechPlaying] = useState(false);

  // On-Device AI Digest State
  const [isAiDigestOpen, setIsAiDigestOpen] = useState(false);
  const [cachedDigest, setCachedDigest] = useState<ArticleDigest | null>(null);

  // Change 1: Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(270);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isResizingRef = useRef(false);

  // Change 3: Saved Posts Dropdown State
  const [isSavedDropdownOpen, setIsSavedDropdownOpen] = useState(false);
  const savedDropdownRef = useRef<HTMLDivElement>(null);

  // Change 5: Clean Add Feed Modal State
  const [isAddFeedModalOpen, setIsAddFeedModalOpen] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState("");

  // Change 6: Subscriptions Category Dropdown State
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);

  // Resize Sidebar Event Listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(Math.max(e.clientX, 200), 420);
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Close Saved dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (savedDropdownRef.current && !savedDropdownRef.current.contains(e.target as Node)) {
        setIsSavedDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
          triggerToast(nextState ? "Blog Saved" : "Blog Removed");
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

  const handleAddFeedSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newFeedUrl.trim()) return;

    const entered = newFeedUrl.trim();
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
    setNewFeedUrl("");
    setIsAddFeedModalOpen(false);
    triggerToast(`Feed autodiscovered & subscribed: ${cleanName}`);
  };

  const handleGraphSubscribe = (name: string, domain: string) => {
    const existing = subscriptions.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (!existing) {
      const newSub: Subscription = {
        id: "graph-" + Date.now(),
        name,
        category: "Indie Web",
        unreadCount: 1,
        initial: name.charAt(0).toUpperCase(),
        color: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]"
      };
      setSubscriptions(prev => [newSub, ...prev]);
      triggerToast(`Subscribed to ${name} via Graph Discovery`);
    } else {
      triggerToast(`Already subscribed to ${name}`);
    }
  };

  const handleGraphOpenArticle = (title: string, author: string) => {
    const existing = articles.find(
      a => a.title.toLowerCase() === title.toLowerCase() || a.blogName.toLowerCase() === author.toLowerCase()
    );
    if (existing) {
      setSelectedArticle(existing);
      markAsRead(existing.id);
    } else {
      const newArticle: Article = {
        id: "graph-art-" + Date.now(),
        blogId: author.toLowerCase().replace(/\s+/g, ""),
        blogName: author,
        category: "Graph Recommended",
        title,
        excerpt: `An insightful independent essay by ${author}, discovered through decentralized co-subscription graph clustering.`,
        content: `
          <p class="lead font-serif italic text-lg text-[#574e44] mb-6">
            Discovered via Small Web reader constellation analysis with ~80%+ peer co-subscription overlap.
          </p>
          <p class="mb-5 leading-relaxed">
            This piece was authored by <strong>${author}</strong> and indexed into the local offline library. The Small Web network highlights works that readers of similar intellectual gardens frequently bookmark together.
          </p>
          <blockquote class="border-l-2 border-[#b45309] pl-4 my-6 italic text-[#786b59] font-serif">
            "The best discoveries happen not through opaque commercial algorithms, but through serendipitous neighborhood graphs."
          </blockquote>
          <p class="mb-5 leading-relaxed">
            All assets are served with zero third-party telemetry, sanitized HTML rendering, and stored directly in your local IndexedDB client sandbox.
          </p>
        `,
        readTime: "5 min read",
        date: "Discovered today",
        unread: false,
        saved: true,
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
        url: `https://${author.toLowerCase().replace(/\s+/g, "")}.com`
      };
      setArticles(prev => [newArticle, ...prev]);
      setSelectedArticle(newArticle);
      triggerToast(`Opening: ${title}`);
    }
  };

  // Helper to extract clean paragraphs for Listen Mode (TTS)
  const getArticleParagraphs = (html: string): string[] => {
    if (!html) return [];
    return html
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "$1\n")
      .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .split("\n")
      .map(p => p.trim())
      .filter(p => p.length > 5);
  };

  const currentArticleParagraphs = selectedArticle
    ? getArticleParagraphs(selectedArticle.content)
    : [];

  const handleCloseReadingDrawer = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeechPlaying(false);
    setIsListenModeActive(false);
    setActiveSpeechParagraph(0);
    setIsAiDigestOpen(false);
    setCachedDigest(null);
    setSelectedArticle(null);
  };

  const handleToggleAiDigest = () => {
    if (!isAiDigestOpen) {
      if (!cachedDigest && selectedArticle) {
        const digest = generateOnDeviceDigest(selectedArticle.content);
        setCachedDigest(digest);
      }
      setIsAiDigestOpen(true);
    } else {
      setIsAiDigestOpen(false);
    }
  };

  // Unique categories for dropdown filter
  const categories = ["all", ...Array.from(new Set(subscriptions.map(s => s.category)))];

  // Filter Subscriptions by Category Dropdown
  const filteredSubscriptions = subscriptions.filter(sub => {
    if (categoryFilter === "all") return true;
    return sub.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  // Filter Articles
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
  const savedArticles = articles.filter(a => a.saved);
  const savedTotal = savedArticles.length;

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

      {/* TOP HEADER */}
      <header className="h-16 border-b border-[#e8dfd1] bg-[#fbf8f2]/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
        
        {/* Brand & Back Button */}
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="group flex items-center gap-2 text-xs font-mono text-[#786b59] hover:text-[#b45309] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Landing Page</span>
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

        {/* Top Right Controls (Changes 3, 4, 5) */}
        <div className="flex items-center gap-3">
          
          {/* Change 3: Saved Posts Top Right Column / Dropdown */}
          <div className="relative" ref={savedDropdownRef}>
            <button
              onClick={() => setIsSavedDropdownOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-serif transition-colors ${
                isSavedDropdownOpen || activeTab === "saved"
                  ? "bg-[#fdfaf5] border-[#b45309] text-[#b45309] shadow-xs"
                  : "bg-[#f4ece1]/80 border-[#e2d6c3] text-[#574e44] hover:bg-[#ebdcc8]"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-[#b45309]" fill={savedTotal > 0 ? "currentColor" : "none"} />
              <span className="font-medium">Saved ({savedTotal})</span>
              <ChevronDown className={`w-3 h-3 text-[#8c7e6c] transition-transform ${isSavedDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Saved Posts Dropdown Panel */}
            <AnimatePresence>
              {isSavedDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 bg-[#fdfaf5] border border-[#e8dfd1] rounded-2xl shadow-xl p-3 space-y-2 z-40"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#e8dfd1] px-1">
                    <span className="font-serif font-bold text-xs text-[#1f1c19]">Saved Garden</span>
                    <button
                      onClick={() => {
                        setActiveTab("saved");
                        setIsSavedDropdownOpen(false);
                      }}
                      className="text-[11px] font-mono text-[#b45309] hover:underline"
                    >
                      View all in timeline →
                    </button>
                  </div>

                  {savedArticles.length === 0 ? (
                    <div className="py-6 text-center text-xs font-serif text-[#8c7e6c]">
                      No saved essays yet. Click the bookmark icon on any card to save.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                      {savedArticles.map(a => (
                        <div
                          key={a.id}
                          onClick={() => {
                            setSelectedArticle(a);
                            setIsSavedDropdownOpen(false);
                          }}
                          className="p-2.5 rounded-xl hover:bg-[#f4ece1] border border-transparent hover:border-[#e2d6c3] cursor-pointer transition-colors group flex items-start justify-between gap-2"
                        >
                          <div className="flex-1 truncate">
                            <h5 className="font-serif text-xs font-bold truncate text-[#1f1c19] group-hover:text-[#b45309]">
                              {a.title}
                            </h5>
                            <p className="font-mono text-[10px] text-[#8c7e6c]">
                              {a.blogName} • {a.readTime}
                            </p>
                          </div>
                          <button
                            onClick={e => toggleSave(a.id, e)}
                            className="text-[#8c7e6c] hover:text-[#b45309] p-1"
                            title="Remove"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Change 5: Clean and Proper "Add Feed" Button */}
          <button
            onClick={() => setIsAddFeedModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-serif font-medium shadow-xs transition-colors hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Feed</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* RESIZABLE & COLLAPSIBLE LEFT SIDEBAR */}
        <aside
          style={{ width: isSidebarCollapsed ? 0 : `${sidebarWidth}px` }}
          className={`border-r border-[#e8dfd1] bg-[#f7f2e8]/60 flex flex-col justify-between hidden lg:flex relative select-none transition-all duration-300 ease-in-out ${
            isSidebarCollapsed
              ? "!w-0 !p-0 !border-r-0 overflow-hidden opacity-0 pointer-events-none"
              : "p-4 overflow-y-auto opacity-100"
          }`}
        >
          <div className="space-y-5">
            
            {/* Nav Header with Collapse Action */}
            <div className="flex items-center justify-between pb-1 px-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c7e6c] font-bold">
                Navigation
              </span>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1 rounded-md text-[#8c7e6c] hover:text-[#b45309] hover:bg-[#ebdcc8]/50 transition-colors"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Primary Nav Links */}
            <div className="space-y-1 text-xs">
              <button
                onClick={() => { setViewMode("timeline"); setActiveTab("all"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  viewMode === "timeline" && activeTab === "all" && !selectedBlogId
                    ? "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4" /> Discovery
                </span>
                <span className="text-[10px] font-mono bg-[#ebdcc8] text-[#78350f] px-2 py-0.5 rounded-full font-bold">
                  {articles.length}
                </span>
              </button>

              <button
                onClick={() => { setViewMode("timeline"); setActiveTab("unread"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  viewMode === "timeline" && activeTab === "unread"
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
                onClick={() => { setViewMode("graph"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  viewMode === "graph"
                    ? "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Orbit className={`w-4 h-4 ${viewMode === "graph" ? "text-[#b45309] animate-spin" : "text-[#b45309]"}`} style={{ animationDuration: "16s" }} />
                  <span>Constellation</span>
                </span>
                <span className="text-[10px] font-mono text-[#b45309] font-bold">
                  星座
                </span>
              </button>
            </div>

            {/* Change 6: Subscriptions Section with Sleek Dropdown */}
            <div className="space-y-2.5 pt-4 border-t border-[#e8dfd1]">
              
              {/* Header with Category Dropdown Trigger */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c7e6c] font-bold">
                  Subscriptions
                </span>
                
                {/* Category Filter Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsSubDropdownOpen(prev => !prev)}
                    className="flex items-center gap-1 text-[11px] font-mono text-[#786b59] hover:text-[#b45309] px-2 py-0.5 rounded-md hover:bg-[#ebdcc8]/50 transition-colors"
                  >
                    <Filter className="w-3 h-3 text-[#b45309]" />
                    <span className="capitalize">{categoryFilter}</span>
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>

                  <AnimatePresence>
                    {isSubDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute right-0 mt-1 w-36 bg-[#fdfaf5] border border-[#e2d6c3] rounded-xl shadow-lg p-1.5 z-30 font-mono text-xs space-y-0.5"
                      >
                        {categories.map(cat => (
                          <button
                            key={cat}
                            onClick={() => {
                              setCategoryFilter(cat);
                              setIsSubDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1 rounded-lg capitalize transition-colors flex items-center justify-between ${
                              categoryFilter === cat
                                ? "bg-[#b45309] text-white font-bold"
                                : "text-[#574e44] hover:bg-[#f4ece1]"
                            }`}
                          >
                            <span>{cat}</span>
                            {categoryFilter === cat && <CheckCircle2 className="w-3 h-3" />}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Filtered Subscriptions List */}
              <div className="space-y-1">
                {filteredSubscriptions.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedBlogId(sub.id === selectedBlogId ? null : sub.id);
                      setActiveTab("all");
                      setViewMode("timeline");
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

          {/* Philosophy Card */}
          <div className="p-3.5 rounded-2xl bg-[#f2e9db]/70 border border-[#e2d6c3] space-y-2 mt-4">
            <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#78350f]">
              <ShieldCheck className="w-4 h-4 text-[#b45309]" />
              <span>Zero Surveillance</span>
            </div>
            <p className="text-[11px] font-serif italic text-[#786b59] leading-snug">
              "No corporate tracking. Your reading sanctuary remains completely offline and private."
            </p>
          </div>

          {/* Change 1: Draggable Resize Handle */}
          <div
            onMouseDown={() => {
              isResizingRef.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-[#b45309]/30 transition-colors group z-20 flex items-center justify-center"
            title="Drag to resize sidebar"
          >
            <div className="w-0.5 h-8 bg-[#d6caba] group-hover:bg-[#b45309] rounded-full" />
          </div>
        </aside>

        {/* Floating Expand Button when Sidebar is Collapsed (Icon Only) */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="hidden lg:flex absolute left-4 top-4 z-30 p-2 rounded-xl bg-[#fdfaf5] border border-[#e2d6c3] shadow-md text-[#574e44] hover:text-[#b45309] hover:bg-[#f4ece1] transition-all items-center justify-center group"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-[#b45309] group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* 2. CENTER FEED (Chronological Timeline or Constellation Portal) */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#fbf8f2]">
          <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
            
            {/* Header Title & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-[#e8dfd1] pb-5 gap-4">
              <div>
                <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#1f1c19]">
                  {viewMode === "graph"
                    ? "Mystic Constellation."
                    : selectedBlogId
                    ? subscriptions.find(s => s.id === selectedBlogId)?.name
                    : activeTab === "unread"
                    ? "Unread Collection"
                    : activeTab === "saved"
                    ? "Saved Garden"
                    : "Personal Timeline."}
                </h2>
                <p className="font-serif text-xs sm:text-sm text-[#786b59] mt-1.5">
                  {viewMode === "graph"
                    ? "Decentralized Small Web co-subscription graph • PECFest Mystic Mikado Special Edition"
                    : "Latest writings from your curated library. Sorted purely by chronologic delivery."}
                </p>
              </div>

              {/* Feed Actions (Clean - No top menu switch) */}
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

            {/* View Mode Rendering: Portal Gate or Articles Feed */}
            {viewMode === "graph" ? (
              <div className="py-4 space-y-8 font-serif">
                {/* Warm Editorial Portal Gate Card */}
                <div className="relative overflow-hidden rounded-3xl bg-[#fdfaf5] border border-[#e2d6c3] shadow-md p-8 sm:p-12 text-[#1f1c19] space-y-6">
                  
                  {/* Subtle Japanese Watermark in Background */}
                  <div className="absolute -right-4 -bottom-6 select-none pointer-events-none text-[160px] font-serif font-black text-[#e8dfd1]/35 leading-none">
                    星座
                  </div>

                  <div className="space-y-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[#92400e] px-2.5 py-0.5 rounded-full bg-[#fef3c7] border border-[#fde68a] font-bold">
                        PECFest 2026 • Mystic Mikado
                      </span>
                      <span className="text-xs font-mono text-[#786b59]">神秘の星座探訪</span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1f1c19] tracking-tight leading-tight">
                      Constellation Discovery Graph
                    </h2>

                    <p className="text-sm text-[#574e44] leading-relaxed max-w-xl font-serif">
                      Explore independent small web writers clustered by organic reader gravity and co-subscription affinities — completely insulated from corporate surveillance algorithms.
                    </p>
                  </div>

                  {/* Feature Pillars */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 relative z-10">
                    <div className="p-4 rounded-2xl bg-[#f4ece1]/80 border border-[#e2d6c3] space-y-1.5">
                      <div className="text-xs font-mono text-[#b45309] flex items-center gap-1.5 font-bold">
                        <Orbit className="w-3.5 h-3.5" /> 探索 • Explore
                      </div>
                      <p className="text-[11px] text-[#786b59] leading-snug">
                        2D physics celestial gravity clusters of independent small web blogs.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#f4ece1]/80 border border-[#e2d6c3] space-y-1.5">
                      <div className="text-xs font-mono text-[#b45309] flex items-center gap-1.5 font-bold">
                        <Sparkles className="w-3.5 h-3.5" /> 縁 • Affinity
                      </div>
                      <p className="text-[11px] text-[#786b59] leading-snug">
                        Discover peer overlapping recommendations with verified affinity scores.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#f4ece1]/80 border border-[#e2d6c3] space-y-1.5">
                      <div className="text-xs font-mono text-[#b45309] flex items-center gap-1.5 font-bold">
                        <BookOpen className="w-3.5 h-3.5" /> 読書 • Discovery
                      </div>
                      <p className="text-[11px] text-[#786b59] leading-snug">
                        1-click follow blogs or instantly slide open latest essays in reading view.
                      </p>
                    </div>
                  </div>

                  {/* Clean Warm Amber Enter Button */}
                  <div className="pt-4 relative z-10 flex flex-wrap items-center gap-4">
                    <button
                      onClick={() => setIsConstellationModalOpen(true)}
                      className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#b45309] hover:bg-[#92400e] text-white font-serif font-medium text-sm shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Orbit className="w-4 h-4 text-white" />
                      <span>Enter Constellation Graph (Full Screen)</span>
                    </button>

                    <button
                      onClick={() => setViewMode("timeline")}
                      className="text-xs font-serif text-[#786b59] hover:text-[#b45309] transition-colors underline underline-offset-4"
                    >
                      Return to Timeline
                    </button>
                  </div>

                </div>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <BookOpen className="w-8 h-8 text-[#b45309]/40 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-[#574e44]">No essays found</h3>
                <p className="font-serif text-xs text-[#8c7e6c]">
                  {searchQuery ? "Try refining your search keyword." : "All caught up! Check back later."}
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
        </main>

        {/* 3. RIGHT SIDEBAR (Telemetry & Reading Focus) */}
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

          {/* Quote Card */}
          <div className="p-4 rounded-2xl bg-[#fdfaf5] border border-[#e8dfd1] space-y-2 shadow-xs">
            <span className="text-xs font-mono uppercase tracking-widest text-[#b45309] font-bold">Intentional Web</span>
            <p className="font-serif text-xs italic text-[#574e44] leading-relaxed">
              "When you follow blogs directly via RSS, you escape the dopamine casino. You read what you chose, when you chose."
            </p>
          </div>

        </aside>

      </div>

      {/* Change 5: SLEEK & CLEAN "ADD FEED" MODAL */}
      <AnimatePresence>
        {isAddFeedModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="w-full max-w-lg bg-[#fdfaf5] border border-[#e8dfd1] rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#b45309] text-white flex items-center justify-center text-xs">
                      <Rss className="w-4 h-4" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#1f1c19]">
                      Subscribe to an Indie Blog
                    </h3>
                  </div>
                  <p className="font-serif text-xs text-[#786b59]">
                    Paste any website, RSS URL, or Substack link. Autodiscovery will locate the feed.
                  </p>
                </div>
                <button
                  onClick={() => setIsAddFeedModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#f4ece1] hover:bg-[#ebdcc8] text-[#574e44] flex items-center justify-center text-xs font-bold transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Input */}
              <form onSubmit={handleAddFeedSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-[#574e44] font-medium">
                    Blog or Feed URL
                  </label>
                  <input
                    type="text"
                    value={newFeedUrl}
                    onChange={e => setNewFeedUrl(e.target.value)}
                    placeholder="e.g. https://overreacted.io or danluu.com"
                    autoFocus
                    className="w-full bg-[#f4ece1]/80 border border-[#e2d6c3] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1f1c19] placeholder-[#8c7e6c] focus:outline-none focus:ring-1 focus:ring-[#b45309] focus:bg-white transition-all"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-[#8c7e6c]">
                    Or pick a popular independent writer:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Overreacted", url: "https://overreacted.io" },
                      { name: "Simon Willison", url: "https://simonwillison.net" },
                      { name: "Robin Sloan", url: "https://robinsloan.com" },
                      { name: "Paul Graham", url: "http://paulgraham.com/rss.html" }
                    ].map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setNewFeedUrl(preset.url)}
                        className="px-2.5 py-1 rounded-lg bg-[#f4ece1] hover:bg-[#ebdcc8] text-[11px] font-serif text-[#574e44] border border-[#e2d6c3] transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e8dfd1]">
                  <button
                    type="button"
                    onClick={() => setIsAddFeedModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-serif font-medium text-[#786b59] hover:bg-[#f4ece1] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-serif font-medium shadow-xs transition-colors"
                  >
                    Subscribe Now
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SLIDE-OVER ARTICLE READER DRAWER */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseReadingDrawer}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50 cursor-pointer"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-[#fbf8f2] h-full shadow-2xl flex flex-col justify-between border-l border-[#e8dfd1] cursor-default"
            >
              
              {/* Drawer Top Header Controls */}
              <div className="h-16 border-b border-[#e8dfd1] px-6 flex items-center justify-between bg-[#f4ece1]/80">
                <div className="flex items-center gap-2">
                  <Feather className="w-3.5 h-3.5 text-[#b45309]" />
                  <span className="font-serif font-bold text-xs text-[#1f1c19]">Reading View</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* AI Digest Button (On-Device Private NLP) */}
                  <button
                    onClick={handleToggleAiDigest}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-serif transition-colors ${
                      isAiDigestOpen
                        ? "bg-[#b45309] text-white border-[#b45309] shadow-xs font-medium"
                        : "bg-white border-[#e2d6c3] text-[#574e44] hover:bg-[#f3ecdf]"
                    }`}
                    title="30-Second AI Executive Digest (100% On-Device NLP)"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAiDigestOpen ? "text-amber-200" : "text-[#b45309]"}`} />
                    <span>{isAiDigestOpen ? "Digest" : "AI Digest"}</span>
                  </button>

                  {/* Listen Mode Toggle Button */}
                  <button
                    onClick={() => {
                      const nextState = !isListenModeActive;
                      setIsListenModeActive(nextState);
                      if (!nextState && typeof window !== "undefined" && "speechSynthesis" in window) {
                        window.speechSynthesis.cancel();
                        setIsSpeechPlaying(false);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-serif transition-colors ${
                      isListenModeActive
                        ? "bg-[#b45309] text-white border-[#b45309] shadow-xs font-medium"
                        : "bg-white border-[#e2d6c3] text-[#574e44] hover:bg-[#f3ecdf]"
                    }`}
                    title="Listen to essay aloud (TTS Audio)"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{isListenModeActive ? "Listening" : "Listen"}</span>
                  </button>

                  <div className="h-4 w-px bg-[#d6caba] mx-0.5 hidden sm:block" />

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
                    onClick={handleCloseReadingDrawer}
                    className="w-8 h-8 rounded-full bg-[#ebdcc8] hover:bg-[#debfa0] text-[#78350f] flex items-center justify-center text-xs font-bold transition-colors ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable Listen Mode Audio Bar */}
              <AnimatePresence>
                {isListenModeActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ListenModePlayer
                      paragraphs={currentArticleParagraphs}
                      activeParagraphIndex={activeSpeechParagraph}
                      onParagraphChange={setActiveSpeechParagraph}
                      onPlayingChange={setIsSpeechPlaying}
                      onClose={() => {
                        setIsListenModeActive(false);
                        setIsSpeechPlaying(false);
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

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

                {/* On-Device AI Executive Digest Card */}
                <AnimatePresence>
                  {isAiDigestOpen && cachedDigest && (
                    <AiDigestCard
                      digest={cachedDigest}
                      articleTitle={selectedArticle.title}
                      onClose={() => setIsAiDigestOpen(false)}
                    />
                  )}
                </AnimatePresence>

                <hr className="border-[#e8dfd1]" />

                {/* Article Prose with Active Speech Highlighting */}
                {isListenModeActive ? (
                  <div
                    className={`leading-relaxed text-[#2b2621] space-y-4 ${
                      fontFamily === "serif" ? "font-serif" : "font-sans"
                    } ${
                      fontSize === "normal"
                        ? "text-base"
                        : fontSize === "large"
                        ? "text-lg"
                        : "text-xl leading-loose"
                    }`}
                  >
                    {currentArticleParagraphs.map((para, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => setActiveSpeechParagraph(pIdx)}
                        className={`transition-all duration-300 rounded-xl p-3.5 -mx-3.5 cursor-pointer relative ${
                          activeSpeechParagraph === pIdx
                            ? "bg-[#fef3c7] border-l-4 border-[#b45309] shadow-xs text-[#1f1c19] font-medium"
                            : "hover:bg-[#f4ece1]/60 text-[#423b33]"
                        }`}
                        title="Click to listen from this paragraph"
                      >
                        {activeSpeechParagraph === pIdx && isSpeechPlaying && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#b45309] font-bold uppercase tracking-wider mb-1 block">
                            <Headphones className="w-3 h-3 animate-pulse" /> Speaking now
                          </span>
                        )}
                        <p>{para}</p>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
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

      {/* Full-Screen Windowed Editorial Constellation Modal */}
      <AnimatePresence>
        {isConstellationModalOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 bg-[#fbf8f2] flex flex-col"
          >
            <ConstellationGraph
              isFullScreenModal={true}
              onSubscribeFeed={handleGraphSubscribe}
              onOpenArticle={(title, author) => {
                setIsConstellationModalOpen(false);
                handleGraphOpenArticle(title, author);
              }}
              onClose={() => setIsConstellationModalOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
