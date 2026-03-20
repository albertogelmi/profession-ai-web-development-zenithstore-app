import { WishlistRepository } from '../repositories/mysql/WishlistRepository';
import { errorEmitter } from '../utils/errorEmitter';
import { createError } from '../middleware/errorHandler';
import {
  AddToWishlistServiceRequest,
  RemoveFromWishlistServiceRequest,
} from '../types/services';
import { WishlistItemWithProduct } from '../types/repositories';

/**
 * Service for managing customer wishlist
 * Handles business logic for wishlist operations
 */
export class WishlistService {
  private wishlistRepository: WishlistRepository;

  constructor() {
    this.wishlistRepository = new WishlistRepository();
  }

  /**
   * Get customer wishlist with product details
   * @param customerId - Customer ID
   * @returns Array of wishlist items with product information
   */
  async getCustomerWishlist(customerId: number): Promise<WishlistItemWithProduct[]> {
    try {
      if (!customerId || customerId < 1) {
        throw createError('Invalid customer ID', 400);
      }

      const wishlist = await this.wishlistRepository.findByCustomerId(customerId);
      return wishlist;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'WishlistService.getCustomerWishlist',
      });
      throw error;
    }
  }

  /**
   * Add a product to customer wishlist
   * @param data - Add to wishlist request
   * @returns Created wishlist item
   */
  async addToWishlist(data: AddToWishlistServiceRequest): Promise<void> {
    try {
      // Validate input
      this.validateAddToWishlist(data);

      // Add to wishlist (repository handles product validation and duplicate check)
      await this.wishlistRepository.add({
        customerId: data.customerId,
        productCode: data.productCode.toUpperCase(),
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'WishlistService.addToWishlist',
      });
      throw error;
    }
  }

  /**
   * Remove a product from customer wishlist
   * @param data - Remove from wishlist request
   */
  async removeFromWishlist(data: RemoveFromWishlistServiceRequest): Promise<void> {
    try {
      // Validate input
      this.validateRemoveFromWishlist(data);

      // Remove from wishlist
      await this.wishlistRepository.remove(
        data.customerId,
        data.productCode.toUpperCase()
      );
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'WishlistService.removeFromWishlist',
      });
      throw error;
    }
  }

  /**
   * Get all customers who have a specific product in their wishlist
   * Used for sending notifications when product goes on sale
   * @param productCode - Product code
   * @returns Array of customer IDs
   */
  async getCustomersForProduct(productCode: string): Promise<number[]> {
    try {
      if (!productCode || productCode.trim() === '') {
        throw createError('Product code is required', 400);
      }

      const customerIds = await this.wishlistRepository.getCustomersWithProduct(
        productCode.toUpperCase()
      );
      return customerIds;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'WishlistService.getCustomersForProduct',
      });
      throw error;
    }
  }

  /**
   * Validate add to wishlist data
   * @param data - Data to validate
   */
  private validateAddToWishlist(data: AddToWishlistServiceRequest): void {
    if (!data.customerId || data.customerId < 1) {
      throw createError('Valid customer ID is required', 400);
    }

    if (!data.productCode || data.productCode.trim() === '') {
      throw createError('Product code is required', 400);
    }

    if (data.productCode.length > 100) {
      throw createError('Product code must be at most 100 characters', 400);
    }
  }

  /**
   * Validate remove from wishlist data
   * @param data - Data to validate
   */
  private validateRemoveFromWishlist(data: RemoveFromWishlistServiceRequest): void {
    if (!data.customerId || data.customerId < 1) {
      throw createError('Valid customer ID is required', 400);
    }

    if (!data.productCode || data.productCode.trim() === '') {
      throw createError('Product code is required', 400);
    }

    if (data.productCode.length > 100) {
      throw createError('Product code must be at most 100 characters', 400);
    }
  }
}
