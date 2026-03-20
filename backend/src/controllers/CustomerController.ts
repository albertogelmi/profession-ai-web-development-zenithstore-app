import { Response } from 'express';
import { CustomerService } from '../services/CustomerService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  GetAllCustomersRequest,
  GetAllCustomersResponse,
  GetAllCustomersResponseData,
  GetCustomerByIdRequest,
  GetCustomerByIdResponse,
  CreateCustomerRequest,
  CreateCustomerRequestBody,
  CreateCustomerResponse,
  DeleteCustomerRequest,
  DeleteCustomerResponse,
  UpdatePasswordCustomerRequest,
  UpdatePasswordCustomerRequestBody,
  UpdatePasswordCustomerResponse,
  LoginCustomerRequest,
  LoginCustomerRequestBody,
  LoginCustomerResponse,
  SearchCustomersRequest,
  SearchCustomersQuery,
  SearchCustomersResponse,
  ResetPasswordCustomerRequest,
  ResetPasswordCustomerRequestBody,
  ResetPasswordCustomerResponse,
  BlockCustomerRequest,
  BlockCustomerResponse,
  UnblockCustomerRequest,
  UnblockCustomerResponse,
  LogoutCustomerRequest,
  LogoutCustomerResponse,
  isValidBooleanString,
  createApiResponse
} from '../types/api';
import { SearchCustomersServiceRequest, LogoutCustomerServiceRequest } from '../types/services';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  /**
   * GET /api/customers
   * List all registered active customers
   */
  getAllCustomers = asyncHandler(async (req: GetAllCustomersRequest, res: Response<GetAllCustomersResponse>): Promise<void> => {
    const customers = await this.customerService.getAllActiveCustomers();

    const getAllCustomersResponseData: GetAllCustomersResponseData = {
      customers: customers,
      count: customers.length
    };

    res.status(200).json(createApiResponse(
      true,
      'Customers retrieved successfully',
      getAllCustomersResponseData
    ));
  });

  /**
   * GET /api/customers/profile
   * Get specific customer details
   */
  getCustomerById = asyncHandler(async (req: GetCustomerByIdRequest, res: Response<GetCustomerByIdResponse>): Promise<void> => {
    const token = req.token;
    if (!token) {
      throw createError('Token is required', 401);
    }
    const customerId = req.user?.userId;
    if (!customerId) {
      throw createError('Customer authentication required', 401);
    }

    const customer = await this.customerService.getCustomerById(parseInt(customerId));

    if (!customer) {
      throw createError('Customer not found', 404);
    }

    res.status(200).json(createApiResponse(
      true,
      'Customer retrieved successfully',
      customer
    ));
  });

  /**
   * POST /api/customers
   * Customer registration
   */
  createCustomer = asyncHandler(async (req: CreateCustomerRequest, res: Response<CreateCustomerResponse>): Promise<void> => {
    const createCustomerRequest: CreateCustomerRequestBody = req.body;

    // Input validation
    this.validateCustomerData(createCustomerRequest);

    const customerData = await this.customerService.createCustomer(createCustomerRequest);

    res.status(201).json(createApiResponse(
      true,
      'Customer created successfully',
      customerData
    ));
  });

  /**
     * User data validation
     */
  private validateCustomerData(createCustomerRequest: CreateCustomerRequestBody): void {
    if (!createCustomerRequest.email) {
      throw createError('Email is required', 400);
    }
    const emailRegex = /^[A-Za-z0-9._-]{2,}@[A-Za-z0-9._-]{2,}\.[A-Za-z0-9._-]{2,}$/;
    if (!emailRegex.test(createCustomerRequest.email.trim())) {
      throw createError('Invalid email format', 400);
    }

    if (!createCustomerRequest.firstName || createCustomerRequest.firstName.trim().length < 2) {
      throw createError('First name must be at least 2 characters long', 400);
    }

    if (!createCustomerRequest.lastName || createCustomerRequest.lastName.trim().length < 2) {
      throw createError('Last name must be at least 2 characters long', 400);
    }

    if (!createCustomerRequest.password || createCustomerRequest.password.length < 8) {
      throw createError('Password must be at least 8 characters long', 400);
    }

    createCustomerRequest.email = createCustomerRequest.email.trim();
    createCustomerRequest.firstName = createCustomerRequest.firstName.trim();
    createCustomerRequest.lastName = createCustomerRequest.lastName.trim();
  }

  /**
   * DELETE /api/customers/profile
   * Customer deletion (soft delete)
   */
  deleteCustomer = asyncHandler(async (req: DeleteCustomerRequest, res: Response<DeleteCustomerResponse>): Promise<void> => {
    const token = req.token;
    if (!token) {
      throw createError('Token is required', 401);
    }
    const customerId = req.user?.userId;
    if (!customerId) {
      throw createError('Customer authentication required', 401);
    }

    const success = await this.customerService.deleteCustomer(parseInt(customerId));

    if (success) {
      res.status(200).json(createApiResponse(
        true,
        'Customer deleted successfully'
      ));
    } else {
      throw createError('Failed to delete customer', 500);
    }
  });

  /**
   * PATCH /api/customers/password
   * Password update
   */
  updatePassword = asyncHandler(async (req: UpdatePasswordCustomerRequest, res: Response<UpdatePasswordCustomerResponse>): Promise<void> => {
    const updatePasswordCustomerRequest: UpdatePasswordCustomerRequestBody = req.body;

    if (!updatePasswordCustomerRequest.email) {
      throw createError('Email is required', 400);
    }

    if (!updatePasswordCustomerRequest.password) {
      throw createError('Password is required', 400);
    }

    if (!updatePasswordCustomerRequest.newPassword) {
      throw createError('New password is required', 400);
    }

    await this.customerService.updatePassword({
      email: updatePasswordCustomerRequest.email,
      password: updatePasswordCustomerRequest.password,
      newPassword: updatePasswordCustomerRequest.newPassword
    });

    res.status(200).json(createApiResponse(true, 'Password updated successfully'));
  });

  /**
   * POST /api/customers/login
   * Login with JWT token generation
   */
  login = asyncHandler(async (req: LoginCustomerRequest, res: Response<LoginCustomerResponse>): Promise<void> => {
    const loginCustomerRequest: LoginCustomerRequestBody = req.body;

    if (!loginCustomerRequest.email || !loginCustomerRequest.password) {
      throw createError('Email and password are required', 400);
    }

    const loginResponseData = await this.customerService.login(loginCustomerRequest);

    res.status(200).json(createApiResponse(
      true,
      'Login successful',
      loginResponseData
    ));
  });

  /**
   * GET /api/customers/search
   * Advanced customer search with multiple criteria
   */
  searchCustomers = asyncHandler(async (req: SearchCustomersRequest, res: Response<SearchCustomersResponse>): Promise<void> => {
    const { 
      searchTerm,
      email,
      isBlocked,
      page = '1', 
      limit = '50' 
    }: SearchCustomersQuery = req.query;

    // Parse and validate pagination parameters
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;

    // Validate isBlocked parameter
    if (isBlocked && !isValidBooleanString(isBlocked)) {
      throw createError('isBlocked must be true or false if provided', 400);
    }
    
    const searchRequest: SearchCustomersServiceRequest = {
      searchTerm,
      email,
      isBlocked: isBlocked ? isBlocked.toLowerCase() === 'true' : undefined,
      page: pageNum,
      limit: Math.min(limitNum, 100) // Max 100
    };

    const searchResponseData = await this.customerService.searchCustomers(searchRequest);

    res.status(200).json(createApiResponse(
      true,
      'Customer search completed successfully',
      searchResponseData
    ));
  });

  /**
   * POST /api/customers/reset-password
   * Force password reset
   */
  resetPassword = asyncHandler(async (req: ResetPasswordCustomerRequest, res: Response<ResetPasswordCustomerResponse>): Promise<void> => {
    const resetPasswordCustomerRequest: ResetPasswordCustomerRequestBody = req.body;

    if (!resetPasswordCustomerRequest.email) {
      throw createError('Email is required', 400);
    }

    const resetPasswordResponseData = await this.customerService.resetCustomerPassword(resetPasswordCustomerRequest.email);

    res.status(200).json(createApiResponse(
      true,
      'Password reset successfully',
      resetPasswordResponseData
    ));
  });

  /**
   * POST /api/customers/:id/block
   * Block a customer temporarily
   */
  blockCustomer = asyncHandler(async (req: BlockCustomerRequest, res: Response<BlockCustomerResponse>): Promise<void> => {
    const customerId: number = req.params.id;

    if (!customerId) {
      throw createError('Customer ID is required', 400);
    }

    await this.customerService.blockCustomer(customerId);

    res.status(200).json(createApiResponse(
      true,
      `Customer ${customerId} has been blocked successfully`
    ));
  });

  /**
   * POST /api/customers/:id/unblock
   * Unblock a customer
   */
  unblockCustomer = asyncHandler(async (req: UnblockCustomerRequest, res: Response<UnblockCustomerResponse>): Promise<void> => {
    const customerId: number = req.params.id;

    if (!customerId) {
      throw createError('Customer ID is required', 400);
    }

    await this.customerService.unblockCustomer(customerId);

    res.status(200).json(createApiResponse(
      true,
      `Customer ${customerId} has been unblocked successfully`
    ));
  });

  /**
   * POST /api/customers/profile/logout
   * Logout and blacklist JWT token
   */
  logout = asyncHandler(async (req: LogoutCustomerRequest, res: Response<LogoutCustomerResponse>): Promise<void> => {
    const token = req.token;
    if (!token) {
      throw createError('Token is required', 401);
    }
    const customerId = req.user?.userId;
    if (!customerId) {
      throw createError('Customer authentication required', 401);
    }

    const logoutCustomerServiceRequest: LogoutCustomerServiceRequest = { token, customerReference: customerId };

    await this.customerService.logout(logoutCustomerServiceRequest);

    res.status(200).json(createApiResponse(
      true,
      'Logged out successfully'
    ));
  });
}