import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestMap = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter
 * Protects login and registration routes against brute-force password guessing and spam.
 */
export function rateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutes
  maxRequests = 25,
  message = 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
}: {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
} = {}) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const now = Date.now();

    const record = ipRequestMap.get(ip);

    if (!record || now > record.resetTime) {
      ipRequestMap.set(ip, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (record.count >= maxRequests) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        error: message,
        retryAfterSeconds: retryAfterSec,
      });
      return;
    }

    record.count += 1;
    next();
  };
}
