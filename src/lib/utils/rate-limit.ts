/**
 * Simple in-memory sliding window rate limiter.
 * Tracks request timestamps per key (e.g. IP address).
 * Not suitable for multi-instance deployments — use Redis in production.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  const entries = Array.from(store.entries());
  for (const [key, entry] of entries) {
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < 60_000
    );
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 300_000);

export interface RateLimitConfig {
  /** Maximum number of requests within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Check if a request should be rate limited.
 * @returns true if the request is allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): boolean {
  const now = Date.now();
  let entry = store.get(key);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(
    (ts) => now - ts < config.windowMs
  );

  if (entry.timestamps.length >= config.maxRequests) {
    return false; // Rate limited
  }

  entry.timestamps.push(now);
  return true; // Allowed
}

/** Get the IP address from a request for rate limiting */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}
