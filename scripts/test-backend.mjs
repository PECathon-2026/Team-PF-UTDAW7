import { normalizeUrl, extractSiteName } from "../src/lib/server/normalizer.ts";
import { validateSSRF } from "../src/lib/server/ssrf.ts";
import { hashIpAddress, checkRateLimit } from "../src/lib/server/rateLimit.ts";
import {
  getAllFeeds,
  getRecommendations,
  recordBatchSubscriptions,
  getCoSubscriptionGraph,
} from "../src/lib/server/db.ts";

async function runTests() {
  console.log("🧪 Starting Backend Engine Test Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. URL Normalizer Tests ---
  console.log("--- 1. Testing URL Normalizer ---");
  const norm1 = normalizeUrl("https://danluu.com/atom.xml?utm_source=twitter&ref=rss#fragment");
  assert(norm1 === "https://danluu.com/atom.xml", "Strips UTM tags, ref, and fragments");

  const norm2 = normalizeUrl("http://www.simonwillison.net/atom/entries/");
  assert(norm2 === "http://simonwillison.net/atom/entries", "Strips www. and trailing slash");

  const norm3 = normalizeUrl("https://example.com:443/feed");
  assert(norm3 === "https://example.com/feed", "Strips default port 443");

  // --- 2. SSRF Guard Tests ---
  console.log("\n--- 2. Testing SSRF Protection Guard ---");
  const ssrf1 = await validateSSRF("http://127.0.0.1:8080/admin");
  assert(!ssrf1.safe && ssrf1.reason?.includes("SSRF Blocked"), "Blocks 127.0.0.1 loopback");

  const ssrf2 = await validateSSRF("http://localhost:3000");
  assert(!ssrf2.safe, "Blocks localhost hostname");

  const ssrf3 = await validateSSRF("http://169.254.169.254/latest/meta-data");
  assert(!ssrf3.safe, "Blocks AWS/Cloud metadata IP (169.254.169.254)");

  const ssrf4 = await validateSSRF("http://192.168.1.1/router");
  assert(!ssrf4.safe, "Blocks RFC1918 private IPv4 (192.168.1.1)");

  const ssrf5 = await validateSSRF("http://10.0.0.1/internal");
  assert(!ssrf5.safe, "Blocks RFC1918 private IPv4 (10.0.0.1)");

  const ssrf6 = await validateSSRF("file:///etc/passwd");
  assert(!ssrf6.safe, "Blocks non-HTTP protocol file://");

  // --- 3. Abuse Resistance & Rate Limiting ---
  console.log("\n--- 3. Testing Abuse Resistance & Salted IP Hashing ---");
  const hash1 = hashIpAddress("203.0.113.195");
  const hash2 = hashIpAddress("203.0.113.195");
  const hash3 = hashIpAddress("203.0.113.196");
  assert(hash1 === hash2, "Identical IPs produce deterministic hash for the same salt window");
  assert(hash1 !== hash3, "Different IPs produce distinct hashes");
  assert(hash1.length === 64, "Outputs valid SHA-256 64-char hex string with zero raw IP leakage");

  const rCheck = checkRateLimit(hash1);
  assert(rCheck.allowed, "Permits initial submission");

  // --- 4. Database & Co-Subscription Engine ---
  console.log("\n--- 4. Testing Discovery Engine & Co-Subscription Matrix ---");
  const feeds = await getAllFeeds();
  assert(feeds.length >= 14, `Pre-seeded with ${feeds.length} small-web blogs`);

  // Query recommendations for user who reads Dan Luu
  const recs = await getRecommendations(["https://danluu.com/atom.xml"], 5);
  assert(recs.length > 0, "Returns recommendations for Dan Luu reader");
  assert(
    !recs.some((r) => r.feed.normalizedUrl === "https://danluu.com/atom.xml"),
    "Recommendations never include user's own subscribed feeds"
  );
  assert(
    recs[0].reason.includes("Dan Luu") || recs[0].reason.includes("readers"),
    `Transparent reason provided: "${recs[0].reason}"`
  );

  // Test submitting a new anonymous co-subscription batch
  const batchRes = await recordBatchSubscriptions([
    "https://danluu.com/atom.xml",
    "https://jvns.ca/atom.xml",
    "https://robinsloan.com/feed.xml",
  ]);
  assert(batchRes.success && batchRes.pairsIncremented === 3, "Batch incremented pairwise edges");

  // Test Graph API
  const graph = await getCoSubscriptionGraph();
  assert(graph.nodes.length >= 14 && graph.edges.length > 10, "Graph returns populated nodes and edges");

  console.log(`\n🎉 Test Suite Completed: ${passed} passed, ${failed} failed.\n`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
