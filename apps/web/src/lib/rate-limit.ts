import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// Authenticated API routes (per API key)
// 60 requests per 60 seconds sliding window
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      prefix: "ratelimit:api",
    })
  : null

// Checkout creation (per API key) — more restrictive
// 10 requests per 60 seconds (no legitimate app needs more)
export const checkoutRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      prefix: "ratelimit:checkout",
    })
  : null

// Stripe webhooks (per IP) — generous since Stripe sends bursts
// 200 requests per 60 seconds
export const webhookRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, "60 s"),
      prefix: "ratelimit:webhook",
    })
  : null

// Public/unauthenticated routes (per IP)
// 30 requests per 60 seconds
export const publicRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      prefix: "ratelimit:public",
    })
  : null
