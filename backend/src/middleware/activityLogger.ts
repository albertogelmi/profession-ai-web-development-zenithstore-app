import { Request, Response, NextFunction } from 'express';
import { ActivityLogRepository } from '../repositories/mongodb/ActivityLogRepository';
import { IActivityLog } from '../entities/mongodb/ActivityLog';

/**
 * Extends Request interface to include activity information
 */
declare global {
  namespace Express {
    interface Request {
      activityStartTime?: number;
    }
  }
}

/**
 * Configuration of routes to track
 * Only significant operations are logged
 */
const TRACKED_ROUTES = [
  // Authentication
  { path: '/api/users/login', action: 'user:login' },
  { path: '/api/users/logout', action: 'user:logout' },
  { path: '/api/customers/login', action: 'customer:login' },
  { path: '/api/customers/logout', action: 'customer:logout' },
  
  // User operations
  { path: '/api/users', action: 'user:create', methods: ['POST'] },
  { path: '/api/users/:id', action: 'user:update', methods: ['PUT', 'PATCH'] },
  { path: '/api/users/:id', action: 'user:delete', methods: ['DELETE'] },
  
  // Customer operations
  { path: '/api/customers', action: 'customer:create', methods: ['POST'] },
  { path: '/api/customers/:id', action: 'customer:update', methods: ['PUT', 'PATCH'] },
  
  // Order operations
  { path: '/api/orders', action: 'order:create', methods: ['POST'] },
  { path: '/api/orders/:id', action: 'order:update', methods: ['PUT', 'PATCH'] },
  { path: '/api/orders/:id/cancel', action: 'order:cancel', methods: ['POST'] },
  
  // Product operations (admin only)
  { path: '/api/products', action: 'product:create', methods: ['POST'] },
  { path: '/api/products/:code', action: 'product:update', methods: ['PUT', 'PATCH'] },
  { path: '/api/products/:code', action: 'product:delete', methods: ['DELETE'] },
  
  // Shipment operations
  { path: '/api/shipments', action: 'shipment:create', methods: ['POST'] },
  { path: '/api/shipments/:id', action: 'shipment:update', methods: ['PUT', 'PATCH'] },
  
  // Payment operations
  { path: '/api/payments/process', action: 'payment:process', methods: ['POST'] },
  { path: '/api/payments/:id/refund', action: 'payment:refund', methods: ['POST'] },
];

/**
 * Determine the action to log based on path and method
 */
const getActionFromRoute = (path: string, method: string): string | null => {
  for (const route of TRACKED_ROUTES) {
    const pathPattern = route.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pathPattern}$`);
    
    if (regex.test(path)) {
      if (!route.methods || route.methods.includes(method)) {
        return route.action;
      }
    }
  }
  return null;
};

/**
 * Extract resource ID from path (e.g.: /api/orders/123 -> 123)
 */
const extractResourceId = (path: string): string | undefined => {
  const segments = path.split('/');
  const lastSegment = segments[segments.length - 1];
  
  // If the last segment is a number or product code, use it as resourceId
  if (lastSegment && /^[A-Z0-9-]+$/i.test(lastSegment) && lastSegment !== 'api') {
    return lastSegment;
  }
  
  return undefined;
};

/**
 * Function that performs activity logging
 */
const logActivity = async (req: Request, res: Response, action: string): Promise<void> => {
  if (!req.activityStartTime) {
    return;
  }

  const duration = Date.now() - req.activityStartTime;
  const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

  // Determine actor type and ID
  const actorType: 'user' | 'customer' | 'system' = req.user?.role === 'user' ? 'user' : 
                   req.user?.role === 'customer' ? 'customer' : 'system';
  const actorId = req.user?.userId?.toString() || 'anonymous';

  // Determine resource type from path
  const pathSegments = req.path.split('/').filter(s => s);
  const resourceType = pathSegments[1] || 'unknown'; // e.g.: 'orders', 'products'
  const resourceId = extractResourceId(req.path);

  const logData: Partial<IActivityLog> = {
    actorType,
    actorId,
    action,
    resourceType,
    resourceId,
    result: (isSuccess ? 'success' : 'failure') as 'success' | 'failure',
    duration,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    metadata: {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
    },
    errorDetails: !isSuccess ? {
      message: res.locals.errorMessage || 'Request failed',
      code: res.statusCode.toString(),
    } : undefined,
  };

  // Create the log
  const activityLogRepo = new ActivityLogRepository();
  await activityLogRepo.create(logData);
};

/**
 * Activity Logger Middleware
 * Automatically tracks significant user activities
 * To be used after body parser and before routes
 */
export const activityLogger = (req: Request, res: Response, next: NextFunction): void => {
  const action = getActionFromRoute(req.path, req.method);
  
  if (action) {
    req.activityStartTime = Date.now();
    
    // Register listener for when the response is completed
    res.on('finish', async () => {
      try {
        await logActivity(req, res, action);
      } catch (error) {
        // Silent log to avoid cluttering logs - errors already handled by errorEmitter
        console.error('Activity logging failed:', error instanceof Error ? error.message : error);
      }
    });
  }
  
  next();
};
