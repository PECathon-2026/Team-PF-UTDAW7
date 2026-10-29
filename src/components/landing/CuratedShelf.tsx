"use client";

import { useState } from "react";
import { Rss, Check, BookmarkPlus, ArrowUpRight, BookOpen, Feather } from "lucide-react";

interface SeedBlog {
  id: string;
  name: string;
  author: string;
  category: "Engineering" | "Essays" | "IndieWeb" | "Philosophy";
  feedUrl: string;
  siteUrl: string;
  description: string;
  latestEssay: string;
  readTime: string;
}

const SEED_BLOGS: SeedBlog[] = [
  {
    id: "dan-luu",
    name: "Dan Luu",
    author: "Dan Luu",
    category: "Engineering",
    feedUrl: "https://danluu.com/atom.xml",
    siteUrl: "https://danluu.com",
    description: "Deep, empirical dives into computer architecture, latency, hardware, and engineering culture.",
    latestEssay: "Why Modern Software Feels Sluggish",
    readTime: "14 min read",
  },
  {
    id: "paul-graham",
    name: "Paul Graham",
    author: "Paul Graham",
    category: "Essays",
    feedUrl: "http://www.aaronsw.com/2002/feeds/pgessays.rss",
    siteUrl: "https://paulgraham.com",
    description: "Influential essays on startups, thinking models, craft, and what matters in technology.",
    latestEssay: "Maker's Schedule, Manager's Schedule",
    readTime: "6 min read",
  },
  {
    id: "maggie-appleton",
    name: "Maggie Appleton",
    author: "Maggie Appleton",
    category: "IndieWeb",
    feedUrl: "https://maggieappleton.com/rss.xml",
    siteUrl: "https://maggieappleton.com",
    description: "Visual essays on digital anthropology, programming visual tools, and digital gardening.",
    latestEssay: "A Brief History of Digital Gardens",
    readTime: "9 min read",
  },
  {
    id: "simon-willison",
    name: "Simon Willison",
    author: "Simon Willison",
    category: "Engineering",
    feedUrl: "https://simonwillison.net/atom/entries/",
    siteUrl: "https://simonwillison.net",
    description: "Co-creator of Django. Pioneering work on personal AI tools, sqlite-utils, and open data.",
    latestEssay: "Autonomous Feeds & The Small Web",
    readTime: "4 min read",
  },
  {
    id: "gwern",
    name: "Gwern",
    author: "Gwern Branwen",
    category: "Philosophy",
    feedUrl: "https://gwern.net/feed",
    siteUrl: "https://gwern.net",
    description: "Rigorous epistemics, spaced repetition, longevity research, and deep explorations of AI scaling.",
    latestEssay: "The Scaling Hypothesis & Epistemic Humility",
    readTime: "22 min read",
  },
  {
    id: "robin-sloan",
    name: "Robin Sloan",
    author: "Robin Sloan",
    category: "Essays",
    feedUrl: "https://www.robinsloan.com/feed.xml",
    siteUrl: "https://www.robinsloan.com",
    description: "Novelist, inventor, and researcher on artisanal software, media, and slow publishing.",
    latestEssay: "An Autonomy: Writing in the Public Domain",
    readTime: "5 min read",
  },
  {
    id: "craig-mod",
    name: "Craig Mod",
    author: "Craig Mod",
    category: "Essays",
    feedUrl: "https://craigmod.com/index.xml",
    siteUrl: "https://craigmod.com",
    description: "Meditations on book design, walking across Japan, publishing crafts, and intentional slowness.",
    latestEssay: "The Solitary Walk as an Editorial Act",
    readTime: "11 min read",
  },
  {
    id: "kev-quirk",
    name: "Kev Quirk",
    author: "Kev Quirk",
    category: "IndieWeb",
    feedUrl: "https://kevquirk.com/feed",
    siteUrl: "https://kevquirk.com",
    description: "Founder of the 512KB Club. Fierce advocate for lightweight, tracking-free personal blogging.",
    latestEssay: "Why RSS Remains the Web's Greatest Gift",
    readTime: "4 min read",
  },
  {
    id: "derek-sivers",
    name: "Derek Sivers",
    author: "Derek Sivers",
    category: "Philosophy",
    feedUrl: "https://sive.rs/en.atom",
    siteUrl: "https://sive.rs",
    description: "Concise, punchy essays on life decisions, minimalism, programming, and independent entrepreneurship.",
    latestEssay: "Obvious to You, Amazing to Others",
    readTime: "3 min read",
  },
  {
    id: "julia-evans",
    name: "Julia Evans",
    author: "Julia Evans",
    category: "Engineering",
    feedUrl: "https://jvns.ca/atom.xml",
    siteUrl: "https://jvns.ca",
    description: "Bite-sized zines and revelations unpacking DNS, Linux kernels, git internals, and debugging.",
    latestEssay: "Things You Can Do With Traceroute",
    readTime: "5 min read",
  },
  {
    id: "brandur",
    name: "Brandur Leach",
    author: "Brandur Leach",
    category: "Engineering",
    feedUrl: "https://brandur.org/articles.atom",
    siteUrl: "https://brandur.org",
    description: "Incredible technical essays on distributed idempotency, Postgres architecture, and elegant APIs.",
    latestEssay: "Idempotent Transaction Patterns",
    readTime: "12 min read",
  },
  {
    id: "tom-macwright",
    name: "Tom MacWright",
    author: "Tom MacWright",
    category: "IndieWeb",
    feedUrl: "https://macwright.com/rss.xml",
    siteUrl: "https://macwright.com",
    description: "Notes on software aesthetics, spatial mapping, personal notes, and open-source sustainability.",
    latestEssay: "The State of the Modern Web",
    readTime: "7 min read",
  },
];

