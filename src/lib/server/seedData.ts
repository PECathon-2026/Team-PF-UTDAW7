export interface SeedFeed {
  id: string;
  normalizedUrl: string;
  originalUrl: string;
  siteUrl: string;
  title: string;
  description: string;
  category: string;
  popularity: number;
}

export interface SeedCoSub {
  feedA: string;
  feedB: string;
  weight: number;
}

export const INITIAL_FEEDS: SeedFeed[] = [
  {
    id: "danluu",
    normalizedUrl: "https://danluu.com/atom.xml",
    originalUrl: "https://danluu.com/atom.xml",
    siteUrl: "https://danluu.com",
    title: "Dan Luu",
    description: "In-depth empirical research on hardware performance, software latency, and engineering culture.",
    category: "Systems & Architecture",
    popularity: 142,
  },
  {
    id: "jvns",
    normalizedUrl: "https://jvns.ca/atom.xml",
    originalUrl: "https://jvns.ca/atom.xml",
    siteUrl: "https://jvns.ca",
    title: "Julia Evans",
    description: "Zines, programming curiosity, DNS debugging, and accessible systems internals.",
    category: "Systems & Architecture",
    popularity: 128,
  },
  {
    id: "simonwillison",
    normalizedUrl: "https://simonwillison.net/atom/entries",
    originalUrl: "https://simonwillison.net/atom/entries/",
    siteUrl: "https://simonwillison.net",
    title: "Simon Willison",
    description: "Creator of Datasette and co-creator of Django, exploring AI architectures and open web tooling.",
    category: "Engineering & AI",
    popularity: 119,
  },
  {
    id: "maggieappleton",
    normalizedUrl: "https://maggieappleton.com/rss.xml",
    originalUrl: "https://maggieappleton.com/rss.xml",
    siteUrl: "https://maggieappleton.com",
    title: "Maggie Appleton",
    description: "Illustrated essays on digital gardens, visual thinking, and human-computer symbiosis.",
    category: "Design & Craft",
    popularity: 96,
  },
  {
    id: "marginalian",
    normalizedUrl: "https://themarginalian.org/feed",
    originalUrl: "https://www.themarginalian.org/feed/",
    siteUrl: "https://www.themarginalian.org",
    title: "The Marginalian",
    description: "Maria Popova's timeless reflections on art, science, philosophy, and the search for meaning.",
    category: "Culture & Philosophy",
    popularity: 135,
  },
  {
    id: "kevquirk",
    normalizedUrl: "https://kevquirk.com/feed",
    originalUrl: "https://kevquirk.com/feed",
    siteUrl: "https://kevquirk.com",
    title: "Kev Quirk",
    description: "Passionate advocate for the open web, digital minimalism, and personal blogging.",
    category: "Indie Web",
    popularity: 84,
  },
  {
    id: "robinsloan",
    normalizedUrl: "https://robinsloan.com/feed.xml",
    originalUrl: "https://www.robinsloan.com/feed.xml",
    siteUrl: "https://www.robinsloan.com",
    title: "Robin Sloan",
    description: "Author and media tinkerer writing about small software, speculative fiction, and olive oil.",
    category: "Design & Craft",
    popularity: 77,
  },
  {
    id: "craigmod",
    normalizedUrl: "https://craigmod.com/index.xml",
    originalUrl: "https://craigmod.com/index.xml",
    siteUrl: "https://craigmod.com",
    title: "Craig Mod",
    description: "Walking monographs, slow publishing, photographic meditations, and bookmaking.",
    category: "Culture & Philosophy",
    popularity: 81,
  },
  {
    id: "sivers",
    normalizedUrl: "https://sive.rs/en.atom",
    originalUrl: "https://sive.rs/en.atom",
    siteUrl: "https://sive.rs",
    title: "Derek Sivers",
    description: "Philosophical notes on entrepreneurship, independent living, and deliberate simplicity.",
    category: "Culture & Philosophy",
    popularity: 110,
  },
  {
    id: "alistapart",
    normalizedUrl: "https://alistapart.com/main/feed",
    originalUrl: "https://alistapart.com/main/feed/",
    siteUrl: "https://alistapart.com",
    title: "A List Apart",
    description: "Exploring the design, development, and meaning of web content since 1998.",
    category: "Design & Craft",
    popularity: 104,
  },
  {
    id: "stratechery",
    normalizedUrl: "https://stratechery.com/feed",
    originalUrl: "https://stratechery.com/feed/",
    siteUrl: "https://stratechery.com",
    title: "Stratechery",
    description: "Ben Thompson's authoritative analysis of tech business models, aggregation theory, and strategy.",
    category: "Tech Strategy",
    popularity: 92,
  },
  {
    id: "gwern",
    normalizedUrl: "https://gwern.net/feed",
    originalUrl: "https://gwern.net/feed",
    siteUrl: "https://gwern.net",
    title: "Gwern Branwen",
    description: "Long-form empirical investigations into statistical epistemology, machine learning, and darknet history.",
    category: "Systems & Architecture",
    popularity: 88,
  },
  {
    id: "xeiaso",
    normalizedUrl: "https://xeiaso.net/blog.rss",
    originalUrl: "https://xeiaso.net/blog.rss",
    siteUrl: "https://xeiaso.net",
    title: "Xe Iaso",
    description: "Philosophical technology musings, NixOS deep dives, and narrative programming essays.",
    category: "Systems & Architecture",
    popularity: 73,
  },
  {
    id: "tracydurnell",
    normalizedUrl: "https://tracydurnell.com/feed",
    originalUrl: "https://tracydurnell.com/feed/",
    siteUrl: "https://tracydurnell.com",
    title: "Tracy Durnell",
    description: "IndieWeb advocate writing about books, gardening, personal computing, and slow media.",
    category: "Indie Web",
    popularity: 61,
  },
];

