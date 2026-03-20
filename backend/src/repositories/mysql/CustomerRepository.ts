import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Customer } from '../../entities/mysql/Customer';
import { CustomerCredential } from '../../entities/mysql/CustomerCredential';
import { errorEmitter } from '../../utils/errorEmitter';

export class CustomerRepository {
  private customerRepo: Repository<Customer>;
  private credentialRepo: Repository<CustomerCredential>;

  constructor() {
    this.customerRepo = AppDataSource.getRepository(Customer);
    this.credentialRepo = AppDataSource.getRepository(CustomerCredential);
  }

  /**
   * Find all active customers
   */
  async findAllActive(): Promise<Customer[]> {
    try {
      return await this.customerRepo.find({
        where: { isActive: true },
        order: { startDate: 'DESC' }
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.findAllActive',
      });
      throw error;
    }
  }

  /**
   * Find an active customer by email
   */
  async findByEmail(email: string): Promise<Customer | null> {
    try {
      return await this.customerRepo.findOne({
        where: { email, isActive: true }
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.findByEmail',
      });
      throw error;
    }
  }

  /**
   * Find an active customer by ID
   */
  async findById(id: number): Promise<Customer | null> {
    try {
      return await this.customerRepo.findOne({ 
        where: { id, isActive: true } 
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.findById',
      });
      throw error;
    }
  }

  /**
   * Soft delete of a customer (sets isActive = false)
   */
  async softDelete(id: number): Promise<boolean> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Deactivate all customer credentials
      await queryRunner.manager.update(CustomerCredential,
        { customerId: id, isActive: true },
        { isActive: false, endDate: new Date() }
      );

      // 2. Soft delete customer
      const result = await queryRunner.manager.update(Customer, id, {
        isActive: false,
        endDate: new Date()
      });

      await queryRunner.commitTransaction();
      return result.affected !== undefined && result.affected > 0;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.softDelete',
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find the active credential of a customer
   */
  async findActiveCredential(customerId: number): Promise<CustomerCredential | null> {
    try {
      return await this.credentialRepo.findOne({
        where: { customerId, isActive: true },
        relations: ['customer']
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.findActiveCredential',
      });
      throw error;
    }
  }

  /**
   * Create a new credential for a customer
   */
  async createCredential(credentialData: Omit<CustomerCredential, 'id' | 'customer'>): Promise<CustomerCredential> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // First deactivate all existing credentials for this customer
      await queryRunner.manager.update(CustomerCredential, 
        { customerId: credentialData.customerId, isActive: true },
        { isActive: false, endDate: new Date() }
      );

      // Create the new credential
      const credential = queryRunner.manager.create(CustomerCredential, {
        ...credentialData
      });
      
      const savedCredential = await queryRunner.manager.save(credential);
      
      await queryRunner.commitTransaction();
      return savedCredential;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.createCredential',
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find a customer with their active credential
   */
  async findCustomerWithActiveCredential(email: string): Promise<(Customer & { credential?: CustomerCredential }) | null> {
    try {
      const customer = await this.customerRepo.findOne({ 
        where: { email, isActive: true } 
      });
      
      if (!customer) return null;

      const credential = await this.findActiveCredential(customer.id);
      
      return {
        ...customer,
        credential: credential || undefined
      };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.findCustomerWithActiveCredential',
      });
      throw error;
    }
  }

  /**
   * Create a new customer with credential
   */
  async createCustomerWithCredential(customerData: Omit<Customer, 'id' | 'startDate'>, passwordHash: string): Promise<Customer> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create the customer
      const customer = queryRunner.manager.create(Customer, {
        ...customerData,
        startDate: new Date()
      });
      const savedCustomer = await queryRunner.manager.save(customer);

      // 2. Create the credential
      const credential = queryRunner.manager.create(CustomerCredential, {
        customerId: savedCustomer.id,
        startDate: new Date(),
        passwordHash,
        isActive: true,
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)) // Expires in 3 months
      });
      await queryRunner.manager.save(credential);

      await queryRunner.commitTransaction();
      return savedCustomer;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.createCustomerWithCredential',
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Advanced customer search with multiple criteria
   */
  async searchCustomers(searchTerm: string, email: string, isBlocked?: boolean, limit: number = 50, offset: number = 0): Promise<{customers: Customer[], total: number}> {
    try {
      const queryBuilder = this.customerRepo.createQueryBuilder('customer')
        .where('customer.isActive = true');

      // Add search term filter
      if (searchTerm) {
        queryBuilder.andWhere(
          '(customer.firstName LIKE :searchTerm OR customer.lastName LIKE :searchTerm)',
          { searchTerm: `%${searchTerm}%` }
        );
      }

      // Add email filter
      if (email) {
        queryBuilder.andWhere('customer.email LIKE :email', { email: `%${email}%` });
      }

      // Add blocked status filter
      if (isBlocked !== undefined) {
        queryBuilder.andWhere('customer.isBlocked = :isBlocked', { isBlocked });
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination and get results
      const customers = await queryBuilder
        .orderBy('customer.startDate', 'DESC')
        .limit(limit)
        .offset(offset)
        .getMany();

      return { customers, total };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.searchCustomers',
      });
      throw error;
    }
  }

  /**
   * Reset customer password by updating credential hash
   */
  async resetPassword(customerId: number, newPasswordHash: string): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Update the credential
      await queryRunner.manager.update(CustomerCredential, 
        { customerId: customerId, isActive: true },
        { 
          isActive: false,
          endDate: new Date()
        }
      );

      // Create new credential with new password
      const newCredential = queryRunner.manager.create(CustomerCredential, {
        customerId: customerId,
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
        path: 'CustomerRepository.resetPassword',
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Block a customer (temporary suspension)
   */
  async blockCustomer(customerId: number): Promise<void> {
    try {
      await this.customerRepo.update(customerId, {
        isBlocked: true
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.blockCustomer',
      });
      throw error;
    }
  }

  /**
   * Unblock a customer
   */
  async unblockCustomer(customerId: number): Promise<void> {
    try {
      await this.customerRepo.update(customerId, {
        isBlocked: false
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CustomerRepository.unblockCustomer',
      });
      throw error;
    }
  }
}