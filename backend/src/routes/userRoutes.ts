import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { domainRestriction } from '../middleware/domainRestriction';
import { authLimiter } from '../middleware/rateLimiter';
import { corsMiddleware } from '../middleware/security';
import { authenticateTokenUser } from '../middleware/auth';

/**
 * Factory to create user routes
 * @returns Configured Express Router
 */
export function createUserRoutes(): Router {
  const router = Router();
  
  // Controller instantiation
  const userController = new UserController();

  // Middleware for all user routes
  router.use(corsMiddleware); // CORS enabled for all user routes
  router.use(domainRestriction); // Domain restriction enabled for all user routes

  /**
   * @route GET /api/users
   * @desc List all registered active users (admin function)
   * @access Localhost only
   */
  router.get('/', userController.getAllUsers);

  /**
   * @route POST /api/users
   * @desc Create new technical user (admin function)
   * @access Localhost only
   */
  router.post('/', userController.createUser);

  /**
   * @route DELETE /api/users/:id
   * @desc User deletion (soft delete) (admin function)
   * @access Localhost only
   */
  router.delete('/:id', userController.deleteUser);

  /**
   * @route PATCH /api/users/:id/password
   * @desc Expired password update
   * @access Localhost only
   */
  router.patch('/:id/password', userController.updatePassword);

  /**
   * @route POST /api/users/login
   * @desc Login with JWT token generation
   * @access Localhost only + Auth Rate Limiting
   */
  router.post('/login', authLimiter, userController.login);

  /**
   * @route GET /api/users/search
   * @desc Advanced user search with multiple criteria (admin function)
   * @access Localhost only
   */
  router.get('/search', userController.searchUsers);

  /**
   * @route POST /api/users/profile/logout
   * @desc Logout and blacklist JWT token
   * @access Localhost only + JWT required + Auth Rate Limiting
   */
  router.post('/profile/logout', authenticateTokenUser, authLimiter, userController.logout);

  /**
   * @route POST /api/users/:id/reset-password
   * @desc Force password reset (admin function)
   * @access Localhost only
   */
  router.post('/:id/reset-password', userController.resetPassword);

  /**
   * @route POST /api/users/:id/block
   * @desc Block a user temporarily (admin function)
   * @access Localhost only
   */
  router.post('/:id/block', userController.blockUser);

  /**
   * @route POST /api/users/:id/unblock
   * @desc Unblock a user (admin function)
   * @access Localhost only
   */
  router.post('/:id/unblock', userController.unblockUser);

  return router;
}

export default createUserRoutes;