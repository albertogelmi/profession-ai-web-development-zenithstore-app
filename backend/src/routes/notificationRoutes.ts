import { Router } from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { authenticateTokenCustomer, authenticateTokenUser } from '../middleware/auth';
import { corsMiddleware } from '../middleware/security';
import { domainRestriction } from '../middleware/domainRestriction';

/**
 * Factory to create notification routes
 * @returns Configured Express Router
 */
export function createNotificationRoutes(): Router {
  const router = Router();
  
  // Controller instantiation
  const notificationController = new NotificationController();

  // Customer routes - require customer authentication only
  // No CORS middleware - customer APIs don't need domain restriction

  /**
   * @route GET /api/notifications
   * @desc Get notifications for authenticated customer with filters and pagination
   * @access Customer authenticated (JWT required)
   * @queryParams isRead (boolean), limit (number), page (number)
   */
  router.get('/', authenticateTokenCustomer, notificationController.getNotifications);

  /**
   * @route GET /api/notifications/unread-count
   * @desc Get unread notification count for authenticated customer
   * @access Customer authenticated (JWT required)
   */
  router.get('/unread-count', authenticateTokenCustomer, notificationController.getUnreadCount);

  /**
   * @route PATCH /api/notifications/mark-all-read
   * @desc Mark all notifications as read for authenticated customer
   * @access Customer authenticated (JWT required)
   */
  router.patch('/mark-all-read', authenticateTokenCustomer, notificationController.markAllAsRead);

  /**
   * @route PATCH /api/notifications/:id/read
   * @desc Mark a specific notification as read
   * @access Customer authenticated (JWT required)
   */
  router.patch('/:id/read', authenticateTokenCustomer, notificationController.markAsRead);

  // Admin-only routes - require corsMiddleware + domainRestriction + authenticateTokenUser

  /**
   * @route POST /api/notifications/broadcast
   * @desc Send broadcast notification to all active customers
   * @access Admin (Technical user JWT required)
   */
  router.post(
    '/broadcast',
    corsMiddleware,
    domainRestriction,
    authenticateTokenUser,
    notificationController.sendBroadcastNotification
  );

  /**
   * @route POST /api/notifications/wishlist/:productCode
   * @desc Send notification to customers with specific product in wishlist
   * @access Admin (Technical user JWT required)
   */
  router.post(
    '/wishlist/:productCode',
    corsMiddleware,
    domainRestriction,
    authenticateTokenUser,
    notificationController.sendWishlistNotification
  );

  return router;
}

export default createNotificationRoutes;
