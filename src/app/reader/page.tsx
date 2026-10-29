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
  Loader2,
  Download,
  Upload,
  RefreshCw,
} from "lucide-react";

import {
  autodiscoverFeedUrl,
  parseFeedXml,
  ParsedArticle,
  getFallbackImage,
  cleanImageUrl,
} from "@/lib/client/feedParser";
import { extractFullArticle } from "@/lib/client/articleExtractor";
import {
  loadStoredSubscriptions,
  saveStoredSubscriptions,
  removeStoredSubscription,
  loadStoredArticles,
  saveStoredArticles,
  updateArticleState,
  StoredSubscription,
  syncAnonymousDiscoveryIfOptedIn,
} from "@/lib/client/storage";
import { idbUpdateArticle } from "@/lib/client/idb";
import { refreshAllFeeds } from "@/lib/client/feedSync";
import {
  exportToOpml,
  parseOpml,
  triggerOpmlDownload,
} from "@/lib/client/opml";
import DiscoveryView from "@/components/reader/DiscoveryView";

type Article = ParsedArticle;

interface Subscription {
  id: string;
  name: string;
  category: string;
  feedUrl?: string;
  siteUrl?: string;
  unreadCount: number;
  initial: string;
  color: string;
}

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "marginalian",
    name: "The Marginalian",
    category: "Culture",
    feedUrl: "https://themarginalian.org/feed",
    siteUrl: "https://themarginalian.org",
    unreadCount: 6,
    initial: "M",
    color: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
  },
  {
    id: "alistapart",
    name: "A List Apart",
    category: "Design",
    feedUrl: "https://alistapart.com/main/feed",
    siteUrl: "https://alistapart.com",
    unreadCount: 4,
    initial: "A",
    color: "bg-[#e0f2fe] text-[#075985] border-[#bae6fd]",
  },
  {
    id: "stratechery",
    name: "Stratechery",
    category: "Business",
    feedUrl: "https://stratechery.com/feed",
    siteUrl: "https://stratechery.com",
    unreadCount: 3,
    initial: "S",
    color: "bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]",
  },
  {
    id: "danluu",
    name: "Dan Luu",
    category: "Systems",
    feedUrl: "https://danluu.com/atom.xml",
    siteUrl: "https://danluu.com",
    unreadCount: 2,
    initial: "D",
    color: "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]",
  },
  {
    id: "jvns",
    name: "Julia Evans",
    category: "Systems",
    feedUrl: "https://jvns.ca/atom.xml",
    siteUrl: "https://jvns.ca",
    unreadCount: 5,
    initial: "J",
    color: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
  },
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
    url: "https://themarginalian.org/art-of-craft",
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
    url: "https://danluu.com/input-latency",
  },
  {
    id: "3",
    blogId: "alistapart",
    blogName: "A List Apart",
    category: "Web & Design Craft",
    title: "The Humane Interface: Designing for Sustained Attention",
    excerpt: "The modern web has traded typographic dignity for infinite scrolls. How return-oriented document design reclaims reader agency and focus.",
    content: `
      <p class="lead font-serif italic text-lg text-[#574e44] mb-6">
        The modern web has traded typographic dignity for infinite scrolls. How return-oriented document design reclaims reader agency.
      </p>
      <p class="mb-5 leading-relaxed">
        When we examine the history of book design, every physical proportion—from the golden ratio of page margins to the choice of leaded typefaces—was calibrated to minimize optical fatigue. A printed codex had a defined beginning, a tactile midpoint, and a physical terminus.
      </p>
      <p class="mb-5 leading-relaxed">
        By contrast, feed-driven interfaces are deliberately architected to eliminate endpoints. They induce a mild dissociative state where the reader searches indefinitely for closure that never arrives.
      </p>
    `,
    readTime: "8 min read",
    date: "Yesterday",
    unread: false,
    saved: true,
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    url: "https://alistapart.com/humane-interface",
  },
  {
    id: "4",
    blogId: "stratechery",
    blogName: "Stratechery",
    category: "Aggregation & Markets",
    title: "The Consolidation of Attention and the Sovereign Reader",
    excerpt: "Analyzing how centralized social platforms commoditized independent publishing, and why direct peer protocols are reclaiming audience trust.",
    content: `
      <p class="lead font-serif italic text-lg text-[#574e44] mb-6">
        Analyzing how centralized social platforms commoditized independent publishing, and why direct peer protocols are reclaiming trust.
      </p>
      <p class="mb-5 leading-relaxed">
        Aggregation Theory demonstrates that when distribution costs fall to zero, power shifts from suppliers to the aggregators who control discovery. For fifteen years, publishers surrendered their direct relationship with audiences in exchange for algorithm-mediated traffic.
      </p>
      <p class="mb-5 leading-relaxed">
        That bargain has collapsed. As platforms degrade organic reach to force paid amplification, the direct, unmediated RSS feed has re-emerged as the most resilient publishing format on the internet.
      </p>
    `,
    readTime: "15 min read",
    date: "2 days ago",
    unread: false,
    saved: false,
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    url: "https://stratechery.com/sovereign-reader",
  },
  {
    id: "5",
    blogId: "jvns",
    blogName: "Julia Evans",
    category: "Systems & Internals",
    title: "Demystifying DNS Resolution: What Actually Happens on Query",
    excerpt: "A visual deep-dive through recursive resolvers, root name servers, and caching layers that make every web request possible.",
    content: `
      <p class="lead font-serif italic text-lg text-[#574e44] mb-6">
        A visual deep-dive through recursive resolvers, root name servers, and caching layers.
      </p>
      <p class="mb-5 leading-relaxed">
        When you type a domain name into your browser, an entire cascade of distributed lookups executes in milliseconds. From checking your local OS resolver cache to querying the 13 root server clusters, understanding DNS transforms it from an intimidating black box into an elegant cooperative protocol.
      </p>
    `,
    readTime: "5 min read",
    date: "3 days ago",
    unread: true,
    saved: true,
    image: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80",
    url: "https://jvns.ca/dns-layers",
  },
];

