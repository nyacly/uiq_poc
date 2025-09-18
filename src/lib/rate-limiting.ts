/**
 * Rate limiting system for spam protection
 * UiQ Community Platform - Anti-spam measures
 */

import { db, rateLimits } from './db'
import { eq, and, gt, lte } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'

interface RateLimitConfig {
  windowMs: number    // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in window
  blockDurationMs?: number // How long to block after limit exceeded
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: Date
  blocked: boolean
  blockedUntil?: Date
}

// Default rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5, blockDurationMs: 30 * 60 * 1000 }, // 5 attempts per 15 min, block 30 min
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 registrations per hour
  verification: { windowMs: 5 * 60 * 1000, maxRequests: 3 }, // 3 verification attempts per 5 min
  
  // Content creation
  post_business: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 business posts per hour
  post_provider: { windowMs: 60 * 60 * 1000, maxRequests: 8 }, // 8 provider writes per hour
  post_event: { windowMs: 60 * 60 * 1000, maxRequests: 8 }, // 8 event writes per hour
  post_listing: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 listings per hour
  post_message: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 messages per minute
  post_review: { windowMs: 60 * 60 * 1000, maxRequests: 5 }, // 5 reviews per hour
  
  // General API
  api_general: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  
  // Contact/communication
  contact_form: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 contact form submissions per hour
  report_submit: { windowMs: 60 * 60 * 1000, maxRequests: 10 }, // 10 reports per hour
  
  // Search and browsing (more lenient)
  search: { windowMs: 60 * 1000, maxRequests: 50 }, // 50 searches per minute
} as const

// Check rate limit for a specific identifier and endpoint
export async function checkRateLimit(
  identifier: string, // IP address or user ID
  endpoint: keyof typeof RATE_LIMIT_CONFIGS,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const limitConfig = config || RATE_LIMIT_CONFIGS[endpoint]
    const now = new Date()
    const windowStart = new Date(now.getTime() - limitConfig.windowMs)

    // Check if currently blocked
    const existingBlock = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.endpoint, endpoint),
          eq(rateLimits.blocked, true),
          gt(rateLimits.blockedUntil, now)
        )
      )
      .limit(1)

    if (existingBlock.length > 0) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existingBlock[0].blockedUntil!,
        blocked: true,
        blockedUntil: existingBlock[0].blockedUntil!
      }
    }

    // Clean up expired entries
    await db
      .delete(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.endpoint, endpoint),
          lte(rateLimits.windowEnd, windowStart)
        )
      )

    // Get current active rate limit entry
    const currentEntry = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          eq(rateLimits.endpoint, endpoint),
          gt(rateLimits.windowEnd, now)
        )
      )
      .limit(1)

    let count = 1
    let windowEnd = new Date(now.getTime() + limitConfig.windowMs)

    if (currentEntry.length > 0) {
      // Update existing entry
      count = currentEntry[0].count + 1
      windowEnd = currentEntry[0].windowEnd

      await db
        .update(rateLimits)
        .set({ 
          count,
          updatedAt: now
        })
        .where(eq(rateLimits.id, currentEntry[0].id))
    } else {
      // Create new entry
      await db.insert(rateLimits).values({
        identifier,
        endpoint,
        count,
        windowStart: now,
        windowEnd,
        blocked: false
      })
    }

    // Check if limit exceeded
    if (count > limitConfig.maxRequests) {
      const blocked = !!limitConfig.blockDurationMs
      const blockedUntil = blocked 
        ? new Date(now.getTime() + limitConfig.blockDurationMs!)
        : undefined

      if (blocked) {
        // Update entry to mark as blocked
        await db
          .update(rateLimits)
          .set({ 
            blocked: true,
            blockedUntil,
            updatedAt: now
          })
          .where(
            and(
              eq(rateLimits.identifier, identifier),
              eq(rateLimits.endpoint, endpoint),
              gt(rateLimits.windowEnd, now)
            )
          )
      }

      return {
        allowed: false,
        remaining: 0,
        resetTime: windowEnd,
        blocked,
        blockedUntil
      }
    }

    return {
      allowed: true,
      remaining: limitConfig.maxRequests - count,
      resetTime: windowEnd,
      blocked: false
    }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    // Fail open - allow the request if there's an error
    return {
      allowed: true,
      remaining: 999,
      resetTime: new Date(Date.now() + 60000),
      blocked: false
    }
  }
}

