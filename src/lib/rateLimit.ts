// In-memory token bucket rate limiter for API endpoints

interface RateLimitStore {
  [ip: string]: {
    tokens: number;
    lastRefill: number;
  };
}

const store: RateLimitStore = {};

/**
 * Basic Rate Limiter
 * @param identifier IP or userId
 * @param maxTokens max allowed requests in time window (default 30)
 * @param windowMs time window in ms (default 60,000ms = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  maxTokens: number = 30,
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const client = store[identifier] || { tokens: maxTokens, lastRefill: now };

  // Refill tokens based on elapsed time
  const elapsed = now - client.lastRefill;
  if (elapsed > windowMs) {
    client.tokens = maxTokens;
    client.lastRefill = now;
  }

  if (client.tokens > 0) {
    client.tokens -= 1;
    store[identifier] = client;
    return { allowed: true, remaining: client.tokens };
  }

  return { allowed: false, remaining: 0 };
}
