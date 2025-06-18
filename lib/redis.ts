/**
 * Redis utility for rate limiting
 * Uses Upstash Redis REST API for serverless compatibility
 */

// Rate limit configuration
export const RATE_LIMITS = {
  GENERATIONS_PER_DAY: 5,
  DOMAIN_CHECKS_PER_DAY: 15,
};

/**
 * Simple Redis client using Upstash REST API
 * No npm package required - works with Edge runtime
 */
export class RedisClient {
  private url: string;
  private token: string;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn("Redis credentials not found. Rate limiting disabled.");
    }

    this.url = url || "";
    this.token = token || "";
  }

  private isConfigured(): boolean {
    return Boolean(this.url && this.token);
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    if (!this.isConfigured()) return null;

    try {
      const response = await fetch(`${this.url}/get/${key}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Redis GET error:", await response.text());
        return null;
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  }

  /**
   * Set a value in Redis with optional expiration
   */
  async set(key: string, value: string, expirationSeconds?: number): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      let url = `${this.url}/set/${key}/${value}`;
      
      if (expirationSeconds) {
        url += `/ex/${expirationSeconds}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Redis SET error:", await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error("Redis SET error:", error);
      return false;
    }
  }

  /**
   * Increment a counter and return the new value
   */
  async incr(key: string): Promise<number> {
    if (!this.isConfigured()) return 0;

    try {
      const response = await fetch(`${this.url}/incr/${key}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Redis INCR error:", await response.text());
        return 0;
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Redis INCR error:", error);
      return 0;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isConfigured()) return false;

    try {
      const response = await fetch(`${this.url}/expire/${key}/${seconds}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        cache: "no-store",
      });

      if (!response.ok) {
        console.error("Redis EXPIRE error:", await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error("Redis EXPIRE error:", error);
      return false;
    }
  }
}

// Create a singleton instance
export const redis = new RedisClient();

/**
 * Get seconds remaining until the next day (midnight UTC)
 */
export function getSecondsUntilNextDay(): number {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setUTCHours(24, 0, 0, 0);
  return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
}

/**
 * Get a unique key for rate limiting based on IP address
 */
export function getRateLimitKey(ip: string, action: 'generate' | 'domain-check'): string {
  // Remove any port information and sanitize IP
  const sanitizedIp = ip.replace(/:\d+$/, '').replace(/[^a-zA-Z0-9.]/g, '_');
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `ratelimit:${action}:${sanitizedIp}:${date}`;
}

/**
 * Check if a request is rate limited
 * @returns Object with isLimited flag and remaining count
 */
export async function checkRateLimit(
  ip: string,
  action: 'generate' | 'domain-check'
): Promise<{ isLimited: boolean; remaining: number; total: number }> {
  // Default limits
  const limit = action === 'generate' 
    ? RATE_LIMITS.GENERATIONS_PER_DAY 
    : RATE_LIMITS.DOMAIN_CHECKS_PER_DAY;
  
  // Get rate limit key
  const key = getRateLimitKey(ip, action);
  
  // Get current count
  const countStr = await redis.get(key);
  const count = countStr ? parseInt(countStr, 10) : 0;
  
  // Calculate remaining
  const remaining = Math.max(0, limit - count);
  
  // Set expiration to reset at midnight UTC if this is a new key
  if (count === 0) {
    const secondsUntilMidnight = getSecondsUntilNextDay();
    await redis.expire(key, secondsUntilMidnight);
  }
  
  return {
    isLimited: count >= limit,
    remaining,
    total: limit
  };
}

/**
 * Increment rate limit counter
 * @returns New count after increment
 */
export async function incrementRateLimit(
  ip: string,
  action: 'generate' | 'domain-check'
): Promise<number> {
  const key = getRateLimitKey(ip, action);
  const newCount = await redis.incr(key);
  
  // Ensure expiration is set
  const secondsUntilMidnight = getSecondsUntilNextDay();
  await redis.expire(key, secondsUntilMidnight);
  
  return newCount;
}