// Rate limit middleware for Next.js API routes
export function createRateLimitMiddleware(
  endpoint: keyof typeof RATE_LIMIT_CONFIGS,
  config?: RateLimitConfig
) {
  return async function rateLimitMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    next?: () => void
  ) {
    const identifier = getClientIdentifier(req)
    const result = await checkRateLimit(identifier, endpoint, config)

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', config?.maxRequests || RATE_LIMIT_CONFIGS[endpoint].maxRequests)
    res.setHeader('X-RateLimit-Remaining', result.remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetTime.getTime() / 1000))

    if (!result.allowed) {
      if (result.blocked && result.blockedUntil) {
        res.setHeader('X-RateLimit-Blocked-Until', Math.ceil(result.blockedUntil.getTime() / 1000))
        return res.status(429).json({
          error: 'Too many requests',
          message: `You are temporarily blocked until ${result.blockedUntil.toISOString()}`,
          retryAfter: Math.ceil((result.blockedUntil.getTime() - Date.now()) / 1000)
        })
      } else {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((result.resetTime.getTime() - Date.now()) / 1000)
        })
      }
    }

    if (next) next()
    return result
  }
}

// Get client identifier (IP or user ID)
function getClientIdentifier(req: NextApiRequest): string {
  // Try to get user ID first (for authenticated requests)
  if ((req as any).user?.id) {
    return `user:${(req as any).user.id}`
  }

  // Fall back to IP address
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded 
    ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : (forwarded as string[])[0])
    : req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown'

  return `ip:${ip}`
}

// Clean up old rate limit entries (run periodically)
export async function cleanupOldRateLimits(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    await db
      .delete(rateLimits)
      .where(lte(rateLimits.windowEnd, cutoff))

    console.log('Cleaned up old rate limit entries')
  } catch (error) {
    console.error('Error cleaning up rate limits:', error)
  }
}

// Reset rate limits for a specific identifier (admin function)
export async function resetRateLimit(
  identifier: string,
  endpoint?: keyof typeof RATE_LIMIT_CONFIGS
): Promise<void> {
  try {
    const conditions = [eq(rateLimits.identifier, identifier)]
    
    if (endpoint) {
      conditions.push(eq(rateLimits.endpoint, endpoint))
    }

    await db
      .delete(rateLimits)
      .where(and(...conditions))

    console.log(`Reset rate limits for ${identifier}${endpoint ? ` on ${endpoint}` : ''}`)
  } catch (error) {
    console.error('Error resetting rate limits:', error)
  }
}

// Get rate limit status for monitoring
export async function getRateLimitStatus(identifier: string): Promise<{
  endpoint: string
  count: number
  remaining: number
  resetTime: Date
  blocked: boolean
}[]> {
  try {
    const now = new Date()
    
    const entries = await db
      .select()
      .from(rateLimits)
      .where(
        and(
          eq(rateLimits.identifier, identifier),
          gt(rateLimits.windowEnd, now)
        )
      )

    return entries.map(entry => {
      const config = RATE_LIMIT_CONFIGS[entry.endpoint as keyof typeof RATE_LIMIT_CONFIGS]
      return {
        endpoint: entry.endpoint,
        count: entry.count,
        remaining: Math.max(0, config.maxRequests - entry.count),
        resetTime: entry.windowEnd,
        blocked: entry.blocked
      }
    })
  } catch (error) {
    console.error('Error getting rate limit status:', error)
    return []
  }
}