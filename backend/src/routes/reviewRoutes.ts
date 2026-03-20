import { Router } from 'express';
import { ProductReviewController } from '../controllers/ProductReviewController';
import { corsMiddleware } from '../middleware/security';
import { domainRestriction } from '../middleware/domainRestriction';
import { authenticateToken, authenticateTokenUser, authenticateTokenCustomer } from '../middleware/auth';

/**
 * Factory to create review routes
 * @returns Configured Express Router
 */
export function createReviewRoutes(): Router {
  const router = Router();
  
  // Controller instantiation
  const reviewController = new ProductReviewController();

  /**
   * @route POST /api/products/:productCode/reviews
   * @desc Create a new review for a product
   * @access Customer only (must have purchased the product)
   */
  router.post('/products/:productCode/reviews', authenticateTokenCustomer, reviewController.createReview);

  /**
   * @route GET /api/products/:productCode/reviews
   * @desc Get all reviews for a product
   * @access Public
   */
  router.get('/products/:productCode/reviews', reviewController.getProductReviews);

  /**
   * @route PATCH /api/reviews/:id/approve
   * @desc Approve a review
   * @access Admin only (localhost)
   */
  router.patch('/reviews/:id/approve', corsMiddleware, domainRestriction, authenticateTokenUser, reviewController.approveReview);

  /**
   * @route PATCH /api/reviews/:id/reject
   * @desc Reject a review
   * @access Admin only (localhost)
   */
  router.patch('/reviews/:id/reject', corsMiddleware, domainRestriction, authenticateTokenUser, reviewController.rejectReview);

  /**
   * @route PATCH /api/reviews/:id/helpful
   * @desc Mark a review as helpful
   * @access Public
   */
  router.patch('/reviews/:id/helpful', reviewController.markReviewHelpful);

  /**
   * @route DELETE /api/reviews/:id
   * @desc Delete a review (customer owner or admin)
   * @access Customer (own) or Admin
   */
  router.delete('/reviews/:id', authenticateToken, reviewController.deleteReview);

  /**
   * @route GET /api/reviews/pending
   * @desc Get all reviews pending moderation
   * @access Admin only (localhost)
   */
  router.get('/reviews/pending', corsMiddleware, domainRestriction, authenticateTokenUser, reviewController.getPendingReviews);

  /**
   * @route GET /api/customers/me/reviews
   * @desc Get all reviews of the authenticated customer
   * @access Customer only
   */
  router.get('/customers/me/reviews', authenticateTokenCustomer, reviewController.getMyReviews);

  return router;
}

export default createReviewRoutes;
