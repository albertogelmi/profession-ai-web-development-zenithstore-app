import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Rate limiter for generic APIs
 */
export const apiLimiter = rateLimit({
  // windowMs is the time period in milliseconds during which requests are counted
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  // max is the maximum number of requests allowed per IP
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // max 100 requests per IP
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * More restrictive rate limiter for authentication APIs
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 login attempts per IP
  message: {
    error: 'Too Many Login Attempts',
    message: 'Too many login attempts from this IP, please try again later.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});