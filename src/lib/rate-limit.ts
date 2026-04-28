/**
 * Rate limiting utility for API routes
 * Uses Upstash Redis for distributed rate limiting in production
 * Falls back to in-memory rate limiting in development
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client if env vars are present
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

interface RateLimitEntry {
  count: number
  resetTime: number
}

const memoryStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime) {
        memoryStore.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  windowMs?: number
  maxRequests?: number
  keyPrefix?: string
}

async function redisRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  if (!redis) {
    // Fallback should not reach here, but handle gracefully
    return { allowed: true, remaining: maxRequests, resetTime: Date.now() + windowMs }
  }

  const now = Date.now()
  const windowKey = `${key}:${Math.floor(now / windowMs)}`

  const current = await redis.incr(windowKey)
  if (current === 1) {
    await redis.pexpire(windowKey, windowMs)
  }

  const allowed = current <= maxRequests
  const remaining = Math.max(0, maxRequests - current)
  const resetTime = (Math.floor(now / windowMs) + 1) * windowMs

  return { allowed, remaining, resetTime }
}

function memoryRateLimit(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetTime: entry.resetTime }
}

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 100,
    keyPrefix = 'rl',
  } = options

  return async (identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
    const key = `${keyPrefix}:${identifier}`

    if (redis) {
      return redisRateLimit(key, windowMs, maxRequests)
    }

    return memoryRateLimit(key, windowMs, maxRequests)
  }
}

export const apiLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 100, keyPrefix: 'api' })
export const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, maxRequests: 20, keyPrefix: 'auth' })
