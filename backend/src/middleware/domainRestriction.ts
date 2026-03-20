import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { createError } from './errorHandler';

dotenv.config();

/**
 * Middleware to limit access only to the domain specified in .env
 * Checks the Host header of the request
 */
export const domainRestriction = (req: Request, res: Response, next: NextFunction): void => {
  const allowedDomain = process.env.ALLOWED_DOMAIN || 'localhost';
  const host = req.get('host');
  
  if (!host) {
    const error = createError('Host header is required', 400);
    next(error);
    return;
  }

  // Extract only the domain without port
  const domain = host.split(':')[0];
  
  if (domain !== allowedDomain) {
    console.error(`Domain ${domain} not allowed`);
    const error = createError(`Access denied. Only ${allowedDomain} is allowed.`, 403);
    next(error);
    return;
  }

  next();
};