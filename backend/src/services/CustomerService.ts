import bcrypt from 'bcrypt';
import { CustomerRepository } from '../repositories/mysql/CustomerRepository';
import { Customer } from '../entities/mysql/Customer';
import { generateToken, JwtPayload } from '../utils/jwt';
import { createError } from '../middleware/errorHandler';
import { errorEmitter } from '../utils/errorEmitter';
import { JwtBlacklistService } from './JwtBlacklistService';
import {
  CreateCustomerRequestBody,
  CreateCustomerResponseData,
  LoginCustomerRequestBody,
  LoginCustomerResponseData,
  SearchCustomersResponseData,
  ResetPasswordResponseData
} from '../types/api';
import {
  UpdatePasswordCustomerServiceRequest,
  LogoutCustomerServiceRequest,
  SearchCustomersServiceRequest
} from '../types/services';

export class CustomerService {
  private customerRepository: CustomerRepository;
  private jwtBlacklistService: JwtBlacklistService;
  private readonly SALT_ROUNDS = 12;

  constructor() {
    this.customerRepository = new CustomerRepository();
    this.jwtBlacklistService = new JwtBlacklistService();
  }
  
  /**
   * List all active customers
   */
  async getAllActiveCustomers(): Promise<Customer[]> {
    try {
      return await this.customerRepository.findAllActive();
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.getAllActiveCustomers',
      });
      throw error;
    }
  }

  /**
   * Retrieve customer by ID
   */
  async getCustomerById(customerId: number): Promise<Customer | null> {
    try {
      return await this.customerRepository.findById(customerId);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.getCustomerById',
      });
      throw error;
    }
  }

  /**
   * Customer registration
   */
  async createCustomer(customerData: CreateCustomerRequestBody): Promise<CreateCustomerResponseData> {
    try {
      // Verify that the email doesn't already exist
      const activeCustomer = await this.customerRepository.findByEmail(customerData.email);
      if (activeCustomer) {
        throw createError(`Customer with email '${customerData.email}' already exists`, 409);
      }

      // Validate password
      this.validatePassword(customerData.password);
      // Hash the password
      const passwordHash = await bcrypt.hash(customerData.password, this.SALT_ROUNDS);

      // Create customer and credentials
      const customer = await this.customerRepository.createCustomerWithCredential(
        {
          email: customerData.email,
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          isActive: true,
          isBlocked: false
        },
        passwordHash
      );

      return {
        customer
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.createCustomer'
      });
      throw error;
    }
  }

  /**
   * Customer deletion (soft delete)
   */
  async deleteCustomer(customerId: number): Promise<boolean> {
    try {
      // Verify that the customer exists
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        console.error(`Customer with ID '${customerId}' not found for deletion`);
        throw createError('Customer not found', 404);
      }

      // Soft delete of customer and their credentials
      return await this.customerRepository.softDelete(customerId);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.deleteCustomer'
      });
      throw error;
    }
  }

  /**
   * Password update
   */
  async updatePassword(data: UpdatePasswordCustomerServiceRequest): Promise<void> {
    try {
      // Find the customer and their active credential
      const customerWithCredential = await this.customerRepository.findCustomerWithActiveCredential(data.email);
      if (!customerWithCredential || !customerWithCredential.credential) {
        throw createError('Customer or credential not found', 404);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(data.password, customerWithCredential.credential.passwordHash);
      if (!isPasswordValid) {
        throw createError('Invalid credentials', 401);
      }

      // Validate new password
      this.validatePassword(data.newPassword);

      // Hash new password
      const newPasswordHash = await bcrypt.hash(data.newPassword, this.SALT_ROUNDS);

      // Create new active credential
      await this.customerRepository.createCredential({
        customerId: customerWithCredential.id,
        passwordHash: newPasswordHash,
        isActive: true,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)) // Expires in 3 months
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.updateExpiredPassword'
      });
      throw error;
    }
  }

  /**
   * Login with JWT token generation
   */
  async login(loginData: LoginCustomerRequestBody): Promise<LoginCustomerResponseData> {
    try {
      // Find the customer and their active credential
      const customerWithCredential = await this.customerRepository.findCustomerWithActiveCredential(loginData.email);
      if (!customerWithCredential || !customerWithCredential.credential) {
        throw createError('Invalid credentials', 401);
      }

      const customer = customerWithCredential;
      const credential = customerWithCredential.credential;

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, credential.passwordHash);
      if (!isPasswordValid) {
        throw createError('Invalid credentials', 401);
      }

      // Check if customer is blocked
      if (customer.isBlocked) {
        throw createError('Account is temporarily blocked. Contact administrator.', 403);
      }

      // Check if the password is expired
      const now = new Date();
      const passwordExpired = credential.endDate <= now;

      if (passwordExpired) {
        throw createError('Password expired. Please update your password.', 401);
      }

      return {
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          isActive: customer.isActive
        }
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.login'
      });
      throw error;
    }
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
   * Advanced customer search with multiple criteria
   */
  async searchCustomers(searchRequest: SearchCustomersServiceRequest): Promise<SearchCustomersResponseData> { 
    try {
      // Validate search parameters
      this.validateSearchParams(searchRequest);

      // Normalize pagination parameters
      const page = searchRequest.page || 1;
      const limit = Math.min(searchRequest.limit || 50, 100); // Max 100 results per page
      const offset = (page - 1) * limit;

      const { customers, total } = await this.customerRepository.searchCustomers(
        searchRequest.searchTerm?.trim() || '',
        searchRequest.email?.trim() || '',
        searchRequest.isBlocked,
        limit,
        offset
      );

      const totalPages = Math.ceil(total / limit);

      return {
        items: customers,
        total,
        page,
        totalPages
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.searchCustomers'
      });
      throw error;
    }
  }

  /**
   * Search parameters validation
   */
  private validateSearchParams(searchRequest: SearchCustomersServiceRequest): void {
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
        !searchRequest.email &&
        searchRequest.isBlocked === undefined) {
      throw createError('At least one search criterion must be specified', 400);
    }
  }

  /**
   * Force password reset for a customer
   */
  async resetCustomerPassword(email: string): Promise<ResetPasswordResponseData> {
    try {
      // Verify customer exists and is active
      const customer = await this.customerRepository.findByEmail(email);
      if (!customer) {
        throw createError('Customer not found', 404);
      }

      if (customer.isBlocked) {
        throw createError('Cannot reset password for blocked customer', 403);
      }

      // Generate new random password
      const newPassword = Math.random().toString(36).slice(-8);
      
      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Reset password through repository
      await this.customerRepository.resetPassword(customer.id, newPasswordHash);

      return {
        newPassword 
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.resetCustomerPassword'
      });
      throw error;
    }
  }

  /**
   * Block a customer temporarily
   */
  async blockCustomer(customerId: number): Promise<void> {
    try {
      // Verify customer exists and is active
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw createError('Customer not found', 404);
      }

      if (customer.isBlocked) {
        throw createError('Customer is already blocked', 400);
      }

      await this.customerRepository.blockCustomer(customerId);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.blockCustomer'
      });
      throw error;
    }
  }

  /**
   * Unblock a customer
   */
  async unblockCustomer(customerId: number): Promise<void> {
    try {
      // Verify customer exists
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw createError('Customer not found', 404);
      }

      if (!customer.isBlocked) {
        throw createError('Customer is not blocked', 400);
      }

      await this.customerRepository.unblockCustomer(customerId);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.unblockCustomer'
      });
      throw error;
    }
  }

  /**
   * Logout and blacklist JWT token
   */
  async logout(logoutRequest: LogoutCustomerServiceRequest): Promise<void> {
    try {
      await this.jwtBlacklistService.blacklistToken({
        token: logoutRequest.token,
        userReference: logoutRequest.customerReference,
        userType: 'customer',
        reason: 'Customer logout'
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CustomerService.logout'
      });
      throw error;
    }
  }
}