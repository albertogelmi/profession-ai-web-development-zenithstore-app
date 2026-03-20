import { ProductReview, IProductReview } from '../../entities/mongodb/ProductReview';
import { errorEmitter } from '../../utils/errorEmitter';

/**
 * Product Review Repository
 * Handles all database operations for product reviews
 */
export class ProductReviewRepository {
  
  /**
   * Create a new review
   */
  async create(reviewData: Partial<IProductReview>): Promise<IProductReview> {
    try {
      const review = new ProductReview(reviewData);
      return await review.save();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.create',
      });
      throw error;
    }
  }

  /**
   * Find review by ID
   */
  async findById(reviewId: string): Promise<IProductReview | null> {
    try {
      return await ProductReview.findById(reviewId).select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.findById',
      });
      throw error;
    }
  }

  /**
   * Find all reviews for a product
   */
  async findByProductCode(
    productCode: string,
    moderationStatus?: 'pending' | 'approved' | 'rejected'
  ): Promise<IProductReview[]> {
    try {
      const query: any = { productCode };
      if (moderationStatus) {
        query.moderationStatus = moderationStatus;
      }
      
      return await ProductReview.find(query)
        .sort({ createdAt: -1 })
        .select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.findByProductCode',
      });
      throw error;
    }
  }

  /**
   * Find reviews by customer
   */
  async findByCustomer(customerId: number, limit: number = 10): Promise<IProductReview[]> {
    try {
      return await ProductReview.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.findByCustomer',
      });
      throw error;
    }
  }

  /**
   * Check if customer already reviewed this product for this order
   */
  async existsByCustomerProductOrder(
    customerId: number,
    productCode: string,
    orderId: number
  ): Promise<boolean> {
    try {
      const count = await ProductReview.countDocuments({
        customerId,
        productCode,
        orderId,
      });
      return count > 0;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.existsByCustomerProductOrder',
      });
      throw error;
    }
  }

  /**
   * Approve a review
   */
  async approve(reviewId: string, moderatorId: string): Promise<IProductReview | null> {
    try {
      const review = await ProductReview.findById(reviewId);
      if (!review) return null;

      review.moderationStatus = 'approved';
      review.moderatedBy = moderatorId;
      review.moderatedAt = new Date();
      
      return await review.save();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.approve',
      });
      throw error;
    }
  }

  /**
   * Reject a review
   */
  async reject(
    reviewId: string,
    moderatorId: string,
    reason: string
  ): Promise<IProductReview | null> {
    try {
      const review = await ProductReview.findById(reviewId);
      if (!review) return null;

      review.moderationStatus = 'rejected';
      review.moderatedBy = moderatorId;
      review.moderatedAt = new Date();
      review.rejectionReason = reason;
      
      return await review.save();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.reject',
      });
      throw error;
    }
  }

  /**
   * Increment helpful count
   */
  async incrementHelpful(reviewId: string): Promise<IProductReview | null> {
    try {
      return await ProductReview.findByIdAndUpdate(
        reviewId,
        { $inc: { helpfulCount: 1 } },
        { new: true }
      ).select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.incrementHelpful',
      });
      throw error;
    }
  }

  /**
   * Get average rating for a product
   */
  async getAverageRating(productCode: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution?: number[];
  }> {
    try {
      const result = await ProductReview.aggregate([
        { $match: { productCode, moderationStatus: 'approved' } },
        {
          $group: {
            _id: '$productCode',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
            ratingDistribution: {
              $push: '$rating',
            },
          },
        },
      ]);

      return result[0] || { averageRating: 0, totalReviews: 0 };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.getAverageRating',
      });
      throw error;
    }
  }

  /**
   * Get pending reviews for moderation
   */
  async getPendingReviews(limit: number = 50): Promise<IProductReview[]> {
    try {
      return await ProductReview.find({ moderationStatus: 'pending' })
        .sort({ createdAt: 1 })
        .limit(limit)
        .select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.getPendingReviews',
      });
      throw error;
    }
  }

  /**
   * Delete a review physically from database
   */
  async delete(reviewId: string): Promise<boolean> {
    try {
      const result = await ProductReview.findByIdAndDelete(reviewId);
      return result !== null;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductReviewRepository.delete',
      });
      throw error;
    }
  }
}
