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
  PanelRightClose,
  PanelRightOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  Orbit,
  Moon,
  Headphones,
  Maximize2,
  Minimize2
} from "lucide-react";
import ConstellationGraph from "@/components/graph/ConstellationGraph";
import ListenModePlayer from "@/components/reader/ListenModePlayer";
import AiDigestCard from "@/components/reader/AiDigestCard";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTheme } from "@/context/ThemeContext";
import { generateOnDeviceDigest, ArticleDigest } from "@/lib/summarizer";

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
import {
  idbUpdateArticle,
  idbRecordReadingActivity,
  idbRemoveReadingActivity,
  idbGetReadingActivities,
  idbSeedInitialReadingActivitiesIfEmpty,
  ReadingActivityEvent,
} from "@/lib/client/idb";
import WeeklyActivityCard from "@/components/reader/WeeklyActivityCard";
import BlogCardSpotlight from "@/components/reader/BlogCardSpotlight";
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
  const { isDark } = useTheme();
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

  // Dynamic Reading Activity Tracker State
  const [readingActivities, setReadingActivities] = useState<ReadingActivityEvent[]>([]);

  // Loading & Sync States
  const [isAddingFeed, setIsAddingFeed] = useState(false);
  const [isExtractingArticle, setIsExtractingArticle] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // Reader Full Screen Toggle State
  const [isReaderFullscreen, setIsReaderFullscreen] = useState(false);

  // Resizable Left Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(270);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isResizingRef = useRef(false);

  // Right Telemetry Sidebar State
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(false);
  const isRightResizingRef = useRef(false);

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

      // Seed initial reading activities if empty and load all recorded activities
      await idbSeedInitialReadingActivitiesIfEmpty(storedArts as any);
      const loadedActivities = await idbGetReadingActivities();
      if (!isMounted) return;
      setReadingActivities(loadedActivities);

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

  // Resize Sidebars (Left & Right) Event Listeners
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRef.current) {
        if (e.clientX < 100) {
          setIsSidebarCollapsed(true);
          isResizingRef.current = false;
        } else {
          setIsSidebarCollapsed(false);
          const newWidth = Math.min(Math.max(e.clientX, 200), 420);
          setSidebarWidth(newWidth);
        }
      }
      if (isRightResizingRef.current) {
        if (window.innerWidth - e.clientX < 100) {
          setIsRightSidebarCollapsed(true);
          isRightResizingRef.current = false;
        } else {
          setIsRightSidebarCollapsed(false);
          const newWidth = Math.min(Math.max(window.innerWidth - e.clientX, 240), 480);
          setRightSidebarWidth(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current || isRightResizingRef.current) {
        isResizingRef.current = false;
        isRightResizingRef.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
      }
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

  // Persistent User Actions with Dynamic Reading Activity Tracking
  const markAsRead = async (id: string, e?: React.MouseEvent, forceRead?: boolean) => {
    if (e) e.stopPropagation();
    const target = articles.find(a => a.id === id);
    const willBeRead = forceRead !== undefined ? forceRead : target ? target.unread : true;

    setArticles(prev => prev.map(a => (a.id === id ? { ...a, unread: !willBeRead } : a)));
    await updateArticleState(id, { unread: !willBeRead });

    if (willBeRead) {
      // Record reading activity event (preventing duplicate counts at store level)
      const readMins = target ? parseInt(target.readTime) || 5 : 5;
      const act = await idbRecordReadingActivity({
        articleId: id,
        title: target?.title || "Article",
        feedUrl: target?.url || target?.blogId || "",
        readTimeMinutes: readMins,
      });

      setReadingActivities(prev => {
        const exists = prev.some(p => p.articleId === id);
        if (exists) {
          return prev.map(p => (p.articleId === id ? act : p));
        }
        return [act, ...prev];
      });
      triggerToast("Marked as read");
    } else {
      // Mark as unread: update reading status in IndexedDB appropriately
      await idbRemoveReadingActivity(id);
      setReadingActivities(prev => prev.filter(p => p.articleId !== id));
      triggerToast("Marked as unread");
    }
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
    const unreadArticles = articles.filter(a => a.unread);
    setArticles(prev => prev.map(a => ({ ...a, unread: false })));

    for (const a of unreadArticles) {
      await updateArticleState(a.id, { unread: false });
      const readMins = parseInt(a.readTime) || 5;
      await idbRecordReadingActivity({
        articleId: a.id,
        title: a.title,
        feedUrl: a.url || a.blogId || "",
        readTimeMinutes: readMins,
      });
    }

    const refreshed = await idbGetReadingActivities();
    setReadingActivities(refreshed);
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
    await markAsRead(article.id, undefined, true);

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
    setIsReaderFullscreen(false);
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

  // Metrics
  const unreadTotal = articles.filter(a => a.unread).length;
  const savedArticlesList = articles.filter(a => a.saved);
  const savedTotal = savedArticlesList.length;

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden select-none transition-colors duration-200 ${
      isDark
        ? "bg-[#121110] text-[#f5efe6] selection:bg-amber-900/40 selection:text-amber-200"
        : "bg-[#fbf8f2] text-[#1f1c19] selection:bg-[#b45309]/15 selection:text-[#92400e]"
    }`}>
      
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
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 text-xs font-mono px-4 py-2 rounded-full shadow-lg border flex items-center gap-2 ${
              isDark
                ? "bg-[#221f1c] text-[#f5efe6] border-[#3d372f]"
                : "bg-[#1f1c19] text-[#fbf8f2] border-[#38332c]"
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
            <span>{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP HEADER */}
      <header className={`h-16 border-b px-4 sm:px-6 flex items-center justify-between z-30 flex-shrink-0 transition-colors duration-200 ${
        isDark ? "border-[#2d2924] bg-[#141210]" : "border-[#e8dfd1] bg-[#fbf8f2]"
      }`}>
        
        {/* Left: Back Link & Branding */}
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className={`flex items-center gap-1.5 text-xs font-mono transition-colors p-1.5 rounded-lg ${
              isDark ? "text-[#a89d8f] hover:text-[#fbbf24] hover:bg-[#221f1c]" : "text-[#786b59] hover:text-[#b45309] hover:bg-[#f4ece1]"
            }`}
            title="Return to Landing"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Landing</span>
          </Link>
          <div className={`h-4 w-px hidden sm:block ${isDark ? "bg-[#2d2924]" : "bg-[#e8dfd1]"}`} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarCollapsed(prev => !prev)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? "text-[#a89d8f] hover:text-[#fbbf24] hover:bg-[#221f1c]" : "text-[#786b59] hover:text-[#b45309] hover:bg-[#f4ece1]"
              }`}
              title={isSidebarCollapsed ? "Open sidebar" : "Collapse sidebar"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
            <div className="w-8 h-8 rounded-xl bg-[#b45309] text-white flex items-center justify-center shadow-xs">
              <Feather className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`font-serif font-bold text-sm tracking-tight ${isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"}`}>small web</h1>
              <p className={`text-[10px] font-mono uppercase tracking-widest ${isDark ? "text-[#a89d8f]" : "text-[#786b59]"}`}>personal library</p>
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
            className={`w-full border rounded-xl pl-9 pr-12 py-1.5 text-xs font-serif transition-all focus:outline-none focus:ring-1 focus:ring-[#b45309] ${
              isDark
                ? "bg-[#1d1a17] border-[#2d2924] text-[#f5efe6] placeholder-[#756a5c] focus:bg-[#221f1c]"
                : "bg-[#f4ece1]/80 border-[#e2d6c3] text-[#1f1c19] placeholder-[#8c7e6c] focus:bg-white"
            }`}
          />
          <kbd className={`absolute right-2.5 px-1.5 py-0.5 text-[9px] font-mono rounded border ${
            isDark ? "bg-[#221f1c] border-[#38332c] text-[#a89d8f]" : "bg-white border-[#d6caba] text-[#8c7e6c]"
          }`}>
            ⌘K
          </kbd>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Global Dark / Light Theme Toggle */}
          <ThemeToggle />
          
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
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#fdfaf5] border border-[#e2d6c3] rounded-2xl shadow-xl p-3 z-50 space-y-2 relative overflow-hidden"
                >
                  <BlogCardSpotlight isDark={false} size={100} />
                  <div className="relative z-10 space-y-2">
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
                  </div>
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
          style={{
            width: isSidebarCollapsed ? 0 : `${sidebarWidth}px`,
            minWidth: isSidebarCollapsed ? 0 : undefined,
            maxWidth: isSidebarCollapsed ? 0 : undefined,
          }}
          className={`flex flex-col justify-between relative flex-shrink-0 select-none transition-all duration-300 ease-in-out ${
            isDark ? "border-[#2d2924] bg-[#161413]" : "border-[#e8dfd1] bg-[#f7f2e8]/60"
          } ${
            isSidebarCollapsed
              ? "w-0 min-w-0 max-w-0 p-0 m-0 border-0 overflow-hidden invisible pointer-events-none"
              : "p-4 border-r overflow-y-auto"
          }`}
        >
          <div className="space-y-6">
            
            {/* Sidebar Top: Collapse Button */}
            <div className="flex items-center justify-between px-1">
              <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
                isDark ? "text-[#a89d8f]" : "text-[#8c7e6c]"
              }`}>
                Navigation
              </span>
              <button
                onClick={() => setIsSidebarCollapsed(true)}
                className={`p-1 rounded-md transition-colors ${
                  isDark
                    ? "text-[#a89d8f] hover:text-[#fbbf24] hover:bg-[#25211c]"
                    : "text-[#8c7e6c] hover:text-[#b45309] hover:bg-[#ebdcc8]/50"
                }`}
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
                    ? isDark ? "bg-[#25211c] text-[#fbbf24] shadow-xs border border-[#3d372f]" : "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : isDark ? "text-[#a89d8f] hover:bg-[#201d19]" : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4" /> Timeline
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isDark ? "bg-[#2d2924] text-amber-200" : "bg-[#ebdcc8] text-[#78350f]"
                }`}>
                  {articles.length}
                </span>
              </button>

              <button
                onClick={() => { setViewMode("timeline"); setActiveTab("discover"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  viewMode === "timeline" && activeTab === "discover"
                    ? isDark ? "bg-[#25211c] text-[#fbbf24] shadow-xs border border-[#3d372f]" : "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : isDark ? "text-[#a89d8f] hover:bg-[#201d19]" : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#b45309]" /> Discovery Hub
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isDark ? "bg-amber-950/60 text-amber-300" : "bg-[#fef3c7] text-[#92400e]"
                }`}>
                  Explore
                </span>
              </button>

              <button
                onClick={() => { setViewMode("timeline"); setActiveTab("unread"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  viewMode === "timeline" && activeTab === "unread"
                    ? isDark ? "bg-[#25211c] text-[#fbbf24] shadow-xs border border-[#3d372f]" : "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : isDark ? "text-[#a89d8f] hover:bg-[#201d19]" : "text-[#574e44] hover:bg-[#f3ecdf]/80"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#b45309]" /> Unread
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  isDark ? "bg-amber-950/60 text-amber-300" : "bg-[#fef3c7] text-[#92400e]"
                }`}>
                  {unreadTotal}
                </span>
              </button>

              <button
                onClick={() => { setViewMode("graph"); setSelectedBlogId(null); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-serif font-medium transition-colors ${
                  viewMode === "graph"
                    ? isDark ? "bg-[#25211c] text-[#fbbf24] shadow-xs border border-[#3d372f]" : "bg-[#fdfaf5] text-[#b45309] shadow-xs border border-[#e2d6c3]"
                    : isDark ? "text-[#a89d8f] hover:bg-[#201d19]" : "text-[#574e44] hover:bg-[#f3ecdf]/80"
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
                      setViewMode("timeline");
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
          <div className="p-3.5 rounded-2xl bg-[#f2e9db]/70 border border-[#e2d6c3] space-y-2 mt-4 relative overflow-hidden">
            <BlogCardSpotlight isDark={isDark} />
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-serif font-bold text-[#78350f]">
                <ShieldCheck className="w-4 h-4 text-[#b45309]" />
                <span>Zero Surveillance</span>
              </div>
              <p className="text-[11px] font-serif italic text-[#786b59] leading-snug">
                "No corporate tracking. Your reading sanctuary remains completely offline and private."
              </p>
            </div>
          </div>

          {/* Draggable Resize Handle */}
          {!isSidebarCollapsed && (
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
          )}
        </aside>

        {/* Floating Expand Button when Sidebar is Collapsed */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="flex absolute left-4 top-4 z-30 p-2.5 rounded-xl bg-[#fdfaf5] border border-[#e2d6c3] shadow-md text-[#574e44] hover:text-[#b45309] hover:bg-[#f4ece1] transition-all items-center justify-center group"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-[#b45309] group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* 2. CENTER FEED (Chronological Timeline, Constellation Portal, or Discovery View) */}
        <main className={`flex-1 flex flex-col overflow-y-auto transition-colors duration-200 ${
          isDark ? "bg-[#121110]" : "bg-[#fbf8f2]"
        }`}>
          <div className="p-6 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
            
            {activeTab === "discover" ? (
              /* ANONYMOUS DISCOVERY VIEW */
              <DiscoveryView
                subscribedUrls={subscriptions.map(s => s.feedUrl || "").filter(Boolean)}
                onSubscribe={(url, title) => handleAddFeedSubmit(undefined, url)}
                onToast={triggerToast}
              />
            ) : (
              /* TIMELINE OR GRAPH VIEW */
              <>
                {/* Header Title & Actions */}
                <div className={`flex flex-col sm:flex-row sm:items-baseline justify-between border-b pb-5 gap-4 ${
                  isDark ? "border-[#2d2924]" : "border-[#e8dfd1]"
                }`}>
                  <div>
                    <h2 className={`font-serif text-3xl sm:text-4xl font-normal tracking-tight ${
                      isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"
                    }`}>
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
                    <p className={`font-serif text-xs sm:text-sm mt-1.5 ${
                      isDark ? "text-[#a89d8f]" : "text-[#786b59]"
                    }`}>
                      {viewMode === "graph"
                        ? "Decentralized Small Web co-subscription graph • PECFest Mystic Mikado Special Edition"
                        : "Latest writings from your curated library. Sorted purely by chronologic delivery."}
                    </p>
                  </div>

                  {/* Feed Actions */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`text-xs font-mono ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>
                      {filteredArticles.length} essays
                    </span>

                    {/* Manual Background Refresh Button */}
                    <button
                      onClick={handleManualRefresh}
                      disabled={isRefreshing}
                      className={`text-xs font-serif font-medium px-3 py-1.5 rounded-xl border transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 ${
                        isDark
                          ? "border-[#2d2924] bg-[#1d1a17] hover:bg-[#25211c] text-[#f5efe6]"
                          : "border-[#e2d6c3] bg-[#fdfaf5] hover:bg-[#f3ecdf] text-[#574e44]"
                      }`}
                      title="Sync and check feeds for fresh essays"
                    >
                      <RefreshCw className={`w-3 h-3 text-[#b45309] ${isRefreshing ? "animate-spin" : ""}`} />
                      <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
                    </button>

                    <button
                      onClick={markAllRead}
                      className={`text-xs font-serif font-medium px-3.5 py-1.5 rounded-xl border transition-colors shadow-xs ${
                        isDark
                          ? "border-[#2d2924] bg-[#1d1a17] hover:bg-[#25211c] text-[#f5efe6]"
                          : "border-[#e2d6c3] bg-[#fdfaf5] hover:bg-[#f3ecdf] text-[#574e44]"
                      }`}
                    >
                      Mark all read
                    </button>
                  </div>
                </div>

                {/* View Mode Rendering: Portal Gate or Articles Feed */}
                {viewMode === "graph" ? (
                  <div className="py-4 space-y-8 font-serif">
                    {/* Warm Editorial Portal Gate Card */}
                    <div className={`relative overflow-hidden rounded-3xl border shadow-md p-8 sm:p-12 space-y-6 transition-colors duration-200 ${
                      isDark ? "bg-[#181614] border-[#2d2924] text-[#f5efe6]" : "bg-[#fdfaf5] border-[#e2d6c3] text-[#1f1c19]"
                    }`}>
                      <BlogCardSpotlight isDark={isDark} size={130} />
                      {/* Subtle Japanese Watermark in Background */}
                      <div className={`absolute -right-4 -bottom-6 select-none pointer-events-none text-[160px] font-serif font-black leading-none ${
                        isDark ? "text-amber-500/5" : "text-[#e8dfd1]/35"
                      }`}>
                        星座
                      </div>

                      <div className="space-y-3 relative z-10">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold ${
                            isDark
                              ? "text-amber-400 bg-amber-950/60 border border-amber-800/60"
                              : "text-[#92400e] bg-[#fef3c7] border border-[#fde68a]"
                          }`}>
                            PECFest 2026 • Mystic Mikado
                          </span>
                          <span className={`text-xs font-mono ${isDark ? "text-[#a89d8f]" : "text-[#786b59]"}`}>神秘の星座探訪</span>
                        </div>

                        <h2 className={`text-3xl sm:text-4xl font-serif font-bold tracking-tight leading-tight ${
                          isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"
                        }`}>
                          Constellation Discovery Graph
                        </h2>

                        <p className={`text-sm leading-relaxed max-w-xl font-serif ${isDark ? "text-[#aba092]" : "text-[#574e44]"}`}>
                          Explore independent small web writers clustered by organic reader gravity and co-subscription affinities — completely insulated from corporate surveillance algorithms.
                        </p>
                      </div>

                      {/* Feature Pillars */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 relative z-10">
                        <div className={`p-4 rounded-2xl border space-y-1.5 relative overflow-hidden ${
                          isDark ? "bg-[#221f1c] border-[#38332c]" : "bg-[#f4ece1]/80 border-[#e2d6c3]"
                        }`}>
                          <BlogCardSpotlight isDark={isDark} size={84} />
                          <div className="relative z-10 space-y-1.5">
                            <div className="text-xs font-mono text-[#b45309] flex items-center gap-1.5 font-bold">
                              <Orbit className="w-3.5 h-3.5" /> 探索 • Explore
                            </div>
                            <p className={`text-[11px] leading-snug ${isDark ? "text-[#aba092]" : "text-[#786b59]"}`}>
                              2D physics celestial gravity clusters of independent small web blogs.
                            </p>
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl border space-y-1.5 relative overflow-hidden ${
                          isDark ? "bg-[#221f1c] border-[#38332c]" : "bg-[#f4ece1]/80 border-[#e2d6c3]"
                        }`}>
                          <BlogCardSpotlight isDark={isDark} size={84} />
                          <div className="relative z-10 space-y-1.5">
                            <div className="text-xs font-mono text-[#b45309] flex items-center gap-1.5 font-bold">
                              <Sparkles className="w-3.5 h-3.5" /> 縁 • Affinity
                            </div>
                            <p className={`text-[11px] leading-snug ${isDark ? "text-[#aba092]" : "text-[#786b59]"}`}>
                              Discover peer overlapping recommendations with verified affinity scores.
                            </p>
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl border space-y-1.5 relative overflow-hidden ${
                          isDark ? "bg-[#221f1c] border-[#38332c]" : "bg-[#f4ece1]/80 border-[#e2d6c3]"
                        }`}>
                          <BlogCardSpotlight isDark={isDark} size={84} />
                          <div className="relative z-10 space-y-1.5">
                            <div className="text-xs font-mono text-[#b45309] flex items-center gap-1.5 font-bold">
                              <BookOpen className="w-3.5 h-3.5" /> 読書 • Discovery
                            </div>
                            <p className={`text-[11px] leading-snug ${isDark ? "text-[#aba092]" : "text-[#786b59]"}`}>
                              1-click follow blogs or instantly slide open latest essays in reading view.
                            </p>
                          </div>
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
                          className={`text-xs font-serif transition-colors underline underline-offset-4 ${
                            isDark ? "text-[#a89d8f] hover:text-[#fbbf24]" : "text-[#786b59] hover:text-[#b45309]"
                          }`}
                        >
                          Return to Timeline
                        </button>
                      </div>

                    </div>
                  </div>
                ) : filteredArticles.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <BookOpen className="w-8 h-8 text-[#b45309]/40 mx-auto" />
                    <h3 className={`font-serif text-lg font-bold ${isDark ? "text-[#a89d8f]" : "text-[#574e44]"}`}>No essays found</h3>
                    <p className={`font-serif text-xs ${isDark ? "text-[#786b59]" : "text-[#8c7e6c]"}`}>
                      {searchQuery ? "Try refining your search keyword." : "All caught up! Check back later or add new feeds."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredArticles.map(article => (
                      <motion.article
                        key={article.id}
                        onClick={() => handleSelectArticle(article)}
                        className={`group p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row gap-5 items-start relative overflow-hidden ${
                          isDark
                            ? "border-[#2d2924] hover:border-[#fbbf24]/40 hover:shadow-lg bg-[#181614] text-[#f5efe6]"
                            : "border-[#e8dfd1] hover:border-[#b45309]/40 hover:shadow-md bg-[#fdfaf5] text-[#1f1c19]"
                        }`}
                      >
                        {/* Interactive Cursor Spotlight Glow (Warm Orangish Circle) */}
                        <BlogCardSpotlight isDark={isDark} />

                        <div className="flex-1 space-y-2.5 relative z-10">
                          
                          {/* Metadata Tag */}
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                article.unread ? "bg-[#b45309]" : "bg-transparent"
                              }`}
                            />
                            <span className={`font-serif font-bold text-xs ${isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"}`}>
                              {article.blogName}
                            </span>
                            <span className={isDark ? "text-[#423b32]" : "text-[#d6caba]"}>•</span>
                            <span className={`font-mono text-[11px] ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>
                              {article.date}
                            </span>
                            <span className={isDark ? "text-[#423b32]" : "text-[#d6caba]"}>•</span>
                            <span className={`font-mono text-[11px] ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>
                              {article.readTime}
                            </span>
                          </div>

                          {/* Title & Excerpt */}
                          <h3 className={`font-serif text-xl sm:text-2xl font-bold transition-colors leading-snug ${
                            isDark
                              ? "text-[#f5efe6] group-hover:text-[#fbbf24]"
                              : "text-[#1f1c19] group-hover:text-[#b45309]"
                          }`}>
                            {article.title}
                          </h3>
                          <p className={`font-serif text-xs sm:text-sm line-clamp-2 leading-relaxed ${
                            isDark ? "text-[#aba092]" : "text-[#6b5f50]"
                          }`}>
                            {article.excerpt}
                          </p>

                          {/* Quick Bottom Actions */}
                          <div className="flex items-center justify-between pt-2">
                            <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isDark ? "bg-[#25211c] text-amber-300" : "bg-[#f4ece1] text-[#78350f]"
                            }`}>
                              {article.category}
                            </span>

                            <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={e => toggleSave(article.id, e)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? "hover:bg-[#25211c]" : "hover:bg-[#f3ecdf]"
                                } ${
                                  article.saved
                                    ? isDark ? "text-[#fbbf24]" : "text-[#b45309]"
                                    : isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"
                                }`}
                                title={article.saved ? "Remove bookmark" : "Save bookmark"}
                              >
                                <Bookmark className="w-3.5 h-3.5" fill={article.saved ? "currentColor" : "none"} />
                              </button>
                              <button
                                onClick={e => markAsRead(article.id, e)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  !article.unread
                                    ? "text-[#10b981] hover:text-[#059669] hover:bg-[#d1fae5]/30"
                                    : isDark
                                    ? "hover:bg-[#25211c] text-[#8c8172] hover:text-[#f5efe6]"
                                    : "hover:bg-[#f3ecdf] text-[#8c7e6c] hover:text-[#1f1c19]"
                                }`}
                                title={article.unread ? "Mark read" : "Mark unread"}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Editorial Thumbnail */}
                        <div className={`w-full sm:w-40 h-28 rounded-xl overflow-hidden border flex-shrink-0 shadow-xs relative z-10 ${
                          isDark ? "border-[#2d2924] bg-[#1c1a17]" : "border-[#e8dfd1] bg-[#f4ece1]"
                        }`}>
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

        {/* Floating Expand Button when Right Sidebar is Collapsed (Icon Only) */}
        {isRightSidebarCollapsed && (
          <button
            onClick={() => setIsRightSidebarCollapsed(false)}
            className={`hidden xl:flex absolute right-4 top-4 z-30 p-2 rounded-xl shadow-md transition-all items-center justify-center group ${
              isDark
                ? "bg-[#181614] border border-[#2d2924] text-[#a89d8f] hover:text-[#fbbf24] hover:bg-[#25211c]"
                : "bg-[#fdfaf5] border border-[#e2d6c3] text-[#574e44] hover:text-[#b45309] hover:bg-[#f4ece1]"
            }`}
            title="Expand telemetry sidebar"
          >
            <PanelRightOpen className="w-4 h-4 text-[#b45309] group-hover:scale-110 transition-transform" />
          </button>
        )}

        {/* 3. RIGHT SIDEBAR (Telemetry & Reading Focus) */}
        <aside
          style={{ width: isRightSidebarCollapsed ? 0 : `${rightSidebarWidth}px` }}
          className={`border-l flex flex-col justify-between hidden xl:flex relative select-none transition-all duration-300 ease-in-out ${
            isDark ? "border-[#2d2924] bg-[#161413]" : "border-[#e8dfd1] bg-[#f7f2e8]/40"
          } ${
            isRightSidebarCollapsed
              ? "!w-0 !p-0 !border-l-0 overflow-hidden opacity-0 pointer-events-none"
              : "p-6 overflow-y-auto opacity-100 space-y-6"
          }`}
        >
          {/* Draggable Resize Handle on Left Edge of Right Sidebar */}
          <div
            onMouseDown={() => {
              isRightResizingRef.current = true;
              document.body.style.cursor = "col-resize";
              document.body.style.userSelect = "none";
            }}
            className="absolute top-0 left-0 w-2 h-full cursor-col-resize hover:bg-[#b45309]/30 transition-colors group z-20 flex items-center justify-center"
            title="Drag to resize telemetry sidebar"
          >
            <div className={`w-0.5 h-8 rounded-full group-hover:bg-[#b45309] ${isDark ? "bg-[#38332c]" : "bg-[#d6caba]"}`} />
          </div>

          {/* Telemetry Header with Collapse Action */}
          <div className="flex items-center justify-between pb-1 px-1">
            <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${
              isDark ? "text-[#a89d8f]" : "text-[#8c7e6c]"
            }`}>
              Reading Telemetry
            </span>
            <button
              onClick={() => setIsRightSidebarCollapsed(true)}
              className={`p-1 rounded-md transition-colors ${
                isDark
                  ? "text-[#a89d8f] hover:text-[#fbbf24] hover:bg-[#25211c]"
                  : "text-[#8c7e6c] hover:text-[#b45309] hover:bg-[#ebdcc8]/50"
              }`}
              title="Collapse telemetry sidebar"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dynamic Weekly Reading Activity Tracker */}
          <WeeklyActivityCard
            activities={readingActivities}
            savedTotal={savedTotal}
            isDark={isDark}
          />

          {/* Continue Reading Cards */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className={`font-serif font-bold ${isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"}`}>Continue Reading</span>
              <span className={`font-mono text-[10px] ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>2 in progress</span>
            </div>

            <div className="space-y-2">
              {articles.slice(0, 2).map(a => (
                <div
                  key={a.id}
                  onClick={() => handleSelectArticle(a)}
                  className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all shadow-xs relative overflow-hidden ${
                    isDark
                      ? "bg-[#181614] border-[#2d2924] hover:border-[#fbbf24]/50"
                      : "bg-[#fdfaf5] border-[#e8dfd1] hover:border-[#b45309]/50"
                  }`}
                >
                  <BlogCardSpotlight isDark={isDark} />
                  <img
                    src={a.image || getFallbackImage(a.id)}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0 relative z-10"
                    alt=""
                    onError={(e) => {
                      const target = e.currentTarget;
                      const fallback = getFallbackImage(a.id);
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                  />
                  <div className="flex-1 truncate relative z-10">
                    <h5 className={`font-serif text-xs font-semibold truncate ${
                      isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"
                    }`}>{a.title}</h5>
                    <p className={`font-mono text-[10px] ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>{a.blogName} • 4 min left</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quote Card */}
          <div className={`p-4 rounded-2xl border space-y-2 shadow-xs relative overflow-hidden ${
            isDark ? "bg-[#181614] border-[#2d2924]" : "bg-[#fdfaf5] border-[#e8dfd1]"
          }`}>
            <BlogCardSpotlight isDark={isDark} />
            <div className="relative z-10 space-y-2">
              <span className="text-xs font-mono uppercase tracking-widest text-[#b45309] font-bold">Intentional Web</span>
              <p className={`font-serif text-xs italic leading-relaxed ${
                isDark ? "text-[#aba092]" : "text-[#574e44]"
              }`}>
                "When you follow blogs directly via RSS, you escape the dopamine casino. You read what you chose, when you chose."
              </p>
              <button
                onClick={() => setActiveTab("discover")}
                className="text-xs font-serif font-bold text-[#b45309] hover:underline flex items-center gap-1 pt-1"
              >
                <span>Explore Discovery Hub</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
              className="w-full max-w-md bg-[#fdfaf5] border border-[#e2d6c3] rounded-2xl shadow-2xl p-6 space-y-5 cursor-default relative overflow-hidden"
            >
              <BlogCardSpotlight isDark={false} size={110} />
              <div className="relative z-10 space-y-5">
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
              </div>
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
            onClick={handleCloseReadingDrawer}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs flex justify-end z-50 cursor-pointer"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={`h-full shadow-2xl flex flex-col justify-between border-l cursor-default transition-all duration-300 ${
                isReaderFullscreen ? "w-full max-w-full" : "w-full max-w-2xl"
              } ${isDark ? "bg-[#121110] border-[#2d2924] text-[#f5efe6]" : "bg-[#fbf8f2] border-[#e8dfd1] text-[#1f1c19]"}`}
            >
              
              {/* Drawer Top Header Controls */}
              <div className={`h-16 border-b px-6 flex items-center justify-between transition-colors duration-200 ${
                isDark ? "border-[#2d2924] bg-[#161412]/95" : "border-[#e8dfd1] bg-[#f4ece1]/80"
              }`}>
                <div className="flex items-center gap-2">
                  <Feather className="w-3.5 h-3.5 text-[#b45309]" />
                  <span className={`font-serif font-bold text-xs ${isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"}`}>Reading View</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* AI Digest Button (On-Device Private NLP) */}
                  <button
                    onClick={handleToggleAiDigest}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-serif transition-colors ${
                      isAiDigestOpen
                        ? "bg-[#b45309] text-white border-[#b45309] shadow-xs font-medium"
                        : isDark
                        ? "bg-[#1f1c18] border-[#2d2924] text-[#aba092] hover:bg-[#282420]"
                        : "bg-white border-[#e2d6c3] text-[#574e44] hover:bg-[#f3ecdf]"
                    }`}
                    title="AI Digest"
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
                        : isDark
                        ? "bg-[#1f1c18] border-[#2d2924] text-[#aba092] hover:bg-[#282420]"
                        : "bg-white border-[#e2d6c3] text-[#574e44] hover:bg-[#f3ecdf]"
                    }`}
                    title="Listen to essay aloud (TTS Audio)"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{isListenModeActive ? "Listening" : "Listen"}</span>
                  </button>

                  <div className={`h-4 w-px mx-0.5 hidden sm:block ${isDark ? "bg-[#2d2924]" : "bg-[#d6caba]"}`} />

                  <button
                    onClick={() => setFontFamily(f => (f === "serif" ? "sans" : "serif"))}
                    className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      isDark
                        ? "bg-[#1f1c18] border-[#2d2924] hover:bg-[#282420] text-[#aba092]"
                        : "bg-white border-[#e2d6c3] hover:bg-[#f3ecdf] text-[#574e44]"
                    }`}
                    title="Toggle Serif/Sans font"
                  >
                    <Type className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() =>
                      setFontSize(s => (s === "normal" ? "large" : s === "large" ? "xlarge" : "normal"))
                    }
                    className={`px-2 py-1 rounded-lg border text-xs font-mono font-bold transition-colors ${
                      isDark
                        ? "bg-[#1f1c18] border-[#2d2924] hover:bg-[#282420] text-[#aba092]"
                        : "bg-white border-[#e2d6c3] hover:bg-[#f3ecdf] text-[#574e44]"
                    }`}
                    title="Change font size"
                  >
                    {fontSize === "normal" ? "A" : fontSize === "large" ? "A+" : "A++"}
                  </button>

                  {/* Fullscreen Reading Mode Toggle */}
                  <button
                    onClick={() => setIsReaderFullscreen(f => !f)}
                    className={`p-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      isDark
                        ? "bg-[#1f1c18] border-[#2d2924] hover:bg-[#282420] text-[#aba092]"
                        : "bg-white border-[#e2d6c3] hover:bg-[#f3ecdf] text-[#574e44]"
                    }`}
                    title={isReaderFullscreen ? "Exit full screen view" : "Expand to full screen"}
                  >
                    {isReaderFullscreen ? (
                      <Minimize2 className="w-4 h-4 text-[#fbbf24]" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={handleCloseReadingDrawer}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ml-1 ${
                      isDark
                        ? "bg-[#25211c] hover:bg-[#332c25] text-[#fbbf24]"
                        : "bg-[#ebdcc8] hover:bg-[#debfa0] text-[#78350f]"
                    }`}
                    title="Close reading view"
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
                    className={`overflow-hidden border-b ${
                      isDark ? "border-[#2d2924] bg-[#161412]" : "border-[#e8dfd1] bg-[#f9f5ed]"
                    }`}
                  >
                    <div className={isReaderFullscreen ? "max-w-3xl mx-auto px-4" : ""}>
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
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reader Body Content */}
              <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-10">
                <div className={`space-y-6 ${isReaderFullscreen ? "max-w-3xl mx-auto w-full transition-all duration-300" : ""}`}>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-[#b45309] font-bold">
                      {selectedArticle.category}
                    </span>
                    <h1 className={`font-serif text-3xl sm:text-4xl font-bold mt-2.5 leading-tight ${
                      isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"
                    }`}>
                      {selectedArticle.title}
                    </h1>
                    <p className={`font-mono text-xs mt-3 ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>
                      By <strong className={isDark ? "text-[#f5efe6]" : "text-[#1f1c19]"}>{selectedArticle.blogName}</strong> • {selectedArticle.readTime} • {selectedArticle.date}
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

                  {/* Readability Loading Indicator */}
                  {isExtractingArticle && (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#fef3c7] text-[#92400e] text-xs font-mono border border-[#fde68a]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#b45309]" />
                      <span>Extracting clean full text via Mozilla Readability & DOMPurify...</span>
                    </div>
                  )}

                  <hr className={isDark ? "border-[#2d2924]" : "border-[#e8dfd1]"} />

                  {/* Article Prose with Active Speech Highlighting */}
                  {isListenModeActive ? (
                    <div
                      className={`leading-relaxed space-y-4 ${
                        isDark ? "text-[#e4dcd1]" : "text-[#2b2621]"
                      } ${
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
                              ? isDark
                                ? "bg-amber-950/40 border-l-4 border-amber-500 shadow-xs text-amber-200 font-medium"
                                : "bg-[#fef3c7] border-l-4 border-[#b45309] shadow-xs text-[#1f1c19] font-medium"
                              : isDark
                              ? "hover:bg-[#1a1714] text-[#cac0b3]"
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
                      className={`leading-relaxed space-y-5 ${
                        isDark ? "text-[#e4dcd1]" : "text-[#2b2621]"
                      } ${
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
              </div>

              {/* Drawer Bottom Bar */}
              <div className={`h-14 border-t px-6 flex items-center justify-between text-xs font-serif transition-colors duration-200 ${
                isDark ? "border-[#2d2924] bg-[#161412]/95 text-[#a89d8f]" : "border-[#e8dfd1] bg-[#f4ece1]/80 text-[#786b59]"
              }`}>
                <div className={`w-full flex items-center justify-between ${isReaderFullscreen ? "max-w-3xl mx-auto" : ""}`}>
                  <span className={`font-mono text-[11px] ${isDark ? "text-[#8c8172]" : "text-[#8c7e6c]"}`}>
                    Saved to your local offline library
                  </span>
                  <a
                    href={selectedArticle.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-1.5 font-medium hover:underline ${
                      isDark ? "text-[#fbbf24]" : "text-[#b45309]"
                    }`}
                  >
                    <span>Open Original Source</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
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
