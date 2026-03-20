import { ProductReviewRepository } from '../repositories/mongodb/ProductReviewRepository';
import { OrderRepository } from '../repositories/mysql/OrderRepository';
import { CustomerRepository } from '../repositories/mysql/CustomerRepository';
import { errorEmitter } from '../utils/errorEmitter';
import { createError } from '../middleware/errorHandler';
import { IProductReview } from '../entities/mongodb/ProductReview';
import {
  CreateReviewServiceRequest,
  CreateReviewServiceResponse,
  GetProductReviewsServiceRequest,
  ApproveReviewServiceRequest,
  RejectReviewServiceRequest,
  DeleteReviewServiceRequest,
  GetPendingReviewsServiceRequest,
  GetMyReviewsServiceRequest,
} from '../types/services';

export class ProductReviewService {
  private reviewRepository: ProductReviewRepository;
  private orderRepository: OrderRepository;
  private customerRepository: CustomerRepository;

  constructor() {
    this.reviewRepository = new ProductReviewRepository();
    this.orderRepository = new OrderRepository();
    this.customerRepository = new CustomerRepository();
  }

  /**
   * Create a new product review with business validation
   * Verifies:
   * - Customer has actually purchased the product
   * - Product was in the specified order
   * - Customer hasn't already reviewed this product for this order
   */
  async createReview(
    request: CreateReviewServiceRequest
  ): Promise<CreateReviewServiceResponse> {
    try {
      const { customerId, productCode, orderId, rating, title, comment } = request;

      // 1. Verify the order exists and belongs to the customer
      const order = await this.orderRepository.findOrderWithItems({
        orderId,
        customerId,
      });

      if (!order) {
        throw createError('Order not found or does not belong to you', 404);
      }

      // 2. Verify the customer actually ordered this product
      const productInOrder = order.items.some(
        (item) => item.productCode.toUpperCase() === productCode.toUpperCase()
      );

      if (!productInOrder) {
        throw createError('You can only review products you have purchased', 403);
      }

      // 3. Verify the order has been delivered
      if (order.status !== 'delivered') {
        throw createError('You can only review products from delivered orders', 403);
      }

      // 4. Check for duplicate reviews (same customer, product, order)
      const existingReview = await this.reviewRepository.existsByCustomerProductOrder(
        customerId,
        productCode.toUpperCase(),
        orderId
      );

      if (existingReview) {
        throw createError('You have already reviewed this product for this order', 409);
      }

      // 5. Get customer name
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw createError('Customer not found', 404);
      }

      // 6. Create the review
      const review = await this.reviewRepository.create({
        customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        productCode: productCode.toUpperCase(),
        orderId,
        rating,
        title,
        comment,
        moderationStatus: 'pending',
        helpfulCount: 0,
      });

      return {
        reviewId: review._id.toString(),
        customerId: review.customerId,
        productCode: review.productCode,
        orderId: review.orderId,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        moderationStatus: review.moderationStatus,
        createdAt: review.createdAt,
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductReviewService.createReview',
      });
      throw error;
    }
  }

  /**
   * Get all reviews for a product
   */
  async getProductReviews(
    request: GetProductReviewsServiceRequest
  ): Promise<IProductReview[]> {
    try {
      const { productCode, includeRejected = false } = request;

      // Get only approved reviews by default, or include rejected if requested
      const reviews = await this.reviewRepository.findByProductCode(
        productCode.toUpperCase(),
        includeRejected ? undefined : 'approved'
      );

      return reviews;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductReviewService.getProductReviews',
      });
      throw error;
    }
  }

  /**
   * Approve a review (moderator action)
   */
  async approveReview(
    request: ApproveReviewServiceRequest
  ): Promise<IProductReview> {
    try {
      const { reviewId, moderatorId } = request;

      const review = await this.reviewRepository.approve(reviewId, moderatorId);

      if (!review) {
        throw createError('Review not found', 404);
      }

      return review;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductReviewService.approveReview',
      });
      throw error;
    }
  }

  /**
   * Reject a review (moderator action)
   */
  async rejectReview(
    request: RejectReviewServiceRequest
  ): Promise<IProductReview> {
    try {
      const { reviewId, moderatorId, reason } = request;

      const review = await this.reviewRepository.reject(reviewId, moderatorId, reason);

      if (!review) {
        throw createError('Review not found', 404);
      }

      return review;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductReviewService.rejectReview',
      });
      throw error;
    }
  }

  /**
   * Mark a review as helpful (increment counter)
   */
  async markReviewHelpful(reviewId: string): Promise<IProductReview> {
    try {
      const review = await this.reviewRepository.incrementHelpful(reviewId);

      if (!review) {
        throw createError('Review not found', 404);
      }

      return review;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductReviewService.markReviewHelpful',
      });
      throw error;
    }
  }

  /**
   * Delete a review
   * Business rules:
   * - Admin (user role) can delete any review
   * - Customer can only delete their own reviews
   */
  async deleteReview(request: DeleteReviewServiceRequest): Promise<boolean> {
    try {
      const { reviewId, userId, userRole } = request;

      // If not admin, verify ownership
      if (userRole !== 'user') {
        const review = await this.reviewRepository.findById(reviewId);

        if (!review) {
          throw createError('Review not found', 404);
        }

        if (review.customerId !== userId) {
          throw createError('You can only delete your own reviews', 403);
        }
      }

      const deleted = await this.reviewRepository.delete(reviewId);

      if (!deleted) {
        throw createError('Review not found', 404);
      }

      return true;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductReviewService.deleteReview',
      });
      throw error;
    }
  }

  /**
   * Get pending reviews for moderation
   */
  async getPendingReviews(
    request: GetPendingReviewsServiceRequest
  ): Promise<IProductReview[]> {
    try {
      const { limit = 50 } = request;

      return await this.reviewRepository.getPendingReviews(limit);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductReviewService.getPendingReviews',
      });
      throw error;
    }
  }

  /**
   * Get all reviews by a specific customer
   */
  async getMyReviews(
    request: GetMyReviewsServiceRequest
  ): Promise<IProductReview[]> {
    try {
      const { customerId, limit = 20 } = request;

      return await this.reviewRepository.findByCustomer(customerId, limit);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductReviewService.getMyReviews',
      });
      throw error;
    }
  }
}
