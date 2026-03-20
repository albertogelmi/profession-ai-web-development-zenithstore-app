import {
  Registry,
  collectDefaultMetrics,
  Counter,
  Histogram,
} from 'prom-client';
import type { Request, Response, NextFunction } from 'express';

export const register = new Registry();

// Collect Node.js default metrics (CPU, memory, event loop lag, etc.)
collectDefaultMetrics({ register });

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpErrorTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total number of HTTP errors (4xx + 5xx)',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

/**
 * Express middleware that records HTTP request duration, total count and error
 * count for every request. The /metrics endpoint itself is excluded to avoid
 * self-referential noise.
 */
export function httpRequestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === '/metrics') {
    return next();
  }

  const endTimer = httpRequestDuration.startTimer();

  res.on('finish', () => {
    // req.route?.path gives the Express route pattern (e.g. /api/products/:code).
    // Fall back to req.path only when no route matched (e.g. 404).
    const route = (req.route?.path as string | undefined) ?? req.path;
    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    endTimer(labels);
    httpRequestTotal.inc(labels);

    if (res.statusCode >= 400) {
      httpErrorTotal.inc(labels);
    }
  });

  next();
}
