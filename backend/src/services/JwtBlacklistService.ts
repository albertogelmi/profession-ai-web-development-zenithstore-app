import crypto from 'crypto';
import { JwtBlacklistRepository } from '../repositories/mysql/JwtBlacklistRepository';
import { verifyToken } from '../utils/jwt';
import { createError } from '../middleware/errorHandler';
import { errorEmitter } from '../utils/errorEmitter';

export interface BlacklistTokenParams {
  token: string;
  userReference?: string;
  userType?: string;
  reason?: string;
}

export class JwtBlacklistService {
  private blacklistRepository: JwtBlacklistRepository;

  constructor() {
    this.blacklistRepository = new JwtBlacklistRepository();
  }

  /**
   * Generate JTI (JWT ID) from token using SHA-256 hash
   */
  private generateTokenJti(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Blacklist a JWT token
   */
  async blacklistToken(params: BlacklistTokenParams): Promise<void> {
    try {
      // Verify and decode the token to get expiry
      const decoded = verifyToken(params.token);
      
      if (!decoded || !decoded.exp) {
        throw createError('Invalid token: missing expiry', 401);
      }

      const tokenJti = this.generateTokenJti(params.token);
      const expiresAt = new Date(decoded.exp * 1000);

      // Check if token is already blacklisted
      const isAlreadyBlacklisted = await this.blacklistRepository.isTokenBlacklisted(tokenJti);
      if (isAlreadyBlacklisted) {
        return; // Already blacklisted, no need to add again
      }

      const blacklistRequest = {
        tokenJti,
        userReference: decoded.userId,
        userType: params.userType,
        expiresAt,
        reason: params.reason
      };

      await this.blacklistRepository.addToBlacklist(blacklistRequest);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'JwtBlacklistService.blacklistToken'
      });
      throw error;
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    try {
      const tokenJti = this.generateTokenJti(token);
      return await this.blacklistRepository.isTokenBlacklisted(tokenJti);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'JwtBlacklistService.isTokenBlacklisted'
      });
      throw error;
    }
  }

  /**
   * Cleanup expired blacklist entries
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      return await this.blacklistRepository.cleanupExpiredEntries();
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'JwtBlacklistService.cleanupExpiredTokens'
      });
      throw error;
    }
  }

  /**
   * Validate token and check blacklist status
   * This is the main method to be used by authentication middleware
   */
  async validateTokenAgainstBlacklist(token: string): Promise<{
    isValid: boolean;
    isBlacklisted: boolean;
    decoded?: any;
    error?: string;
  }> {
    try {
      // First check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      
      if (isBlacklisted) {
        return {
          isValid: false,
          isBlacklisted: true,
          error: 'Token has been invalidated'
        };
      }

      // Then verify token signature and expiry
      const decoded = verifyToken(token);
      
      if (!decoded) {
        return {
          isValid: false,
          isBlacklisted: false,
          error: 'Invalid token'
        };
      }

      return {
        isValid: true,
        isBlacklisted: false,
        decoded
      };
    } catch (error) {
      return {
        isValid: false,
        isBlacklisted: false,
        error: error instanceof Error ? error.message : 'Token validation failed'
      };
    }
  }
}