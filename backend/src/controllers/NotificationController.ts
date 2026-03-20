import { Response } from 'express';
import { NotificationService } from '../services/NotificationService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  GetNotificationsRequest,
  GetNotificationsResponse,
  MarkAsReadRequest,
  MarkAsReadResponse,
  MarkAllAsReadRequest,
  MarkAllAsReadResponse,
  GetUnreadCountRequest,
  GetUnreadCountResponse,
  SendBroadcastNotificationRequest,
  SendBroadcastNotificationResponse,
  SendWishlistNotificationRequest,
  SendWishlistNotificationResponse,
  createApiResponse,
} from '../types/api';

/**
 * Controller for notification-related operations
 * Handles HTTP requests for customer notifications
 */
export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * GET /api/notifications
   * Get notifications for authenticated customer with filters and pagination
   */
  getNotifications = asyncHandler(
    async (
      req: GetNotificationsRequest,
      res: Response<GetNotificationsResponse>
    ): Promise<void> => {
      // Extract customer ID from JWT token
      const customerId = req.user?.userId;
      if (!customerId) {
        throw createError('Customer authentication required', 401);
      }

      // Extract query parameters
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;

      const result = await this.notificationService.getNotifications(
        parseInt(customerId),
        { isRead, limit, page }
      );

      // Map INotification to NotificationItem (convert _id to string)
      const notifications = result.notifications.map((n) => ({
        _id: n._id.toString(),
        customerId: n.customerId,
        type: n.type,
        title: n.title,
        message: n.message,
        icon: n.icon,
        link: n.link,
        priority: n.priority,
        isRead: n.isRead,
        isDelivered: n.isDelivered,
        createdAt: n.createdAt,
        readAt: n.readAt,
        deliveredAt: n.deliveredAt,
      }));

      res.status(200).json(
        createApiResponse(true, 'Notifications retrieved successfully', {
          notifications,
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
        })
      );
    }
  );

  /**
   * PATCH /api/notifications/:id/read
   * Mark a notification as read
   */
  markAsRead = asyncHandler(
    async (
      req: MarkAsReadRequest,
      res: Response<MarkAsReadResponse>
    ): Promise<void> => {
      // Extract customer ID from JWT token
      const customerId = req.user?.userId;
      if (!customerId) {
        throw createError('Customer authentication required', 401);
      }

      const { id } = req.params;

      if (!id || id.trim() === '') {
        throw createError('Notification ID is required', 400);
      }

      await this.notificationService.markAsRead(id, parseInt(customerId));

      res.status(200).json(
        createApiResponse(true, 'Notification marked as read successfully', {})
      );
    }
  );

  /**
   * PATCH /api/notifications/mark-all-read
   * Mark all notifications as read for authenticated customer
   */
  markAllAsRead = asyncHandler(
    async (
      req: MarkAllAsReadRequest,
      res: Response<MarkAllAsReadResponse>
    ): Promise<void> => {
      // Extract customer ID from JWT token
      const customerId = req.user?.userId;
      if (!customerId) {
        throw createError('Customer authentication required', 401);
      }

      const count = await this.notificationService.markAllAsRead(
        parseInt(customerId)
      );

      res.status(200).json(
        createApiResponse(true, 'All notifications marked as read successfully', {
          count,
        })
      );
    }
  );

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count for authenticated customer
   */
  getUnreadCount = asyncHandler(
    async (
      req: GetUnreadCountRequest,
      res: Response<GetUnreadCountResponse>
    ): Promise<void> => {
      // Extract customer ID from JWT token
      const customerId = req.user?.userId;
      if (!customerId) {
        throw createError('Customer authentication required', 401);
      }

      const count = await this.notificationService.getUnreadCount(
        parseInt(customerId)
      );

      res.status(200).json(
        createApiResponse(true, 'Unread count retrieved successfully', {
          count,
        })
      );
    }
  );

  /**
   * POST /api/notifications/broadcast
   * Send broadcast notification to all active customers (Admin only)
   */
  sendBroadcastNotification = asyncHandler(
    async (
      req: SendBroadcastNotificationRequest,
      res: Response<SendBroadcastNotificationResponse>
    ): Promise<void> => {
      const { type, title, message, icon, link, priority } = req.body;

      const result = await this.notificationService.sendBroadcastNotification({
        type,
        title,
        message,
        icon,
        link,
        priority,
      });

      res.status(200).json(
        createApiResponse(
          true,
          `Broadcast notification sent to ${result.count} customer(s)`,
          { count: result.count }
        )
      );
    }
  );

  /**
   * POST /api/notifications/wishlist/:productCode
   * Send notification to customers with product in wishlist (Admin only)
   */
  sendWishlistNotification = asyncHandler(
    async (
      req: SendWishlistNotificationRequest,
      res: Response<SendWishlistNotificationResponse>
    ): Promise<void> => {
      const { productCode } = req.params;
      const { type, title, message, icon, link, priority } = req.body;

      const result = await this.notificationService.sendWishlistNotification(
        productCode,
        { type, title, message, icon, link, priority }
      );

      res.status(200).json(
        createApiResponse(
          true,
          `Wishlist notification sent to ${result.count} customer(s)`,
          { count: result.count }
        )
      );
    }
  );
}
