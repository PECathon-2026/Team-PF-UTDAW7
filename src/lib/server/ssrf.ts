import dns from "node:dns/promises";
import net from "node:net";

export interface SSRFCheckResult {
  safe: boolean;
  reason?: string;
  resolvedIp?: string;
  normalizedUrl?: string;
}

/**
 * Checks if an IPv4 address falls within restricted, private, loopback, or metadata ranges.
 */
function isRestrictedIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP is unsafe
  }

  const [b0, b1, b2, b3] = parts;

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;

  // 10.0.0.0/8 (Private RFC1918)
  if (b0 === 10) return true;

  // 172.16.0.0/12 (Private RFC1918: 172.16.x.x - 172.31.x.x)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

  // 192.168.0.0/16 (Private RFC1918)
  if (b0 === 192 && b1 === 168) return true;

  // 169.254.0.0/16 (Link-local & Cloud Metadata 169.254.169.254)
  if (b0 === 169 && b1 === 254) return true;

  // 100.64.0.0/10 (Shared address space / Carrier Grade NAT)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

  // 192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24 (Test-Net documentation)
  if (b0 === 192 && b1 === 0 && b2 === 2) return true;
  if (b0 === 198 && b1 === 51 && b2 === 100) return true;
  if (b0 === 203 && b1 === 0 && b2 === 113) return true;

  // 224.0.0.0/4 (Multicast)
  if (b0 >= 224 && b0 <= 239) return true;

  // 240.0.0.0/4 (Reserved) & 255.255.255.255 (Broadcast)
  if (b0 >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 address falls within loopback, unique local, or link-local ranges.
 */
function isRestrictedIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // ::1 loopback or :: unspecified
  if (normalized === "::1" || normalized === "::") return true;

  // IPv4-mapped IPv6 (::ffff:127.0.0.1, ::ffff:192.168.1.1, etc.)
  if (normalized.startsWith("::ffff:") || normalized.startsWith("0:0:0:0:0:ffff:")) {
    const v4Part = normalized.split(":").pop();
    if (v4Part && net.isIPv4(v4Part)) {
      return isRestrictedIPv4(v4Part);
    }
    return true;
  }

  // fc00::/7 (Unique local address / private)
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;

  // fe80::/10 (Link-local)
  if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
    return true;
  }

  return false;
}

/**
 * Verifies whether a target URL is safe to fetch (protects against SSRF attacks).
 */
export async function validateSSRF(rawUrl: string): Promise<SSRFCheckResult> {
  if (!rawUrl || typeof rawUrl !== "string") {
    return { safe: false, reason: "Missing or invalid URL" };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { safe: false, reason: "Malformed URL format" };
  }

  // Enforce protocol
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      safe: false,
      reason: `Blocked protocol '${parsed.protocol}'. Only HTTP and HTTPS are permitted.`,
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block obvious internal and reserved hostnames
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".arpa")
  ) {
    return {
      safe: false,
      reason: `SSRF Blocked: Local and internal domain names are forbidden (${hostname})`,
    };
  }

  // Direct IP address in URL check
  if (net.isIPv4(hostname)) {
    if (isRestrictedIPv4(hostname)) {
      return {
        safe: false,
        reason: `SSRF Blocked: Direct access to private/loopback IPv4 (${hostname}) is forbidden`,
        resolvedIp: hostname,
      };
    }
    return { safe: true, resolvedIp: hostname, normalizedUrl: parsed.toString() };
  }

  if (net.isIPv6(hostname)) {
    if (isRestrictedIPv6(hostname)) {
      return {
        safe: false,
        reason: `SSRF Blocked: Direct access to private/loopback IPv6 (${hostname}) is forbidden`,
        resolvedIp: hostname,
      };
    }
    return { safe: true, resolvedIp: hostname, normalizedUrl: parsed.toString() };
  }

  // DNS resolution check
  try {
    const records = await dns.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      return { safe: false, reason: `DNS resolution failed for host: ${hostname}` };
    }

    for (const record of records) {
      const { address, family } = record;
      if (family === 4 && isRestrictedIPv4(address)) {
        return {
          safe: false,
          reason: `SSRF Blocked: Host '${hostname}' resolves to restricted private IP (${address})`,
          resolvedIp: address,
        };
      }
      if (family === 6 && isRestrictedIPv6(address)) {
        return {
          safe: false,
          reason: `SSRF Blocked: Host '${hostname}' resolves to restricted IPv6 (${address})`,
          resolvedIp: address,
        };
      }
    }

    return {
      safe: true,
      resolvedIp: records[0].address,
      normalizedUrl: parsed.toString(),
    };
  } catch (err: any) {
    return {
      safe: false,
      reason: `DNS lookup error for host '${hostname}': ${err.message || "Unresolvable host"}`,
    };
  }
}
