import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { corsMiddleware } from '../middleware/security';
import { domainRestriction } from '../middleware/domainRestriction';
import { authenticateTokenUser } from '../middleware/auth';

/**
 * Create category routes
 * Provides endpoints for category management
 */
export function createCategoryRoutes(): Router {
  const router = Router();
  const controller = new CategoryController();

  // ========== PUBLIC ROUTES (no authentication, no domain restriction, no CORS) ==========

  /**
   * @route   GET /api/categories
   * @desc    List all active categories ordered by display_order
   * @access  Public
   */
  router.get('/', controller.getAllCategories);

  /**
   * @route   GET /api/categories/:slug
   * @desc    Get category details by slug
   * @access  Public
   */
  router.get('/:slug', controller.getCategoryBySlug);

  /**
   * @route   GET /api/categories/:slug/products
   * @desc    Get products by category slug with pagination and filters
   * @access  Public
   */
  router.get('/:slug/products', controller.getProductsByCategory);

  // ========== PROTECTED ROUTES (require authentication + domain restriction) ==========

  // Apply middleware for admin-only routes
  router.use(corsMiddleware);
  router.use(domainRestriction);
  router.use(authenticateTokenUser);

  /**
   * @route   POST /api/categories
   * @desc    Create a new category
   * @access  Admin only (authenticated users)
   */
  router.post('/', controller.createCategory);

  /**
   * @route   PATCH /api/categories/:slug
   * @desc    Update an existing category
   * @access  Admin only (authenticated users)
   */
  router.patch('/:slug', controller.updateCategory);

  /**
   * @route   DELETE /api/categories/:slug
   * @desc    Soft delete a category (set is_active to 0)
   * @access  Admin only (authenticated users)
   */
  router.delete('/:slug', controller.deleteCategory);

  /**
   * @route   POST /api/categories/:slug/restore
   * @desc    Restore a soft-deleted category (set is_active to 1)
   * @access  Admin only (authenticated users)
   */
  router.post('/:slug/restore', controller.restoreCategory);

  return router;
}