const CATEGORIES = ["All", "Engineering", "Essays", "IndieWeb", "Philosophy"] as const;

export default function CuratedShelf() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set(["dan-luu", "paul-graham"]));

  const toggleSubscribe = (id: string) => {
    setSubscribedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredBlogs =
    selectedCategory === "All"
      ? SEED_BLOGS
      : SEED_BLOGS.filter((b) => b.category === selectedCategory);

  return (
    <section className="py-24 px-6 sm:px-12 bg-[#f4ede0] border-y border-[#e2d6c3] text-[#1f1c19]">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#ddcfbb]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ede3d1] border border-[#d6c7b0] text-[#92400e] text-xs font-mono uppercase tracking-widest">
              <Feather className="w-3 h-3 text-[#b45309]" />
              <span>PS-003 Official Seed Dataset</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif text-[#1f1c19]">
              The Independent Library Shelf
            </h2>
            <p className="font-serif text-[#6b5f50] text-sm max-w-xl">
              Pre-populated with 12 iconic independent blogs so the Discover and Recommendation engine is active from day one.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  selectedCategory === cat
                    ? "bg-[#1f1c19] text-[#faf6ee] shadow-xs"
                    : "bg-[#e8decb] text-[#5c5143] hover:bg-[#ded1bc]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => {
            const isSubbed = subscribedIds.has(blog.id);
            return (
              <div
                key={blog.id}
                className="group relative rounded-xl bg-[#fffdfa] border border-[#e8dfd3] p-6 flex flex-col justify-between transition-all duration-300 hover:border-[#b45309]/60 hover:shadow-md hover:shadow-[#b45309]/5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#92400e] bg-[#fdf5e8] px-2.5 py-0.5 rounded-full border border-[#fde68a]">
                      {blog.category}
                    </span>
                    <a
                      href={blog.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8c7e6c] hover:text-[#b45309] transition-colors"
                      title="Visit personal site"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>

                  <div>
                    <h3 className="text-lg font-serif font-medium text-[#1f1c19] group-hover:text-[#b45309] transition-colors">
                      {blog.name}
                    </h3>
                    <p className="text-xs font-mono text-[#8c7e6c] mt-0.5">{blog.feedUrl}</p>
                  </div>

                  <p className="text-xs font-serif text-[#574c3e] leading-relaxed line-clamp-3">
                    {blog.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#f3eadc] flex items-center justify-between">
                  <div className="text-[11px] font-mono text-[#786b59]">
                    <span className="font-semibold text-[#b45309]">Essay:</span> {blog.readTime}
                  </div>

                  <button
                    onClick={() => toggleSubscribe(blog.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
                      isSubbed
                        ? "bg-[#e5dcd0] text-[#4a4034] hover:bg-[#d6c9ba]"
                        : "bg-[#b45309] text-white hover:bg-[#92400e] shadow-xs"
                    }`}
                  >
                    {isSubbed ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#15803d]" /> Following
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" /> Follow
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