// Initial realistic co-subscription graph weights representing reader community overlap
export const INITIAL_CO_SUBSCRIPTIONS: SeedCoSub[] = [
  // Systems Cluster: Dan Luu <-> Julia Evans <-> Simon Willison <-> Xe Iaso <-> Gwern
  { feedA: "https://danluu.com/atom.xml", feedB: "https://jvns.ca/atom.xml", weight: 94 },
  { feedA: "https://danluu.com/atom.xml", feedB: "https://simonwillison.net/atom/entries", weight: 78 },
  { feedA: "https://jvns.ca/atom.xml", feedB: "https://simonwillison.net/atom/entries", weight: 81 },
  { feedA: "https://danluu.com/atom.xml", feedB: "https://xeiaso.net/blog.rss", weight: 62 },
  { feedA: "https://jvns.ca/atom.xml", feedB: "https://xeiaso.net/blog.rss", weight: 65 },
  { feedA: "https://danluu.com/atom.xml", feedB: "https://gwern.net/feed", weight: 58 },
  { feedA: "https://gwern.net/feed", feedB: "https://simonwillison.net/atom/entries", weight: 51 },

  // Craft & Philosophy Cluster: Maggie Appleton <-> Craig Mod <-> Robin Sloan <-> Maria Popova (Marginalian) <-> Derek Sivers
  { feedA: "https://craigmod.com/index.xml", feedB: "https://robinsloan.com/feed.xml", weight: 72 },
  { feedA: "https://maggieappleton.com/rss.xml", feedB: "https://robinsloan.com/feed.xml", weight: 68 },
  { feedA: "https://craigmod.com/index.xml", feedB: "https://themarginalian.org/feed", weight: 64 },
  { feedA: "https://maggieappleton.com/rss.xml", feedB: "https://themarginalian.org/feed", weight: 59 },
  { feedA: "https://sive.rs/en.atom", feedB: "https://themarginalian.org/feed", weight: 75 },
  { feedA: "https://craigmod.com/index.xml", feedB: "https://sive.rs/en.atom", weight: 54 },

  // Indie Web Cluster: Kev Quirk <-> Tracy Durnell <-> A List Apart <-> Maggie Appleton
  { feedA: "https://kevquirk.com/feed", feedB: "https://tracydurnell.com/feed", weight: 56 },
  { feedA: "https://alistapart.com/main/feed", feedB: "https://maggieappleton.com/rss.xml", weight: 61 },
  { feedA: "https://kevquirk.com/feed", feedB: "https://maggieappleton.com/rss.xml", weight: 48 },
  { feedA: "https://danluu.com/atom.xml", feedB: "https://stratechery.com/feed", weight: 45 },
  { feedA: "https://simonwillison.net/atom/entries", feedB: "https://stratechery.com/feed", weight: 49 },
];
