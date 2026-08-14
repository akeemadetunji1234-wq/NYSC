import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  success: boolean;
  retryAfterSeconds: number;
};

const MAX_BUCKETS = 10_000;
const buckets = new Map<string, Bucket>();
const limiters = new Map<string, Ratelimit>();

function pruneExpired(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  while (buckets.size >= MAX_BUCKETS) {
    const oldestKey = buckets.keys().next().value as string | undefined;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

function hasUpstashConfig() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getDistributedLimiter(limit: number, windowMs: number) {
  const key = `${limit}:${windowMs}`;
  const existing = limiters.get(key);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    analytics: true,
    prefix: "nysc:ratelimit",
  });
  limiters.set(key, limiter);
  return limiter;
}

/**
 * Uses shared Upstash Redis on Vercel when configured. The bounded in-memory
 * implementation remains available for local development and test runs.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (hasUpstashConfig()) {
    try {
      const result = await getDistributedLimiter(limit, windowMs).limit(key);
      const retryAfterSeconds = result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return { success: result.success, retryAfterSeconds };
    } catch (error) {
      console.error("Distributed rate limiter unavailable; using local fallback:", error);
    }
  }

  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    pruneExpired(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return { success: true, retryAfterSeconds: 0 };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  return (forwarded?.split(",")[0]?.trim() || realIp || "unknown").slice(0, 100);
}

export function resetRateLimitForTests() {
  buckets.clear();
  limiters.clear();
}
