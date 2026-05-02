// Simple in-memory rate limiter for server actions.
// Note: This only works within a single server instance.
// For production with multiple instances, use Redis (e.g., Upstash).

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { ok: true };
  }

  if (record.count >= limit) {
    return { ok: false };
  }

  record.count += 1;
  return { ok: true };
}
