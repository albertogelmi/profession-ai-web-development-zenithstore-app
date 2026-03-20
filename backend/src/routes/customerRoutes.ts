import { Router } from 'express';
import { CustomerController } from '../controllers/CustomerController';
import { domainRestriction } from '../middleware/domainRestriction';
import { authLimiter } from '../middleware/rateLimiter';
import { corsMiddleware } from '../middleware/security';
import { authenticateTokenCustomer } from '../middleware/auth';

/**
 * Factory to create customer routes
 * @returns Configured Express Router
 */
export function createCustomerRoutes(): Router {
  const router = Router();
  
  // Controller instantiation
  const customerController = new CustomerController();

  /**
   * @route GET /api/customers
   * @desc List all registered active customers (admin function)
   * @access Localhost only
   */
  router.get('/', corsMiddleware, domainRestriction, customerController.getAllCustomers);

  /**
   * @route GET /api/customers/search
   * @desc Advanced customer search with multiple criteria (admin function)
   * @access Localhost only
   */
  router.get('/search', corsMiddleware, domainRestriction, customerController.searchCustomers);

  /**
   * @route GET /api/customers/profile
   * @desc Get specific customer details
   * @access Public, JWT required
   */
  router.get('/profile', authenticateTokenCustomer, customerController.getCustomerById);

  /**
   * @route POST /api/customers
   * @desc Create new customer
   * @access Public
   */
  router.post('/', customerController.createCustomer);

  /**
   * @route PATCH /api/customers/password
   * @desc Password update
   * @access Public
   */
  router.patch('/password', customerController.updatePassword);

  /**
   * @route POST /api/customers/reset-password
   * @desc Force password reset (admin function)
   * @access Localhost only
   */
  router.post('/reset-password', corsMiddleware, domainRestriction, customerController.resetPassword);

  /**
   * @route POST /api/customers/login
   * @desc Login with JWT token generation
   * @access Public, Auth Rate Limiting
   */
  router.post('/login', authLimiter, customerController.login);

  /**
   * @route POST /api/customers/profile/logout
   * @desc Logout and blacklist JWT token
   * @access Public, JWT required, Auth Rate Limiting
   */
  router.post('/profile/logout', authenticateTokenCustomer, authLimiter, customerController.logout);

  /**
   * @route POST /api/customers/:id/block
   * @desc Block a customer temporarily (admin function)
   * @access Localhost only
   */
  router.post('/:id/block', corsMiddleware, domainRestriction, customerController.blockCustomer);

  /**
   * @route POST /api/customers/:id/unblock
   * @desc Unblock a customer (admin function)
   * @access Localhost only
   */
  router.post('/:id/unblock', corsMiddleware, domainRestriction, customerController.unblockCustomer);

  /**
   * @route DELETE /api/customers/profile
   * @desc Customer deletion (soft delete)
   * @access Public, JWT required
   */
  router.delete('/profile', authenticateTokenCustomer, customerController.deleteCustomer);

  return router;
}

export default createCustomerRoutes;