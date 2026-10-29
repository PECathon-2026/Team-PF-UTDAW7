# 📖 The Small Web Reader: Anonymous Discovery for Independent Blogs

> **PECathon 2026 — Problem Statement PS-003**  
> **Team ID:** `PF-UTDAW7`  
> **Live GitHub:** [https://github.com/PECathon-2026/Team-PF-UTDAW7](https://github.com/PECathon-2026/Team-PF-UTDAW7)  
> **Core Principle:** *Reclaim the open web without algorithmic feeds. Follow blogs directly via RSS/Atom, read full articles offline, and discover independent writers through anonymous co-subscription recommendations with zero accounts, zero cookies, and zero persistent user identifiers.*

---

## 🏛️ 1. Architecture Overview

The system strictly adheres to the two-layer architecture mandated by **PS-003 Task A**:

```mermaid
flowchart TD
    subgraph Client["Browser Client (Privacy Sanctuary)"]
        UI["Web UI\n• Unified Chronological Timeline\n• Subscriptions List & Filter\n• Full-Text Reading Drawer\n• Discovery Hub & Co-Sub Graph"]
        Parser["Client-Side Feed Engine\n• DOMParser (RSS 2.0 & Atom)\n• Autodiscovery Engine\n• Mozilla Readability\n• DOMPurify HTML Sanitizer"]
        Vault["Client Offline Storage\n(LocalStorage / IndexedDB Vault)\n• Cached Articles & Read States\n• Subscriptions & Bookmarks"]
    end

    subgraph Server["Server Layer (Zero-Knowledge Engine)"]
        Proxy["/api/fetch Gateway\n• SSRF Protection Guard\n• Conditional Caching (ETag / If-None-Match)\n• Raw Byte Streaming (No server parsing)"]
        DiscoveryAPI["/api/discover API\n• /submit (Opt-in batch ingestion)\n• /recommendations (Jaccard matrix)\n• /popular (Curated independent index)\n• /graph ('Blogs Like This' network)"]
        RateLimit["Abuse Resistance\n• Daily Salted SHA-256 IP Hashing\n• 15-Minute Sliding Window Rate Limiter"]
    end

    subgraph Database["Database Matrix (Supabase / Prisma)"]
        DB[(PostgreSQL / SQLite Matrix)\n• Feeds Table (Canonicalized URLs)\n• Co-Subscriptions Table (A < B, Weight)\n• Submission Rate Limits (Salted IP Hash)]
    end

    UI --> Vault
    UI --> Parser
    Parser -->|CORS Proxy Request| Proxy
    UI -->|Anonymous Batch Sync| DiscoveryAPI
    Proxy -->|SSRF Validated Fetch| ExternalWeb["External Blogs & Feeds"]
    DiscoveryAPI --> RateLimit
    DiscoveryAPI --> DB
```

### Key Architectural Boundaries:
1. **Client-Side Parsing & Extraction (Task A & B):** All XML feed parsing (RSS 2.0, Atom 1.0) and article DOM extraction happen directly inside the user's browser. The server never inspects or caches article content.
2. **CORS Fetch Proxy (`/api/fetch`):** Proxies raw bytes from independent blogs to circumvent browser CORS restrictions. Protected by DNS-level SSRF filters against internal networks.
3. **Database-Backed Discovery (`/api/discover`):** Collects anonymous subscription URL batches and computes reader overlap without user accounts or tracking identifiers.

---

## 🔒 2. Privacy & Threat Model (PS-003 Rubric Requirement)

Our privacy architecture follows a strict zero-knowledge trust contract:

### What the Server Stores
- **Canonical Normalized Feed URLs:** Stripped of tracking query parameters (`utm_*`, `ref`), fragments, default ports, and trailing slashes.
- **Pairwise Co-Subscription Tallies:** Unordered pairs `(feed_a, feed_b, weight)` where `feed_a < feed_b`.
- **Salted SHA-256 IP Hashes:** Hashed with a daily rotating salt for abuse resistance. Raw IP addresses are **never stored** and discarded immediately.

### What the Server Never Stores
- ❌ No user accounts, passwords, or emails.
- ❌ No persistent cookies, sessions, or device canvas fingerprints.
- ❌ No user reading histories, timestamps, clickstreams, or bookmarks.
- ❌ No raw IP addresses or geographical logs.

### Threat Defense & Abuse Resistance
| Threat | Mitigation Mechanism |
| :--- | :--- |
| **Server-Side Request Forgery (SSRF)** | Every URL passed to `/api/fetch` or `/api/discover/submit` is validated via `validateSSRF()`: blocks `localhost`, `127.0.0.1`, RFC 1918 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), and Cloud metadata (`169.254.169.254`). |
| **XSS via Proxied Feeds** | All extracted HTML passes through `DOMPurify.sanitize()` client-side with a strict whitelist before rendering (Task C). |
| **Recommendation Poisoning / Sybil Gaming** | Batch sizes capped at $\le 50$; daily salted SHA-256 IP rate-limiting throttles submissions (max 20 per 15 min); input URLs must be public HTTP(S). |
| **Linkability Across Batches** | Submissions are completely stateless single batches. No token or ID ties batch A to batch B. |

