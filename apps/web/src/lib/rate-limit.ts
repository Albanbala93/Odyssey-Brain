/**
 * Best-effort in-memory rate limiter for the two AI-calling routes
 * (/api/coach/turn, /api/voice/transcribe) — protects a single warm
 * serverless instance from a tight retry loop or basic abuse by one
 * client. This is NOT a substitute for a distributed limiter: a
 * serverless platform runs multiple instances and each gets its own
 * independent counter, so a client spread across instances (or a cold
 * start) resets the count. A real production limiter needs shared state
 * (e.g. Vercel KV / Upstash Redis) — tracked as a known, documented gap
 * (docs/SECURITY.md), not silently presented as fully solved.
 */
const WINDOW_MS = 60_000;
const PRUNE_PROBABILITY = 0.01;

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS * 2) buckets.delete(key);
  }
}

/** Returns true if the request is allowed, false if the caller is over its limit for the current window. */
export function checkRateLimit(key: string, maxPerWindow: number): boolean {
  const now = Date.now();
  if (Math.random() < PRUNE_PROBABILITY) pruneExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (bucket.count >= maxPerWindow) return false;
  bucket.count += 1;
  return true;
}

/** Best-effort client identifier from standard proxy headers (Vercel sets x-forwarded-for). */
export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
