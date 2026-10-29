import crypto from "node:crypto";

/**
 * Abuse-Resistance & Rate Limiting for Anonymous Discovery Submissions.
 * Follows PS-003 guidelines:
 * - Never stores raw IP addresses.
 * - Uses a salted SHA-256 hash.
 * - Salt rotates or can be configured via environment variable.
 * - Enforces short-lived in-memory / cache TTL.
 */

// Daily rotating salt seed to guarantee forward privacy
function getDailySalt(): string {
  const customSalt = process.env.RATE_LIMIT_SALT || "small-web-reader-privacy-salt";
  const dateKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${customSalt}-${dateKey}`;
}

export function hashIpAddress(ip: string): string {
  const cleanIp = (ip || "127.0.0.1").trim();
  const salt = getDailySalt();
  return crypto.createHmac("sha256", salt).update(cleanIp).digest("hex");
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory bucket with automatic cleanup
const rateLimitMap = new Map<string, RateLimitRecord>();

const MAX_SUBMISSIONS_PER_WINDOW = 20;
const WINDOW_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ipHash: string): {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
} {
  const now = Date.now();
  const record = rateLimitMap.get(ipHash);

  // Periodically evict expired entries to prevent memory bloat
  if (rateLimitMap.size > 2000) {
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt < now) {
        rateLimitMap.delete(key);
      }
    }
  }

  if (!record || record.resetAt < now) {
    rateLimitMap.set(ipHash, {
      count: 1,
      resetAt: now + WINDOW_DURATION_MS,
    });
    return {
      allowed: true,
      remaining: MAX_SUBMISSIONS_PER_WINDOW - 1,
      resetInSeconds: Math.ceil(WINDOW_DURATION_MS / 1000),
    };
  }

  if (record.count >= MAX_SUBMISSIONS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: MAX_SUBMISSIONS_PER_WINDOW - record.count,
    resetInSeconds: Math.ceil((record.resetAt - now) / 1000),
  };
}
