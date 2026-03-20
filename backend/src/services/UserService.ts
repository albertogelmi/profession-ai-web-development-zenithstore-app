import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/mysql/UserRepository';
import { User } from '../entities/mysql/User';
import { generateToken, JwtPayload } from '../utils/jwt';
import { createError } from '../middleware/errorHandler';
import { errorEmitter } from '../utils/errorEmitter';
import { JwtBlacklistService } from './JwtBlacklistService';
import {
  CreateUserRequestBody,
  CreateUserResponseData,
  LoginRequestBody,
  LoginResponseData,
  SearchUsersResponseData,
  ResetPasswordResponseData
} from '../types/api';
import {
  UpdatePasswordServiceRequest,
  LogoutServiceRequest,
  SearchUsersServiceRequest
} from '../types/services';

export class UserService {
  private userRepository: UserRepository;
  private jwtBlacklistService: JwtBlacklistService;
  private readonly SALT_ROUNDS = 12;

  constructor() {
    this.userRepository = new UserRepository();
    this.jwtBlacklistService = new JwtBlacklistService();
  }
  
  /**
   * List all active users
   */
  async getAllActiveUsers(): Promise<User[]> {
    try {
      return await this.userRepository.findAllActive();
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.getAllActiveUsers',
      });
      throw error;
    }
  }

  /**
   * User registration with first access password already expired
   */
  async createUser(userData: CreateUserRequestBody): Promise<CreateUserResponseData> {
    try {
      // Input validation
      this.validateUserData(userData);

      // Verify that the ID doesn't already exist
      const existingUser = await this.userRepository.existsActiveUserId(userData.id);
      if (existingUser) {
        throw createError(`User with ID '${userData.id}' already exists`, 409);
      }

      // Generate a random password
      const password = Math.random().toString(36).slice(-8);
      // Hash the password
      const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Create user and credentials
      const user = await this.userRepository.createUserWithCredential(
        {
          id: userData.id,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isActive: true,
          isBlocked: false
        },
        passwordHash
      );

      return {
        user,
        password
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.createUser'
      });
      throw error;
    }
  }

  /**
   * User deletion (soft delete)
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      // Verify that the user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        console.error(`User with ID '${userId}' not found for deletion`);
        throw createError('User not found', 404);
      }

      // Soft delete of user and their credentials
      return await this.userRepository.softDelete(userId);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.deleteUser'
      });
      throw error;
    }
  }

  /**
   * Password update
   */
  async updatePassword(data: UpdatePasswordServiceRequest): Promise<void> {
    try {
      // Find the user and their active credential
      const userWithCredential = await this.userRepository.findUserWithActiveCredential(data.userId);
      if (!userWithCredential || !userWithCredential.credential) {
        throw createError('User or credential not found', 404);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, userWithCredential.credential.passwordHash);
      if (!isPasswordValid) {
        throw createError('Invalid credentials', 401);
      }

      // Validate new password
      this.validatePassword(data.newPassword);

      // Hash new password
      const newPasswordHash = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS);

      // Create new active credential
      await this.userRepository.createCredential({
        userId: data.userId,
        passwordHash: newPasswordHash,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)) // Expires in 3 months
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.updateExpiredPassword'
      });
      throw error;
    }
  }

  /**
   * Login with JWT token generation
   */
  async login(loginData: LoginRequestBody): Promise<LoginResponseData> {
    try {
      // Find the user and their active credential
      const userWithCredential = await this.userRepository.findUserWithActiveCredential(loginData.userId);
      if (!userWithCredential || !userWithCredential.credential) {
        throw createError('Invalid credentials', 401);
      }

      const user = userWithCredential;
      const credential = userWithCredential.credential;

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, credential.passwordHash);
      if (!isPasswordValid) {
        throw createError('Invalid credentials', 401);
      }

      // Check if user is blocked
      if (user.isBlocked) {
        throw createError('Account is temporarily blocked. Contact administrator.', 403);
      }

      // Check if the password is expired
      const now = new Date();
      const passwordExpired = credential.endDate <= now;

      if (passwordExpired) {
        throw createError('Password expired. Please update your password.', 401);
      }

      // Generate JWT token
      const tokenPayload: Omit<JwtPayload, 'iat' | 'exp'> = {
        userId: user.id,
        role: 'user',
        firstName: user.firstName,
        lastName: user.lastName
      };

      const token = generateToken(tokenPayload);

      // Calculate token expiry (3h from now)
      const tokenExpiry = new Date();
      tokenExpiry.setHours(tokenExpiry.getHours() + 3);

      return {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive
        },
        token,
        tokenExpiry
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.login'
      });
      throw error;
    }
  }

  /**
   * User data validation
   */
  private validateUserData(userData: CreateUserRequestBody): void {
    if (!userData.id || userData.id.trim().length === 0) {
      throw createError('User ID is required', 400);
    }

    if (userData.id.trim().length > 15) {
      throw createError('User ID must be at most 15 characters long', 400);
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(userData.id.trim())) {
      throw createError('User ID can only contain letters, numbers, underscores and hyphens', 400);
    }

    if (!userData.firstName || userData.firstName.trim().length < 2) {
      throw createError('First name must be at least 2 characters long', 400);
    }

    if (!userData.lastName || userData.lastName.trim().length < 2) {
      throw createError('Last name must be at least 2 characters long', 400);
    }

    userData.id = userData.id.trim();
    userData.firstName = userData.firstName.trim();
    userData.lastName = userData.lastName.trim();
  }

  /**
   * Password validation
   */
  private validatePassword(password: string): void {
    if (!password || password.length < 8) {
      throw createError('Password must be at least 8 characters long', 400);
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw createError('Password must contain at least one lowercase letter, one uppercase letter, and one number', 400);
    }
  }

  /**
   * Advanced user search with multiple criteria
   */
  async searchUsers(searchRequest: SearchUsersServiceRequest): Promise<SearchUsersResponseData> { 
    try {
      // Validate search parameters
      this.validateSearchParams(searchRequest);

      // Normalize pagination parameters
      const page = searchRequest.page || 1;
      const limit = Math.min(searchRequest.limit || 50, 100); // Max 100 results per page
      const offset = (page - 1) * limit;

      const { users, total } = await this.userRepository.searchUsers(
        searchRequest.searchTerm?.trim() || '',
        searchRequest.isBlocked,
        limit,
        offset
      );

      const totalPages = Math.ceil(total / limit);

      return {
        items: users,
        total,
        page,
        totalPages
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.searchUsers'
      });
      throw error;
    }
  }

  /**
   * Search parameters validation
   */
  private validateSearchParams(searchRequest: SearchUsersServiceRequest): void {
    if (searchRequest.limit !== undefined) {
      if (!Number.isInteger(searchRequest.limit) || searchRequest.limit <= 0) {
        throw createError('Limit must be a positive integer', 400);
      }
      if (searchRequest.limit > 100) {
        throw createError('Limit cannot exceed 100', 400);
      }
    }

    if (searchRequest.page !== undefined) {
      if (!Number.isInteger(searchRequest.page) || searchRequest.page < 1) {
        throw createError('Page must be a positive integer', 400);
      }
    }

    // Verify that at least one search criterion is specified
    if (!searchRequest.searchTerm && 
        searchRequest.isBlocked === undefined) {
      throw createError('At least one search criterion must be specified', 400);
    }
  }

  /**
   * Force password reset for a user
   */
  async resetUserPassword(userId: string): Promise<ResetPasswordResponseData> {
    try {
      // Verify user exists and is active
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      if (user.isBlocked) {
        throw createError('Cannot reset password for blocked user', 403);
      }

      // Generate new random password
      const newPassword = Math.random().toString(36).slice(-8);
      
      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Reset password through repository
      await this.userRepository.resetPassword(userId, newPasswordHash);

      return {
        newPassword 
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.resetUserPassword'
      });
      throw error;
    }
  }

  /**
   * Block a user temporarily
   */
  async blockUser(userId: string): Promise<void> {
    try {
      // Verify user exists and is active
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      if (user.isBlocked) {
        throw createError('User is already blocked', 400);
      }

      await this.userRepository.blockUser(userId);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.blockUser'
      });
      throw error;
    }
  }

  /**
   * Unblock a user
   */
  async unblockUser(userId: string): Promise<void> {
    try {
      // Verify user exists
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw createError('User not found', 404);
      }

      if (!user.isBlocked) {
        throw createError('User is not blocked', 400);
      }

      await this.userRepository.unblockUser(userId);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.unblockUser'
      });
      throw error;
    }
  }

  /**
   * Logout and blacklist JWT token
   */
  async logout(logoutRequest: LogoutServiceRequest): Promise<void> {
    try {
      await this.jwtBlacklistService.blacklistToken({
        token: logoutRequest.token,
        userReference: logoutRequest.userReference,
        userType: 'user',
        reason: 'User logout'
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'UserService.logout'
      });
      throw error;
    }
  }
}