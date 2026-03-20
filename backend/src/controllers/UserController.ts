import { Response } from 'express';
import { UserService } from '../services/UserService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  GetAllUsersRequest,
  GetAllUsersResponse,
  GetAllUsersResponseData,
  CreateUserRequest,
  CreateUserRequestBody,
  CreateUserResponse,
  DeleteUserRequest,
  DeleteUserResponse,
  UpdatePasswordRequest,
  UpdatePasswordRequestBody,
  UpdatePasswordResponse,
  LoginRequest,
  LoginRequestBody,
  LoginResponse,
  SearchUsersRequest,
  SearchUsersQuery,
  SearchUsersResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  BlockUserRequest,
  BlockUserResponse,
  UnblockUserRequest,
  UnblockUserResponse,
  LogoutRequest,
  LogoutResponse,
  isValidBooleanString,
  createApiResponse
} from '../types/api';
import { SearchUsersServiceRequest, LogoutServiceRequest, UpdatePasswordServiceRequest } from '../types/services';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * GET /api/users
   * List all registered active users
   */
  getAllUsers = asyncHandler(async (req: GetAllUsersRequest, res: Response<GetAllUsersResponse>): Promise<void> => {
    const users = await this.userService.getAllActiveUsers();

    const getAllUsersResponseData: GetAllUsersResponseData = {
      users: users,
      count: users.length
    };

    res.status(200).json(createApiResponse(
      true,
      'Users retrieved successfully',
      getAllUsersResponseData
    ));
  });

  /**
   * POST /api/users
   * User registration with first access password (expired)
   */
  createUser = asyncHandler(async (req: CreateUserRequest, res: Response<CreateUserResponse>): Promise<void> => {
    const createUserRequest: CreateUserRequestBody = req.body;

    const userData = await this.userService.createUser(createUserRequest);

    res.status(201).json(createApiResponse(
      true,
      'User created successfully',
      userData
    ));
  });

  /**
   * DELETE /api/users/:id
   * User deletion (soft delete)
   */
  deleteUser = asyncHandler(async (req: DeleteUserRequest, res: Response<DeleteUserResponse>): Promise<void> => {
    const userId: string = req.params.id;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    const success = await this.userService.deleteUser(userId);

    if (success) {
      res.status(200).json(createApiResponse(
        true,
        'User deleted successfully'
      ));
    } else {
      throw createError('Failed to delete user', 500);
    }
  });

  /**
   * PATCH /api/users/:id/password
   * Expired password update
   */
  updatePassword = asyncHandler(async (req: UpdatePasswordRequest, res: Response<UpdatePasswordResponse>): Promise<void> => {
    const userId: string = req.params.id;
    const updatePasswordRequest: UpdatePasswordRequestBody = req.body;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    if (!updatePasswordRequest.password) {
      throw createError('Password is required', 400);
    }

    if (!updatePasswordRequest.newPassword) {
      throw createError('New password is required', 400);
    }

    const updatePasswordServiceRequest: UpdatePasswordServiceRequest = {
      userId,
      password: updatePasswordRequest.password,
      newPassword: updatePasswordRequest.newPassword
    };

    await this.userService.updatePassword(updatePasswordServiceRequest);

    res.status(200).json(createApiResponse(true, 'Password updated successfully'));
  });

  /**
   * POST /api/users/login
   * Login with JWT token generation
   */
  login = asyncHandler(async (req: LoginRequest, res: Response<LoginResponse>): Promise<void> => {
    const loginRequest: LoginRequestBody = req.body;

    if (!loginRequest.userId || !loginRequest.password) {
      throw createError('userId and password are required', 400);
    }

    const loginResponseData = await this.userService.login(loginRequest);

    res.status(200).json(createApiResponse(
      true,
      'Login successful',
      loginResponseData
    ));
  });

  /**
   * GET /api/users/search
   * Advanced user search with multiple criteria
   */
  searchUsers = asyncHandler(async (req: SearchUsersRequest, res: Response<SearchUsersResponse>): Promise<void> => {
    const { 
      searchTerm, 
      isBlocked,
      page = '1', 
      limit = '50' 
    }: SearchUsersQuery = req.query;

    // Parse and validate pagination parameters
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;

    // Validate isBlocked parameter
    if (isBlocked && !isValidBooleanString(isBlocked)) {
      throw createError('isBlocked must be true or false if provided', 400);
    }
    
    const searchRequest: SearchUsersServiceRequest = {
      searchTerm,
      isBlocked: isBlocked ? isBlocked.toLowerCase() === 'true' : undefined,
      page: pageNum,
      limit: Math.min(limitNum, 100) // Max 100
    };

    const searchResponseData = await this.userService.searchUsers(searchRequest);

    res.status(200).json(createApiResponse(
      true,
      'User search completed successfully',
      searchResponseData
    ));
  });

  /**
   * POST /api/users/:id/reset-password
   * Force password reset
   */
  resetPassword = asyncHandler(async (req: ResetPasswordRequest, res: Response<ResetPasswordResponse>): Promise<void> => {
    const userId: string = req.params.id;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    const resetPasswordResponseData = await this.userService.resetUserPassword(userId);

    res.status(200).json(createApiResponse(
      true,
      'Password reset successfully',
      resetPasswordResponseData
    ));
  });

  /**
   * POST /api/users/:id/block
   * Block a user temporarily
   */
  blockUser = asyncHandler(async (req: BlockUserRequest, res: Response<BlockUserResponse>): Promise<void> => {
    const userId: string = req.params.id;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    await this.userService.blockUser(userId);

    res.status(200).json(createApiResponse(
      true,
      `User ${userId} has been blocked successfully`
    ));
  });

  /**
   * POST /api/users/:id/unblock
   * Unblock a user
   */
  unblockUser = asyncHandler(async (req: UnblockUserRequest, res: Response<UnblockUserResponse>): Promise<void> => {
    const userId: string = req.params.id;

    if (!userId) {
      throw createError('User ID is required', 400);
    }

    await this.userService.unblockUser(userId);

    res.status(200).json(createApiResponse(
      true,
      `User ${userId} has been unblocked successfully`
    ));
  });

  /**
   * POST /api/users/profile/logout
   * Logout and blacklist JWT token
   */
  logout = asyncHandler(async (req: LogoutRequest, res: Response<LogoutResponse>): Promise<void> => {
    const token = req.token;
    if (!token) {
      throw createError('Token is required', 401);
    }
    const userId = req.user?.userId;
    if (!userId) {
      throw createError('User authentication required', 401);
    }

    const logoutServiceRequest: LogoutServiceRequest = { token, userReference: userId };

    await this.userService.logout(logoutServiceRequest);

    res.status(200).json(createApiResponse(
      true,
      'Logged out successfully'
    ));
  });
}