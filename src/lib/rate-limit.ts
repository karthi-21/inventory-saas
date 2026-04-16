/**
 * Rate limiting utility for API routes
 * In-memory sliding window rate limiter
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
  keyPrefix?: string
}

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    keyPrefix = 'rl',
  } = options

  return (identifier: string): { allowed: boolean; remaining: number; resetTime: number } => {
    const key = `${keyPrefix}:${identifier}`
    const now = Date.now()
    const entry = rateLimitStore.get(key)

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
      return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
    }

    if (entry.count >= maxRequests) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime }
    }

    entry.count++
    return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime }
  }
}

export const apiLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 100, keyPrefix: 'api' })
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 20, keyPrefix: 'auth' })
