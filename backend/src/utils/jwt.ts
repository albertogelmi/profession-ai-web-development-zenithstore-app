import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { createError } from '../middleware/errorHandler';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JwtPayload {
  userId: string;
  role: 'user' | 'customer';
  firstName: string;
  lastName: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for the user
 */
export const generateToken = (payload: Omit<JwtPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'zenithstore-api',
    audience: 'zenithstore-users'
  } as jwt.SignOptions);
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'zenithstore-api',
      audience: 'zenithstore-users'
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw createError('Token expired', 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw createError('Invalid token', 401);
    }
    console.error('Token verification failed', error);
    throw createError('Token verification failed', 500);
  }
};

/**
 * Extract the token from the Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;  
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1] || null;
};