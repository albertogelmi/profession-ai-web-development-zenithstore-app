import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { CustomerWishlist } from '../../entities/mysql/CustomerWishlist';
import { ProductMaster } from '../../entities/mysql/ProductMaster';
import { ProductVersion } from '../../entities/mysql/ProductVersion';
import { errorEmitter } from '../../utils/errorEmitter';
import { createError } from '../../middleware/errorHandler';
import {
  AddToWishlistRepositoryRequest,
  WishlistItemWithProduct,
} from '../../types/repositories';

/**
 * Repository for managing CustomerWishlist entities
 * Handles database operations for customer wishlist management
 */
export class WishlistRepository {
  private wishlistRepo: Repository<CustomerWishlist>;
  private productMasterRepo: Repository<ProductMaster>;
  private productVersionRepo: Repository<ProductVersion>;

  constructor() {
    this.wishlistRepo = AppDataSource.getRepository(CustomerWishlist);
    this.productMasterRepo = AppDataSource.getRepository(ProductMaster);
    this.productVersionRepo = AppDataSource.getRepository(ProductVersion);
  }

  /**
   * Find all wishlist items for a specific customer with product details
   * @param customerId - Customer ID
   * @returns Array of wishlist items with product information
   */
  async findByCustomerId(customerId: number): Promise<WishlistItemWithProduct[]> {
    try {
      const wishlistItems = await this.wishlistRepo
        .createQueryBuilder('wl')
        .leftJoinAndSelect('wl.product', 'pm')
        .leftJoin(
          'product_version',
          'pv',
          'pv.product_master_id = pm.id AND pv.is_current = 1'
        )
        .select([
          'wl.id as id',
          'wl.customer_id as customerId',
          'wl.product_code as productCode',
          'wl.added_at as addedAt',
          'pm.id as productMasterId',
          'pm.product_code as productCode',
          'pv.name as productName',
          'pv.description as productDescription',
          'pv.price as productPrice',
          'pv.is_active as productIsActive',
        ])
        .where('wl.customer_id = :customerId', { customerId })
        .andWhere('pv.is_active = 1')
        .orderBy('wl.added_at', 'DESC')
        .getRawMany();

      return wishlistItems.map((item) => ({
        id: item.id,
        customerId: item.customerId,
        productCode: item.productCode,
        addedAt: item.addedAt,
        product: {
          productCode: item.productCode,
          name: item.productName,
          description: item.productDescription,
          price: parseFloat(item.productPrice),
          isActive: item.productIsActive === 1,
        },
      }));
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'WishlistRepository.findByCustomerId',
      });
      throw createError('Error retrieving customer wishlist', 500);
    }
  }

  /**
   * Find a specific wishlist item by customer and product
   * @param customerId - Customer ID
   * @param productCode - Product code
   * @returns Wishlist item or null if not found
   */
  async findByCustomerAndProduct(
    customerId: number,
    productCode: string
  ): Promise<CustomerWishlist | null> {
    try {
      const wishlistItem = await this.wishlistRepo.findOne({
        where: {
          customerId,
          productCode,
        },
      });
      return wishlistItem;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'WishlistRepository.findByCustomerAndProduct',
      });
      throw createError('Error checking wishlist item', 500);
    }
  }

  /**
   * Add a product to customer wishlist
   * @param data - Wishlist item data
   * @returns Created wishlist item
   */
  async add(data: AddToWishlistRepositoryRequest): Promise<CustomerWishlist> {
    try {
      // Check if product exists and is active
      const productMaster = await this.productMasterRepo.findOne({
        where: { productCode: data.productCode },
      });

      if (!productMaster) {
        throw createError('Product not found', 404);
      }

      // Check if current version is active
      const currentVersion = await this.productVersionRepo.findOne({
        where: {
          productMasterId: productMaster.id,
          isCurrent: true,
        },
      });

      if (!currentVersion || !currentVersion.isActive) {
        throw createError('Product is not available', 400);
      }

      // Check if already in wishlist
      const existing = await this.findByCustomerAndProduct(
        data.customerId,
        data.productCode
      );

      if (existing) {
        throw createError('Product already in wishlist', 409);
      }

      // Create wishlist item
      const wishlistItem = this.wishlistRepo.create({
        customerId: data.customerId,
        productCode: data.productCode,
      });

      const savedItem = await this.wishlistRepo.save(wishlistItem);
      return savedItem;
    } catch (error) {
      if (
        (error as any).statusCode === 404 ||
        (error as any).statusCode === 400 ||
        (error as any).statusCode === 409
      ) {
        throw error;
      }
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'WishlistRepository.add',
      });
      throw createError('Error adding product to wishlist', 500);
    }
  }

  /**
   * Remove a product from customer wishlist
   * @param customerId - Customer ID
   * @param productCode - Product code
   */
  async remove(customerId: number, productCode: string): Promise<void> {
    try {
      const wishlistItem = await this.findByCustomerAndProduct(
        customerId,
        productCode
      );

      if (!wishlistItem) {
        throw createError('Product not found in wishlist', 404);
      }

      await this.wishlistRepo.remove(wishlistItem);
    } catch (error) {
      if ((error as any).statusCode === 404) {
        throw error;
      }
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'WishlistRepository.remove',
      });
      throw createError('Error removing product from wishlist', 500);
    }
  }

  /**
   * Get all customers who have a specific product in their wishlist
   * @param productCode - Product code
   * @returns Array of customer IDs
   */
  async getCustomersWithProduct(productCode: string): Promise<number[]> {
    try {
      const wishlistItems = await this.wishlistRepo.find({
        where: { productCode },
        select: ['customerId'],
      });

      return wishlistItems.map((item) => item.customerId);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'WishlistRepository.getCustomersWithProduct',
      });
      throw createError('Error retrieving customers for product', 500);
    }
  }
}