---

## 🚀 3. Setup Instructions

### Prerequisites
- Node.js 18.18+ (tested on Node 20 & 24)
- npm 9+

### Local Installation
```bash
# 1. Clone repository
git clone https://github.com/PECathon-2026/Team-PF-UTDAW7.git
cd Team-PF-UTDAW7

# 2. Install dependencies
npm install

# 3. Run automated backend test suite
npm run test:backend

# 4. Start local development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) for the 3D Perspective Tunnel Landing Page, or [http://localhost:3000/reader](http://localhost:3000/reader) for the Reader Dashboard and Discovery Hub.

### Optional Supabase Configuration (Zero-Crash Fallback Included)
The application is pre-seeded with 14 curated small-web blogs and realistic co-subscription graph weights. It runs **100% offline with zero external dependencies**.

To connect to a live Supabase PostgreSQL database:
1. Create a project at [supabase.com](https://supabase.com).
2. Copy and execute [`supabase/schema.sql`](supabase/schema.sql) and [`supabase/seed.sql`](supabase/seed.sql) in the Supabase SQL Editor.
3. Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 🎯 4. Demo Instructions & Judge Evaluation Scenarios

### Scenario A: Add Feeds via Autodiscovery (Task B)
1. Open [http://localhost:3000/reader](http://localhost:3000/reader).
2. Click **+ Add Feed** in the top navigation.
3. Paste a raw blog URL without specifying the feed path, e.g.:
   - `https://overreacted.io` (Dan Abramov)
   - `https://simonwillison.net`
   - `https://robinsloan.com`
4. Click **Subscribe Now**. The client autodiscovery engine locates `<link rel="alternate">`, fetches via the CORS proxy, parses the XML, and renders recent essays immediately in your chronological timeline.

### Scenario B: Full-Text Reading & XSS Sanitization (Task C)
1. Click any article card in the timeline.
2. The slide-over reading drawer opens.
3. Notice Mozilla Readability and DOMPurify working in real time: clean editorial typography, distraction-free reading, and complete immunity to malicious scripts.
4. Customize reading typography with the **Serif / Sans** and **A / A+ / A++** font controls.

### Scenario C: Anonymous Discovery & Co-Subscription Graph (Task D & Bonus)
1. In the left navigation, click **Discovery Hub**.
2. See transparent recommendations with clear reason tags (*"Followed by readers of Dan Luu (94 co-readers)"*).
3. Toggle between **Curated Shelf** and **Visual Graph** to explore the interactive co-subscription network map.
4. Click **+ Subscribe** on any recommendation to add it directly to your library.
5. Review the **Opt-in Anonymous Contribution Protocol** toggle to see how privacy is preserved.

### Scenario D: Edge Cases Handled Responsibly
- **SSRF Attack Attempt:** Try inputting `http://127.0.0.1:8080/admin` in the Add Feed dialog or on the interactive simulator on the landing page. It is immediately intercepted and rejected.
- **Dead Feed / Timeout:** Slow or unreachable hosts time out after 12 seconds with graceful fallback and non-blocking toast notifications.
- **OPML Export / Import (Bonus):** Click the **Download** icon in the Subscriptions header to export your library as a standard `.opml` file, or click **Upload** to import any existing OPML backup.

---

## 🏆 Bonus Points Checklist

- [x] **Bonus Quest (10 Extra Points):** Verified canonical URL normalizer (`src/lib/server/normalizer.ts`) and duplicate blog detector.
- [x] **Transparent Recommendations:** Every suggestion displays an explicit reason badge (*"Followed by readers of X"*).
- [x] **"Blogs Like This" Visual Graph:** Interactive SVG cluster graph mapping co-subscription edges in real time.
- [x] **OPML Import & Export:** Full standard OPML 2.0 interoperability.
- [x] **Abuse-Resistance Defense:** Salted SHA-256 IP hashing, sliding rate limit windows, and URL protocol checks.
- [x] **Conditional Fetching:** Upstream `ETag` and `If-None-Match` caching support.
- [x] **Offline-First Resilience:** Instant loading from local client storage cache (`localStorage` / `IndexedDB`).

---

## 👥 Team PF-UTDAW7
- **Event:** PECathon 2026
- **Track:** PS-003 Small Web Reader
- **Repository:** [https://github.com/PECathon-2026/Team-PF-UTDAW7](https://github.com/PECathon-2026/Team-PF-UTDAW7)