export default function ReaderDashboard() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "saved" | "discover">("all");
  const [selectedBlogId, setSelectedBlogId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");
  const [notification, setNotification] = useState<string | null>(null);

  // Loading & Sync States
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [isExtractingArticle, setIsExtractingArticle] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(270);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isResizingRef = useRef(false);

  // Saved Posts Dropdown State
  const [isSavedDropdownOpen, setIsSavedDropdownOpen] = useState(false);
  const savedDropdownRef = useRef<HTMLDivElement>(null);

  // Add Feed Modal State
  const [isAddFeedModalOpen, setIsAddFeedModalOpen] = useState(false);
  const [newFeedUrl, setNewFeedUrl] = useState("");

  // Subscriptions Category Dropdown State
  const [isSubDropdownOpen, setIsSubDropdownOpen] = useState(false);

  // File input ref for OPML import
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial Load: Load local offline cache & route detection + background sync
  useEffect(() => {
    let isMounted = true;

    async function initStorage() {
      // Load cached data from IndexedDB immediately (Task E: instant load)
      const storedSubs = await loadStoredSubscriptions(INITIAL_SUBSCRIPTIONS as any);
      let storedArts = await loadStoredArticles(INITIAL_ARTICLES as any);

      // Clean/sanitize existing cached article images (repairs &#038; entities or broken IDs)
      storedArts = storedArts.map((a) => ({
        ...a,
        image: cleanImageUrl(a.image) || getFallbackImage(a.id),
      }));

      if (!isMounted) return;
      setSubscriptions(storedSubs as any);
      setArticles(storedArts as any);

      if (typeof window !== "undefined" && window.location.pathname.includes("/discover")) {
        setActiveTab("discover");
      }

      // Background refresh feeds if online (Task E requirement)
      if (typeof navigator !== "undefined" && navigator.onLine !== false) {
        refreshAllFeeds(storedSubs as any, storedArts as any).then((syncRes) => {
          if (!isMounted) return;
          if (syncRes.newPostsCount > 0) {
            setArticles(syncRes.updatedArticles);
            triggerToast(`${syncRes.newPostsCount} fresh essays loaded in background`);
          }
        });
      }
    }

    initStorage();

    return () => {
      isMounted = false;
    };
  }, []);

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
    setTimeout(() => setNotification(null), 3500);
  };

  // Persistent User Actions
  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setArticles(prev => prev.map(a => (a.id === id ? { ...a, unread: false } : a)));
    await updateArticleState(id, { unread: false });
  };

  const toggleSave = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    let nextState = false;
    setArticles(prev =>
      prev.map(a => {
        if (a.id === id) {
          nextState = !a.saved;
          return { ...a, saved: nextState };
        }
        return a;
      })
    );
    await updateArticleState(id, { saved: nextState });
    triggerToast(nextState ? "Essay Saved" : "Essay Removed");
  };

  const markAllRead = async () => {
    setArticles(prev => prev.map(a => ({ ...a, unread: false })));
    for (const a of articles) {
      if (a.unread) {
        await updateArticleState(a.id, { unread: false });
      }
    }
    triggerToast("All articles marked as read");
  };

  // Manual Background Refresh Trigger
  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    triggerToast("Checking feeds for new essays...");

    try {
      const syncRes = await refreshAllFeeds(subscriptions as any, articles as any);
      setArticles(syncRes.updatedArticles);
      if (syncRes.newPostsCount > 0) {
        triggerToast(`${syncRes.newPostsCount} fresh essays loaded`);
      } else {
        triggerToast("All feeds up to date");
      }
    } catch (err: any) {
      triggerToast(`Refresh error: ${err.message || "Failed"}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Real Add Feed Handler with Persistent IndexedDB Storage
  const handleAddFeedSubmit = async (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();
    const entered = (customUrl || newFeedUrl).trim();
    if (!entered || isAddingFeed) return;

    setIsAddingFeed(true);
    triggerToast("Autodiscovering RSS / Atom feed...");

    try {
      // 1. Locate feed URL (Task B)
      const feedUrl = await autodiscoverFeedUrl(entered);

      // 2. Fetch raw feed via secure proxy
      const res = await fetch(`/api/fetch?url=${encodeURIComponent(feedUrl)}`);
      if (!res.ok) {
        throw new Error(`Feed host responded with HTTP ${res.status}`);
      }
      const xmlText = await res.text();

      // 3. Parse XML client-side
      const parsedFeed = parseFeedXml(xmlText, feedUrl);

      // 4. Check if already subscribed
      const alreadySubbed = subscriptions.some(
        s =>
          (s.feedUrl && s.feedUrl.toLowerCase() === parsedFeed.feedUrl.toLowerCase()) ||
          s.name.toLowerCase() === parsedFeed.name.toLowerCase()
      );

      if (alreadySubbed) {
        triggerToast(`Already subscribed to ${parsedFeed.name}`);
        setNewFeedUrl("");
        setIsAddFeedModalOpen(false);
        setIsAddingFeed(false);
        return;
      }

      // Assign styling
      const colorPalettes = [
        "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
        "bg-[#e0f2fe] text-[#075985] border-[#bae6fd]",
        "bg-[#ffedd5] text-[#9a3412] border-[#fed7aa]",
        "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]",
        "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
      ];
      const assignedColor = colorPalettes[subscriptions.length % colorPalettes.length];

      const newSub: Subscription = {
        id: parsedFeed.id,
        name: parsedFeed.name,
        category: parsedFeed.category,
        feedUrl: parsedFeed.feedUrl,
        siteUrl: parsedFeed.siteUrl,
        unreadCount: parsedFeed.articles.length,
        initial: (parsedFeed.name.charAt(0) || "B").toUpperCase(),
        color: assignedColor,
      };

      const updatedSubs = [newSub, ...subscriptions];
      setSubscriptions(updatedSubs);
      await saveStoredSubscriptions(updatedSubs as any);

      // Merge novel articles
      const existingUrls = new Set(articles.map(a => a.url));
      const novel = parsedFeed.articles.filter(a => !existingUrls.has(a.url));
      const updatedArticles = [...novel, ...articles];
      setArticles(updatedArticles);
      await saveStoredArticles(updatedArticles);

      setNewFeedUrl("");
      setIsAddFeedModalOpen(false);
      triggerToast(`Subscribed: ${parsedFeed.name} (${parsedFeed.articles.length} essays loaded)`);

      // Trigger anonymous discovery batch submission if opted in
      const allUrls = [
        parsedFeed.feedUrl,
        ...subscriptions.map(s => s.feedUrl || "").filter(Boolean),
      ];
      syncAnonymousDiscoveryIfOptedIn(allUrls);
    } catch (err: any) {
      console.warn("Feed subscription error:", err);
      triggerToast(`Failed to add feed: ${err.message || "Invalid feed source"}`);
    } finally {
      setIsAddingFeed(false);
    }
  };

  // Persistent Subscription Removal
  const handleRemoveSubscription = async (id: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updatedSubs = subscriptions.filter(s => s.id !== id);
    setSubscriptions(updatedSubs);
    await removeStoredSubscription(id);

    // Remove articles belonging to this feed from state
    const updatedArticles = articles.filter(a => a.blogId !== id);
    setArticles(updatedArticles);

    if (selectedBlogId === id) {
      setSelectedBlogId(null);
    }

    triggerToast(`Unsubscribed from ${name}`);
  };

  // Full-Text Readability + DOMPurify with Persistent Article Content
  const handleSelectArticle = async (article: Article) => {
    setSelectedArticle(article);
    await markAsRead(article.id);

    // If article body is short or missing, extract full document
    if (article.url && (!article.content || article.content.length < 800)) {
      setIsExtractingArticle(true);
      try {
        const extracted = await extractFullArticle(article.url, article.content);
        if (extracted.content && extracted.content.length > 200) {
          const updatedContent = extracted.content;
          setSelectedArticle(prev =>
            prev && prev.id === article.id ? { ...prev, content: updatedContent } : prev
          );
          setArticles(prev =>
            prev.map(a => (a.id === article.id ? { ...a, content: updatedContent } : a))
          );
          // Persist extracted content in IndexedDB
          await idbUpdateArticle(article.id, { content: updatedContent });
        }
      } catch (err) {
        console.warn("Readability fallback:", err);
      } finally {
        setIsExtractingArticle(false);
      }
    }
  };

  // OPML Export & Import (Bonus Quest)
  const handleExportOpml = () => {
    const opmlText = exportToOpml(
      subscriptions.map(s => ({
        name: s.name,
        feedUrl: s.feedUrl || `https://${s.name.toLowerCase().replace(/\s+/g, "")}.com/feed`,
        siteUrl: s.siteUrl,
        category: s.category,
      }))
    );
    triggerOpmlDownload(opmlText, "small-web-subscriptions.opml");
    triggerToast("Exported OPML file successfully");
  };

  const handleImportOpml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const outlines = parseOpml(text);
      if (outlines.length === 0) {
        triggerToast("No valid feeds found in OPML file");
        return;
      }

      triggerToast(`Importing ${outlines.length} feeds...`);
      for (const item of outlines.slice(0, 10)) {
        await handleAddFeedSubmit(undefined, item.xmlUrl);
      }
    } catch (err: any) {
      triggerToast(`OPML import failed: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  // Metrics
  const unreadTotal = articles.filter(a => a.unread).length;
  const savedArticlesList = articles.filter(a => a.saved);
  const savedTotal = savedArticlesList.length;

  return (
    <div className="flex flex-col h-screen bg-[#fbf8f2] text-[#1f1c19] overflow-hidden select-none font-sans">
      
      {/* Hidden file input for OPML import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".opml,.xml"
        onChange={handleImportOpml}
        className="hidden"
      />

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-6 right-6 z-50 bg-[#1f1c19] text-[#fbf8f2] px-4 py-2.5 rounded-xl shadow-xl text-xs font-mono flex items-center gap-2 border border-[#443c35]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP NAVIGATION BAR */}
      <header className="h-16 border-b border-[#e8dfd1] px-4 sm:px-6 flex items-center justify-between bg-[#fbf8f2] z-30 flex-shrink-0">
        
        {/* Left: Back Link & Branding */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-serif text-[#786b59] hover:text-[#b45309] transition-colors p-1.5 rounded-lg hover:bg-[#f4ece1]"
            title="Return to Landing"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Landing</span>
          </Link>

          <div className="h-4 w-[1px] bg-[#e8dfd1] hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#b45309] text-white flex items-center justify-center shadow-xs">
              <Feather className="w-4 h-4" />
            </div>
            <span className="font-serif font-bold text-base sm:text-lg tracking-tight text-[#1f1c19]">
              The Small Web Reader
            </span>
          </div>
        </div>

        {/* Center: Search Keyword */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8c7e6c]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter essays, topics, or authors..."
              className="w-full bg-[#f4ece1]/70 border border-[#e2d6c3] rounded-xl pl-9 pr-4 py-1.5 text-xs font-serif placeholder-[#8c7e6c] focus:outline-none focus:ring-1 focus:ring-[#b45309] focus:bg-white transition-all text-[#1f1c19]"
            />
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-3">
          
          {/* Saved Posts Dropdown */}
          <div className="relative" ref={savedDropdownRef}>
            <button
              onClick={() => setIsSavedDropdownOpen(prev => !prev)}
              className={`p-2 rounded-xl border border-[#e2d6c3] text-xs font-serif transition-colors flex items-center gap-1.5 shadow-xs ${
                isSavedDropdownOpen || activeTab === "saved"
                  ? "bg-[#f4ece1] text-[#b45309]"
                  : "bg-[#fdfaf5] hover:bg-[#f4ece1] text-[#574e44]"
              }`}
              title="Saved bookmarks"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#b45309]" />
              <span className="hidden sm:inline font-medium">Saved</span>
              <span className="text-[10px] font-mono bg-[#ebdcc8] text-[#78350f] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                {savedTotal}
              </span>
              <ChevronDown className="w-3 h-3 text-[#8c7e6c]" />
            </button>

            {/* Saved Dropdown Menu */}
            <AnimatePresence>
              {isSavedDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#fdfaf5] border border-[#e2d6c3] rounded-2xl shadow-xl p-3 z-50 space-y-2"
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b border-[#e8dfd1]">
                    <span className="text-xs font-serif font-bold text-[#1f1c19]">Saved Essays</span>
                    <button
                      onClick={() => {
                        setActiveTab("saved");
                        setSelectedBlogId(null);
                        setIsSavedDropdownOpen(false);
                      }}
                      className="text-[11px] font-mono text-[#b45309] hover:underline"
                    >
                      View All in Feed →
                    </button>
                  </div>

                  {savedArticlesList.length === 0 ? (
                    <div className="py-6 text-center text-xs font-serif text-[#8c7e6c]">
                      No essays saved yet. Click bookmark icon on any card.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                      {savedArticlesList.slice(0, 5).map(savedArt => (
                        <div
                          key={savedArt.id}
                          onClick={() => {
                            handleSelectArticle(savedArt);
                            setIsSavedDropdownOpen(false);
                          }}
                          className="p-2 rounded-xl hover:bg-[#f4ece1] cursor-pointer transition-colors space-y-1"
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#8c7e6c]">
                            <span>{savedArt.blogName}</span>
                            <span>{savedArt.readTime}</span>
                          </div>
                          <h5 className="font-serif text-xs font-bold text-[#1f1c19] line-clamp-1">
                            {savedArt.title}
                          </h5>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Add Feed Trigger */}
          <button
            onClick={() => setIsAddFeedModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#b45309] hover:bg-[#92400e] text-white px-3.5 py-1.5 rounded-xl text-xs font-serif font-medium shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Feed</span>
          </button>
        </div>
      </header>

      {/* MAIN 3-PANE APPLICATION LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 1. LEFT SIDEBAR (Resizable & Collapsible) */}
        <aside
          style={{ width: isSidebarCollapsed ? 0 : `${sidebarWidth}px` }}
          className={`border-r border-[#e8dfd1] bg-[#fbf8f2] flex flex-col justify-between p-4 overflow-y-auto transition-all duration-200 relative flex-shrink-0 ${
            isSidebarCollapsed ? "p-0 border-r-0 overflow-hidden" : ""
          }`}
        >
          <div className="space-y-6">
            
            {/* Sidebar Top: Collapse Button */}
            <div className="flex items-center justify-between px-1">
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
                onClick={() => { setActiveTab("all"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  activeTab === "all" && !selectedBlogId
                    ? "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4" /> Timeline
                </span>
                <span className="text-[10px] font-mono bg-[#ebdcc8] text-[#78350f] px-2 py-0.5 rounded-full font-bold">
                  {articles.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab("discover"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  activeTab === "discover"
                    ? "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#b45309]" /> Discovery Hub
                </span>
                <span className="text-[10px] font-mono bg-[#fef3c7] text-[#92400e] px-2 py-0.5 rounded-full font-bold">
                  Explore
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
            </div>

            {/* Subscriptions Section with Category Dropdown, OPML Actions & Removal */}
            <div className="space-y-2.5 pt-4 border-t border-[#e8dfd1]">
              
              {/* Header with Category Dropdown & OPML buttons */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#8c7e6c] font-bold">
                  Subscriptions
                </span>

                <div className="flex items-center gap-1">
                  {/* OPML Export */}
                  <button
                    onClick={handleExportOpml}
                    className="p-1 rounded text-[#786b59] hover:text-[#b45309] hover:bg-[#ebdcc8]/50 transition-colors"
                    title="Export subscriptions to OPML (.xml)"
                  >
                    <Download className="w-3 h-3" />
                  </button>

                  {/* OPML Import */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 rounded text-[#786b59] hover:text-[#b45309] hover:bg-[#ebdcc8]/50 transition-colors"
                    title="Import OPML feed list"
                  >
                    <Upload className="w-3 h-3" />
                  </button>
                  
                  {/* Category Filter Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setIsSubDropdownOpen(prev => !prev)}
                      className="flex items-center gap-1 text-[11px] font-mono text-[#786b59] hover:text-[#b45309] px-1.5 py-0.5 rounded-md hover:bg-[#ebdcc8]/50 transition-colors"
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
                              className={`w-full text-left px-2.5 py-1 rounded-lg capitalize transition-colors ${
                                categoryFilter === cat
                                  ? "bg-[#b45309] text-white font-bold"
                                  : "text-[#574e44] hover:bg-[#f4ece1]"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Subscriptions List with Hover Unsubscribe Action */}
              <div className="space-y-1">
                {filteredSubscriptions.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedBlogId(sub.id);
                      setActiveTab("all");
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-serif transition-colors group cursor-pointer ${
                      selectedBlogId === sub.id
                        ? "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                        : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 mr-2">
                      <span
                        className={`w-5 h-5 rounded-md border flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 ${sub.color}`}
                      >
                        {sub.initial}
                      </span>
                      <span className="truncate">{sub.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {sub.unreadCount > 0 && (
                        <span className="text-[10px] font-mono text-[#8c7e6c]">
                          {sub.unreadCount}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleRemoveSubscription(sub.id, sub.name, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#f4ece1] text-[#8c7e6c] hover:text-[#b91c1c] transition-all"
                        title={`Unsubscribe from ${sub.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Zero Surveillance Philosophy Card */}
          <div className="p-3.5 rounded-2xl bg-[#f2e9db]/70 border border-[#e2d6c3] space-y-2 mt-4">
            <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#78350f]">
              <ShieldCheck className="w-4 h-4 text-[#b45309]" />
              <span>Zero Surveillance</span>
            </div>
            <p className="text-[11px] font-serif italic text-[#786b59] leading-snug">
              "No corporate tracking. Your reading sanctuary remains completely offline and private."
            </p>
          </div>

          {/* Draggable Resize Handle */}
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

        {/* Floating Expand Button when Sidebar is Collapsed */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="hidden lg:flex absolute left-4 top-4 z-30 p-2 rounded-xl bg-[#fdfaf5] border border-[#e2d6c3] shadow-md text-[#574e44] hover:text-[#b45309] hover:bg-[#f4ece1] transition-all items-center justify-center group"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-[#b45309] group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* 2. CENTER CONTENT (Timeline OR Anonymous Discovery View) */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-[#fbf8f2]">
          <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
            
            {activeTab === "discover" ? (
              /* ANONYMOUS DISCOVERY VIEW */
              <DiscoveryView
                subscribedUrls={subscriptions.map(s => s.feedUrl || "").filter(Boolean)}
                onSubscribe={(url, title) => handleAddFeedSubmit(undefined, url)}
                onToast={triggerToast}
              />
            ) : (
              /* CHRONOLOGICAL TIMELINE VIEW */
              <>
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

                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-xs font-mono text-[#8c7e6c]">
                      {filteredArticles.length} essays
                    </span>

                    {/* Manual Background Refresh Button */}
                    <button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className="text-xs font-serif font-medium px-3 py-1.5 rounded-xl border border-[#e2d6c3] bg-[#fdfaf5] hover:bg-[#f3ecdf] text-[#574e44] transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                      title="Sync and check feeds for fresh essays"
                    >
                      <RefreshCw className={`w-3 h-3 text-[#b45309] ${isRefreshing ? "animate-spin" : ""}`} />
                      <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
                    </button>

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
                      {searchQuery ? "Try refining your search keyword." : "All caught up! Check back later or add new feeds."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredArticles.map(article => (
                      <motion.article
                        key={article.id}
                        onClick={() => handleSelectArticle(article)}
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
                              {article.date}
                            </span>
                            <span className="text-[#d6caba]">•</span>
                            <span className="font-mono text-[11px] text-[#8c7e6c]">
                              {article.readTime}
                            </span>
                          </div>

                          {/* Title & Excerpt */}
                          <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1f1c19] group-hover:text-[#b45309] transition-colors leading-snug">
                            {article.title}
                          </h3>
                          <p className="font-serif text-xs sm:text-sm text-[#6b5f50] leading-relaxed line-clamp-2">
                            {article.excerpt}
                          </p>

                          {/* Quick Bottom Actions */}
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f4ece1] text-[#78350f]">
                              {article.category}
                            </span>

                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={e => toggleSave(article.id, e)}
                                className={`p-1.5 rounded-lg hover:bg-[#f3ecdf] transition-colors ${
                                  article.saved ? "text-[#b45309]" : "text-[#8c7e6c]"
                                }`}
                                title={article.saved ? "Remove bookmark" : "Save bookmark"}
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
                            src={article.image || getFallbackImage(article.id)}
                            alt={article.title}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              const fallback = getFallbackImage(article.id);
                              if (target.src !== fallback) {
                                target.src = fallback;
                              }
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </motion.article>
                    ))}
                  </div>
                )}
              </>
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
              <span className="font-mono text-[10px] text-[#8c7e6c]">In Progress</span>
            </div>

            <div
              onClick={() => handleSelectArticle(articles[0])}
              className="p-3.5 rounded-xl border border-[#e8dfd1] bg-[#fdfaf5] hover:bg-[#f4ece1] transition-colors cursor-pointer space-y-1.5 shadow-xs"
            >
              <div className="flex justify-between items-center text-[10px] font-mono text-[#8c7e6c]">
                <span>{articles[0]?.blogName}</span>
                <span>65% done</span>
              </div>
              <h5 className="font-serif text-xs font-bold text-[#1f1c19] line-clamp-1">
                {articles[0]?.title}
              </h5>
              <div className="w-full bg-[#ebdcc8] h-1 rounded-full overflow-hidden">
                <div className="bg-[#b45309] h-full w-[65%]" />
              </div>
            </div>
          </div>

          {/* Discover Prompt Card */}
          <div className="p-4 rounded-2xl bg-[#b45309]/10 border border-[#b45309]/20 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#b45309]" />
              <h5 className="font-serif font-bold text-xs text-[#92400e]">Anonymous Recommendations</h5>
            </div>
            <p className="font-serif text-[11px] text-[#78350f] leading-snug">
              Based on your subscriptions, our anonymous matrix has new independent essays ready for you.
            </p>
            <button
              onClick={() => setActiveTab("discover")}
              className="text-xs font-serif font-bold text-[#b45309] hover:underline flex items-center gap-1 pt-1"
            >
              <span>Explore Discovery Hub</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </aside>

      </div>

      {/* ADD FEED MODAL (Task B: Autodiscovery) */}
      <AnimatePresence>
        {isAddFeedModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAddFeedModalOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 cursor-pointer"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#fdfaf5] border border-[#e2d6c3] rounded-2xl shadow-2xl p-6 space-y-5 cursor-default"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between">
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
                    disabled={isAddingFeed}
                    className="w-full bg-[#f4ece1]/80 border border-[#e2d6c3] rounded-xl px-4 py-2.5 text-xs font-mono text-[#1f1c19] placeholder-[#8c7e6c] focus:outline-none focus:ring-1 focus:ring-[#b45309] focus:bg-white transition-all disabled:opacity-50"
                  />
                </div>

                {/* Quick Presets */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono text-[#8c7e6c]">
                    Or pick a popular independent writer:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "The Verge", url: "https://www.theverge.com" },
                      { name: "Hacker News", url: "https://news.ycombinator.com" },
                      { name: "Overreacted", url: "https://overreacted.io" },
                      { name: "Julia Evans", url: "https://jvns.ca" }
                    ].map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        disabled={isAddingFeed}
                        onClick={() => setNewFeedUrl(preset.url)}
                        className="px-2.5 py-1 rounded-lg bg-[#f4ece1] hover:bg-[#ebdcc8] text-[11px] font-serif text-[#574e44] border border-[#e2d6c3] transition-colors disabled:opacity-50"
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
                    disabled={isAddingFeed}
                    className="px-4 py-2 rounded-xl text-xs font-serif font-medium text-[#786b59] hover:bg-[#f4ece1] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAddingFeed || !newFeedUrl.trim()}
                    className="px-5 py-2 rounded-xl bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-serif font-medium shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAddingFeed ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Autodiscovering...</span>
                      </>
                    ) : (
                      "Subscribe Now"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SLIDE-OVER ARTICLE READER DRAWER (Task C: Full-Text Readability + DOMPurify) */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedArticle(null)}
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

                {/* Readability Loading Indicator */}
                {isExtractingArticle && (
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fef3c7] text-[#92400e] text-xs font-mono border border-[#fde68a]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#b45309]" />
                    <span>Extracting clean full text via Mozilla Readability & DOMPurify...</span>
                  </div>
                )}

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
