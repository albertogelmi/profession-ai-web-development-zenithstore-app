import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { User } from '../../entities/mysql/User';
import { UserCredential } from '../../entities/mysql/UserCredential';
import { errorEmitter } from '../../utils/errorEmitter';

export class UserRepository {
  private userRepo: Repository<User>;
  private credentialRepo: Repository<UserCredential>;

  constructor() {
    this.userRepo = AppDataSource.getRepository(User);
    this.credentialRepo = AppDataSource.getRepository(UserCredential);
  }

  /**
   * Find all active users
   */
  async findAllActive(): Promise<User[]> {
    try {
      return await this.userRepo.find({
        where: { isActive: true },
        order: { startDate: 'DESC' }
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.findAllActive',
      });
      throw error;
    }
  }

  /**
   * Verify if an active user with the specified ID already exists
   */
  async existsActiveUserId(id: string): Promise<boolean> {
    try {
      const count = await this.userRepo.count({
        where: { id, isActive: true }
      });
      return count > 0;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.existsActiveUserId',
      });
      throw error;
    }
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      return await this.userRepo.findOne({ 
        where: { id, isActive: true } 
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.findById',
      });
      throw error;
    }
  }

  /**
   * Soft delete of a user (sets isActive = false)
   */
  async softDelete(id: string): Promise<boolean> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Deactivate all user credentials
      await queryRunner.manager.update(UserCredential,
        { userId: id, isActive: true },
        { isActive: false, endDate: new Date() }
      );

      // 2. Soft delete the user
      const result = await queryRunner.manager.update(User, id, {
        isActive: false,
        endDate: new Date()
      });

      await queryRunner.commitTransaction();
      return result.affected !== undefined && result.affected > 0;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.softDelete',
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find the active credential of a user
   */
  async findActiveCredential(userId: string): Promise<UserCredential | null> {
    try {
      return await this.credentialRepo.findOne({
        where: { userId, isActive: true },
        relations: ['user']
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.findActiveCredential',
      });
      throw error;
    }
  }

  /**
   * Create a new credential for a user
   */
  async createCredential(credentialData: Omit<UserCredential, 'id' | 'user'>): Promise<UserCredential> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // First deactivate all existing credentials for this user
      await queryRunner.manager.update(UserCredential, 
        { userId: credentialData.userId, isActive: true },
        { isActive: false, endDate: new Date() }
      );

      // Create the new credential
      const credential = queryRunner.manager.create(UserCredential, {
        ...credentialData
      });
      
      const savedCredential = await queryRunner.manager.save(credential);
      
      await queryRunner.commitTransaction();
      return savedCredential;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.createCredential',
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find a user with their active credential
   */
  async findUserWithActiveCredential(userId: string): Promise<(User & { credential?: UserCredential }) | null> {
    try {
      const user = await this.userRepo.findOne({ 
        where: { id: userId, isActive: true } 
      });
      
      if (!user) return null;

      const credential = await this.findActiveCredential(userId);
      
      return {
        ...user,
        credential: credential || undefined
      };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.findUserWithActiveCredential',
      });
      throw error;
    }
  }

  /**
   * Create a new user with credential in atomic transaction
   */
  async createUserWithCredential(userData: Omit<User, 'startDate'>, passwordHash: string): Promise<User> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create the user
      const user = queryRunner.manager.create(User, {
        ...userData,
        startDate: new Date()
      });
      const savedUser = await queryRunner.manager.save(user);

      // 2. Create the credential
      const credential = queryRunner.manager.create(UserCredential, {
        userId: savedUser.id,
        startDate: new Date(),
        passwordHash,
        isActive: true,
        endDate: new Date()
      });
      await queryRunner.manager.save(credential);

      await queryRunner.commitTransaction();
      return savedUser;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.createUserWithCredential',
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Advanced user search with multiple criteria
   */
  async searchUsers(searchTerm: string, isBlocked?: boolean, limit: number = 50, offset: number = 0): Promise<{users: User[], total: number}> {
    try {
      const queryBuilder = this.userRepo.createQueryBuilder('user')
        .where('user.isActive = true');

      // Add search term filter
      if (searchTerm) {
        queryBuilder.andWhere(
          '(user.firstName LIKE :searchTerm OR user.lastName LIKE :searchTerm)',
          { searchTerm: `%${searchTerm}%` }
        );
      }

      // Add blocked status filter
      if (isBlocked !== undefined) {
        queryBuilder.andWhere('user.isBlocked = :isBlocked', { isBlocked });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination and get results
      const users = await queryBuilder
        .orderBy('user.startDate', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany();

      return { users, total };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.searchUsers',
      });
      throw error;
    }
  }

  /**
   * Reset user password by updating credential hash
   */
  async resetPassword(userId: string, newPasswordHash: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update the credential
      await queryRunner.manager.update(UserCredential, 
        { userId: userId, isActive: true },
        { 
          isActive: false,
          endDate: new Date()
        }
      );

      // Create new credential with new password
      const newCredential = queryRunner.manager.create(UserCredential, {
        userId: userId,
        startDate: new Date(),
        passwordHash: newPasswordHash,
        isActive: true,
        endDate: new Date()
      });
      await queryRunner.manager.save(newCredential);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.resetPassword',
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Block a user (temporary suspension)
   */
  async blockUser(userId: string): Promise<void> {
    try {
      await this.userRepo.update(userId, {
        isBlocked: true
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.blockUser',
      });
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      await this.userRepo.update(userId, {
        isBlocked: false
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'UserRepository.unblockUser',
      });
      throw error;
    }
  }
}