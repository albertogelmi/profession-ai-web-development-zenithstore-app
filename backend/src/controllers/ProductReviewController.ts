import { Response } from 'express';
import { ProductReviewService } from '../services/ProductReviewService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  createApiResponse,
  CreateReviewRequest,
  GetReviewsRequest,
  ReviewIdRequest,
  GetPendingReviewsRequest,
  GetMyReviewsRequest,
} from '../types/api';

export class ProductReviewController {
  private reviewService: ProductReviewService;

  constructor() {
    this.reviewService = new ProductReviewService();
  }

  /**
   * POST /api/products/:productCode/reviews
   * Create a new review
   */
  createReview = asyncHandler(async (req: CreateReviewRequest, res: Response): Promise<void> => {
    const { productCode } = req.params;
    const { rating, title, comment, orderId } = req.body;
    const customerId = Number(req.user.userId);

    if (!rating || rating < 1 || rating > 5) {
      throw createError('Rating must be between 1 and 5', 400);
    }

    if (!orderId) {
      throw createError('Order ID is required', 400);
    }

    const review = await this.reviewService.createReview({
      customerId,
      productCode,
      orderId,
      rating,
      title,
      comment,
    });

    res.status(201).json(createApiResponse(
      true,
      'Review created successfully',
      review
    ));
  });

  /**
   * GET /api/products/:productCode/reviews
   * Get all reviews for a product
   */
  getProductReviews = asyncHandler(async (req: GetReviewsRequest, res: Response): Promise<void> => {
    const { productCode } = req.params;
    const includeRejected = req.query.status === 'rejected';

    const reviews = await this.reviewService.getProductReviews({
      productCode,
      includeRejected,
    });

    res.status(200).json(createApiResponse(
      true,
      'Reviews retrieved successfully',
      reviews
    ));
  });

  /**
   * PATCH /api/reviews/:id/approve
   * Approve a review (admin only)
   */
  approveReview = asyncHandler(async (req: ReviewIdRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const moderatorId = req.user.userId.toString();

    const review = await this.reviewService.approveReview({
      reviewId: id,
      moderatorId,
    });

    res.status(200).json(createApiResponse(
      true,
      'Review approved successfully',
      review
    ));
  });

  /**
   * PATCH /api/reviews/:id/reject
   * Reject a review (admin only)
   */
  rejectReview = asyncHandler(async (req: ReviewIdRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const moderatorId = req.user.userId.toString();
    const reason = req.body?.reason || 'Content policy violation';

    const review = await this.reviewService.rejectReview({
      reviewId: id,
      moderatorId,
      reason,
    });

    res.status(200).json(createApiResponse(
      true,
      'Review rejected successfully',
      review
    ));
  });

  /**
   * PATCH /api/reviews/:id/helpful
   * Increment helpful counter
   */
  markReviewHelpful = asyncHandler(async (req: ReviewIdRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const review = await this.reviewService.markReviewHelpful(id);

    res.status(200).json(createApiResponse(
      true,
      'Review marked as helpful',
      review
    ));
  });

  /**
   * DELETE /api/reviews/:id
   * Delete a review (customer owner or admin)
   */
  deleteReview = asyncHandler(async (req: ReviewIdRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = Number(req.user.userId);
    const userRole = req.user.role;

    await this.reviewService.deleteReview({
      reviewId: id,
      userId,
      userRole,
    });

    res.status(200).json(createApiResponse(
      true,
      'Review deleted successfully',
      null
    ));
  });

  /**
   * GET /api/reviews/pending
   * Get all reviews pending moderation (admin only)
   */
  getPendingReviews = asyncHandler(async (req: GetPendingReviewsRequest, res: Response): Promise<void> => {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

    const reviews = await this.reviewService.getPendingReviews({ limit });

    res.status(200).json(createApiResponse(
      true,
      'Pending reviews retrieved successfully',
      reviews
    ));
  });

  /**
   * GET /api/customers/me/reviews
   * Get all reviews of the authenticated customer
   */
  getMyReviews = asyncHandler(async (req: GetMyReviewsRequest, res: Response): Promise<void> => {
    const customerId = Number(req.user.userId);
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

    const reviews = await this.reviewService.getMyReviews({ customerId, limit });

    res.status(200).json(createApiResponse(
      true,
      'Your reviews retrieved successfully',
      reviews
    ));
  });
}
