interface RateLimitStore {
  [key: string]: { count: number; resetAt: number }
}

const store: RateLimitStore = {}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export function rateLimit(config: RateLimitConfig) {
  return async (identifier: string): Promise<{ success: boolean; remaining: number }> => {
    const now = Date.now()
    const key = identifier
    
    // Clean up expired entries
    if (store[key] && store[key].resetAt < now) {
      delete store[key]
    }

    if (!store[key]) {
      store[key] = {
        count: 1,
        resetAt: now + config.windowMs,
      }
      return { success: true, remaining: config.maxRequests - 1 }
    }

    if (store[key].count >= config.maxRequests) {
      return { success: false, remaining: 0 }
    }

    store[key].count++
    return { success: true, remaining: config.maxRequests - store[key].count }
  }
}
