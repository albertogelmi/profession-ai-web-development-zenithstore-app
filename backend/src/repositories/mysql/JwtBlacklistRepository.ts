import { Repository, MoreThan, LessThan } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { JwtBlacklist } from '../../entities/mysql/JwtBlacklist';
import { errorEmitter } from '../../utils/errorEmitter';
import { BlacklistTokenRepositoryRequest } from '../../types/repositories';

export class JwtBlacklistRepository {
  private blacklistRepo: Repository<JwtBlacklist>;

  constructor() {
    this.blacklistRepo = AppDataSource.getRepository(JwtBlacklist);
  }

  /**
   * Add JWT token to blacklist
   */
  async addToBlacklist(request: BlacklistTokenRepositoryRequest): Promise<void> {
    try {
      const blacklistEntry = this.blacklistRepo.create({
        tokenJti: request.tokenJti,
        userReference: request.userReference,
        userType: request.userType,
        expiresAt: request.expiresAt,
        invalidatedAt: new Date(),
        reason: request.reason
      });

      await this.blacklistRepo.save(blacklistEntry);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'JwtBlacklistRepository.addToBlacklist',
      });
      throw error;
    }
  }

  /**
   * Check if JWT token is blacklisted
   */
  async isTokenBlacklisted(tokenJti: string): Promise<boolean> {
    try {
      const count = await this.blacklistRepo.count({
        where: {
          tokenJti: tokenJti,
          expiresAt: MoreThan(new Date())
        }
      });

      return count > 0;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'JwtBlacklistRepository.isTokenBlacklisted',
      });
      throw error;
    }
  }

  /**
   * Cleanup expired blacklist entries
   */
  async cleanupExpiredEntries(): Promise<number> {
    try {
      const result = await this.blacklistRepo.delete({
        expiresAt: LessThan(new Date())
      });

      return result.affected || 0;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'JwtBlacklistRepository.cleanupExpiredEntries',
      });
      throw error;
    }
  }
}