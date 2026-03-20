import { Response } from 'express';
import { WishlistService } from '../services/WishlistService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  GetWishlistRequest,
  GetWishlistResponse,
  AddToWishlistRequest,
  AddToWishlistResponse,
  RemoveFromWishlistRequest,
  RemoveFromWishlistResponse,
  createApiResponse,
} from '../types/api';
import {
  AddToWishlistServiceRequest,
  RemoveFromWishlistServiceRequest,
} from '../types/services';

/**
 * Controller for wishlist-related operations
 * Handles HTTP requests for customer wishlist management
 */
export class WishlistController {
  private wishlistService: WishlistService;

  constructor() {
    this.wishlistService = new WishlistService();
  }

  /**
   * GET /api/wishlist
   * Get customer wishlist with product details
   */
  getWishlist = asyncHandler(
    async (
      req: GetWishlistRequest,
      res: Response<GetWishlistResponse>
    ): Promise<void> => {
      // Extract customer ID from JWT token
      const customerId = req.user?.userId;
      if (!customerId) {
        throw createError('Customer authentication required', 401);
      }

      const wishlist = await this.wishlistService.getCustomerWishlist(
        parseInt(customerId)
      );

      res.status(200).json(
        createApiResponse(true, 'Wishlist retrieved successfully', {
          wishlist,
          count: wishlist.length,
        })
      );
    }
  );

  /**
   * POST /api/wishlist
   * Add a product to customer wishlist
   */
  addProduct = asyncHandler(
    async (
      req: AddToWishlistRequest,
      res: Response<AddToWishlistResponse>
    ): Promise<void> => {
      // Extract customer ID from JWT token
      const customerId = req.user?.userId;
      if (!customerId) {
        throw createError('Customer authentication required', 401);
      }

      const { productCode } = req.body;

      if (!productCode || productCode.trim() === '') {
        throw createError('Product code is required', 400);
      }

      const serviceRequest: AddToWishlistServiceRequest = {
        customerId: parseInt(customerId),
        productCode: productCode.trim(),
      };

      await this.wishlistService.addToWishlist(serviceRequest);

      res.status(201).json(
        createApiResponse(true, 'Product added to wishlist successfully', {})
      );
    }
  );

  /**
   * DELETE /api/wishlist/:productCode
   * Remove a product from customer wishlist
   */
  removeProduct = asyncHandler(
    async (
      req: RemoveFromWishlistRequest,
      res: Response<RemoveFromWishlistResponse>
    ): Promise<void> => {
      // Extract customer ID from JWT token
      const customerId = req.user?.userId;
      if (!customerId) {
        throw createError('Customer authentication required', 401);
      }

      const { productCode } = req.params;

      if (!productCode || productCode.trim() === '') {
        throw createError('Product code is required', 400);
      }

      const serviceRequest: RemoveFromWishlistServiceRequest = {
        customerId: parseInt(customerId),
        productCode: productCode.trim(),
      };

      await this.wishlistService.removeFromWishlist(serviceRequest);

      res.status(200).json(
        createApiResponse(true, 'Product removed from wishlist successfully', {})
      );
    }
  );
}
