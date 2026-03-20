import { Router } from 'express';
import { WishlistController } from '../controllers/WishlistController';
import { authenticateTokenCustomer } from '../middleware/auth';

/**
 * Factory to create wishlist routes
 * @returns Configured Express Router
 */
export function createWishlistRoutes(): Router {
  const router = Router();
  
  // Controller instantiation
  const wishlistController = new WishlistController();

  // All wishlist routes require customer authentication only
  // No CORS middleware - customer APIs don't need domain restriction
  router.use(authenticateTokenCustomer);

  /**
   * @route GET /api/wishlist
   * @desc Get customer wishlist with product details
   * @access Customer authenticated (JWT required)
   */
  router.get('/', wishlistController.getWishlist);

  /**
   * @route POST /api/wishlist
   * @desc Add a product to customer wishlist
   * @access Customer authenticated (JWT required)
   */
  router.post('/', wishlistController.addProduct);

  /**
   * @route DELETE /api/wishlist/:productCode
   * @desc Remove a product from customer wishlist
   * @access Customer authenticated (JWT required)
   */
  router.delete('/:productCode', wishlistController.removeProduct);

  return router;
}

export default createWishlistRoutes;
