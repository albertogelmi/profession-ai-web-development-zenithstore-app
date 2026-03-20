import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { domainRestriction } from '../middleware/domainRestriction';
import { corsMiddleware } from '../middleware/security';
import { authenticateTokenUser } from '../middleware/auth';

/**
 * Factory to create product routes
 * @returns Configured Express Router
 */
export function createProductRoutes(): Router {
  const router = Router();
  
  // Controller instantiation
  const productController = new ProductController();

  // ========== PUBLIC ROUTES (no authentication, no domain restriction, no CORS) ==========

  /**
   * @route GET /api/products/search
   * @desc Advanced product search with filters
   * @access Public (no authentication required)
   */
  router.get('/search', productController.searchProducts);

  /**
   * @route GET /api/products/:productCode
   * @desc Inquiry for specific product with available quantity
   * @access Public (no authentication required)
   */
  router.get('/:productCode', productController.getProductByCode);

  // ========== PROTECTED ROUTES (require authentication + domain restriction) ==========

  // Apply middleware for admin-only routes
  router.use(corsMiddleware); // CORS enabled for admin routes
  router.use(domainRestriction); // Domain restriction enabled for admin routes
  router.use(authenticateTokenUser); // JWT required for admin APIs

  /**
   * @route GET /api/products
   * @desc List all active products with available quantity
   * @access Admin only (Localhost + JWT required)
   */
  router.get('/', productController.getAllProducts);

  /**
   * @route POST /api/products
   * @desc Register new product
   * @access Admin only (Localhost + JWT required)
   */
  router.post('/', productController.createProduct);

  /**
   * @route PATCH /api/products/:productCode
   * @desc Update product (product_version: name, description, price)
   * @access Admin only (Localhost + JWT required)
   */
  router.patch('/:productCode', productController.updateProduct);

  /**
   * @route PATCH /api/products/:productCode/inventory
   * @desc Register/update product available quantity
   * @access Admin only (Localhost + JWT required)
   */
  router.patch('/:productCode/inventory', productController.updateInventoryQuantity);

  /**
   * @route DELETE /api/products/:productCode
   * @desc Soft delete product (product_version + available quantity)
   * @access Admin only (Localhost + JWT required)
   */
  router.delete('/:productCode', productController.deleteProduct);

  /**
   * @route POST /api/products/:productCode/restore
   * @desc Restore soft-deleted product
   * @access Admin only (Localhost + JWT required)
   */
  router.post('/:productCode/restore', productController.restoreProduct);

  return router;
}

export default createProductRoutes;