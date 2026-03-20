import { Request, Response, NextFunction } from 'express';
import { extractTokenFromHeader, JwtPayload } from '../utils/jwt';
import { createError } from './errorHandler';
import { JwtBlacklistService } from '../services/JwtBlacklistService';
import { UserRepository } from '../repositories/mysql/UserRepository';
import { CustomerRepository } from '../repositories/mysql/CustomerRepository';

// Extend the Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      token?: string;
    }
  }
}

/**
 * Base function to validate JWT token and manage blacklist
 * Extracts and validates the token, but does not verify roles or user status
 */
const validateTokenBase = async (req: Request): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = extractTokenFromHeader(authHeader);
  
  if (!token) {
    throw createError('Access token is required', 401);
  }

  // Verify the token and check that it's not in the blacklist
  const jwtBlacklistService = new JwtBlacklistService();
  const validationResult = await jwtBlacklistService.validateTokenAgainstBlacklist(token);

  if (!validationResult.isValid) {
    throw createError(validationResult.error || 'Invalid token', 401);
  }

  req.user = validationResult.decoded;
  req.token = token;
};

/**
 * Handle common errors for all authentication middlewares
 */
const handleAuthError = (error: any): never => {
  console.error('Token authentication failed', error);

  let message = 'Authentication failed';
  let statusCode = 401;
  
  if (error instanceof Error) {
    message = error.message;
    // If the error has a status code, use it
    if ((error as any).statusCode) {
      statusCode = (error as any).statusCode;
    }
  }
  
  throw createError(message, statusCode);
};

/**
 * Middleware to verify the presence and validity of the JWT token
 * Adds user information to the request
 * Also checks if the token is in the blacklist
 * Accepts both users and customers - verifies the role and calls the appropriate function
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await validateTokenBase(req);

    if (req.user !== undefined && req.user.role === 'user') {
      await checkUser(req.user);
    } else if (req.user !== undefined && req.user.role === 'customer') {
      await checkCustomer(req.user);
    } else {
      throw createError('Invalid user role', 403);
    }

    next();
  } catch (error) {
    handleAuthError(error);
  }
};

/**
 * Verify that the user exists and is active
 */
const checkUser = async (jwtPayload: JwtPayload): Promise<void> => {
  // Verify that the user exists and is active
  const userRepository = new UserRepository();
  const user = await userRepository.findById(jwtPayload.userId);

  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.isBlocked) {
    throw createError('User is blocked', 403);
  }

  if (!user.isActive) {
    throw createError('User is not active', 403);
  }
};

/**
 * Verify that the customer exists and is active
 */
const checkCustomer = async (jwtPayload: JwtPayload): Promise<void> => {
  // Verify that the customer exists and is active
  const customerRepository = new CustomerRepository();

  if (isNaN(Number(jwtPayload.userId))) {
    throw createError('Invalid customer ID in token', 400);
  }

  const customer = await customerRepository.findById(parseInt(jwtPayload.userId));

  if (!customer) {
    throw createError('Customer not found', 404);
  }

  if (customer.isBlocked) {
    throw createError('Customer is blocked', 403);
  }

  if (!customer.isActive) {
    throw createError('Customer is not active', 403);
  }
};

/**
 * Middleware to authenticate exclusively users (role: 'user')
 * Used for APIs that can only be called by users
 */
export const authenticateTokenUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await validateTokenBase(req);

    if (!req.user) {
      throw createError('Invalid token payload', 401);
    }

    // Verify that the role is actually 'user'
    if (req.user.role !== 'user') {
      throw createError('Access restricted to users only', 403);
    }

    await checkUser(req.user);
    next();
  } catch (error) {
    handleAuthError(error);
  }
};

/**
 * Middleware to authenticate exclusively customers (role: 'customer')
 * Used for APIs that can only be called by customers
 */
export const authenticateTokenCustomer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await validateTokenBase(req);

    if (!req.user) {
      throw createError('Invalid token payload', 401);
    }

    // Verify that the role is actually 'customer'
    if (req.user.role !== 'customer') {
      throw createError('Access restricted to customers only', 403);
    }

    await checkCustomer(req.user);
    next();
  } catch (error) {
    handleAuthError(error);
  }
};