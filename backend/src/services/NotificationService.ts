import { NotificationRepository } from '../repositories/mongodb/NotificationRepository';
import { INotification } from '../entities/mongodb/Notification';
import { errorEmitter } from '../utils/errorEmitter';
import { createError } from '../middleware/errorHandler';
import { GetNotificationsFilters } from '../types/repositories';
import { CustomerRepository } from '../repositories/mysql/CustomerRepository';
import { WishlistRepository } from '../repositories/mysql/WishlistRepository';

/**
 * Service for managing customer notifications
 * Handles business logic for notification operations
 */
export class NotificationService {
  private notificationRepository: NotificationRepository;
  private customerRepository: CustomerRepository;
  private wishlistRepository: WishlistRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.customerRepository = new CustomerRepository();
    this.wishlistRepository = new WishlistRepository();
  }

  /**
   * Get notifications for a customer with filters and pagination
   * @param customerId - Customer ID
   * @param filters - Optional filters (isRead, limit, page)
   * @returns Notifications array and total count
   */
  async getNotifications(
    customerId: number,
    filters?: GetNotificationsFilters
  ): Promise<{ notifications: INotification[]; total: number; page: number; totalPages: number }> {
    try {
      if (!customerId || customerId < 1) {
        throw createError('Invalid customer ID', 400);
      }

      const limit = filters?.limit || 20;
      const page = filters?.page || 1;

      const result = await this.notificationRepository.findByCustomerId(
        customerId,
        filters
      );

      const totalPages = Math.ceil(result.total / limit);

      return {
        notifications: result.notifications,
        total: result.total,
        page,
        totalPages,
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'NotificationService.getNotifications',
      });
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param notificationId - Notification ID
   * @param customerId - Customer ID (for ownership validation)
   */
  async markAsRead(notificationId: string, customerId: number): Promise<void> {
    try {
      if (!notificationId || !notificationId.match(/^[0-9a-fA-F]{24}$/)) {
        throw createError('Invalid notification ID', 400);
      }

      if (!customerId || customerId < 1) {
        throw createError('Invalid customer ID', 400);
      }

      const notification = await this.notificationRepository.markAsRead(notificationId);

      if (!notification) {
        throw createError('Notification not found', 404);
      }

      // Verify ownership
      if (notification.customerId !== customerId) {
        throw createError('Unauthorized: You can only mark your own notifications as read', 403);
      }
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'NotificationService.markAsRead',
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a customer
   * @param customerId - Customer ID
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(customerId: number): Promise<number> {
    try {
      if (!customerId || customerId < 1) {
        throw createError('Invalid customer ID', 400);
      }

      const count = await this.notificationRepository.markAllAsRead(customerId);
      return count;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'NotificationService.markAllAsRead',
      });
      throw error;
    }
  }

  /**
   * Get unread notification count for a customer
   * @param customerId - Customer ID
   * @returns Unread count
   */
  async getUnreadCount(customerId: number): Promise<number> {
    try {
      if (!customerId || customerId < 1) {
        throw createError('Invalid customer ID', 400);
      }

      const count = await this.notificationRepository.getUnreadCount(customerId);
      return count;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'NotificationService.getUnreadCount',
      });
      throw error;
    }
  }

  /**
   * Create a notification (helper method for internal use)
   * @param notificationData - Notification data
   * @returns Created notification
   */
  async createNotification(notificationData: Partial<INotification>): Promise<INotification> {
    try {
      // Validate required fields
      if (!notificationData.customerId || notificationData.customerId < 1) {
        throw createError('Invalid customer ID', 400);
      }

      if (!notificationData.type) {
        throw createError('Notification type is required', 400);
      }

      if (!notificationData.title || notificationData.title.trim().length === 0) {
        throw createError('Notification title is required', 400);
      }

      if (!notificationData.message || notificationData.message.trim().length === 0) {
        throw createError('Notification message is required', 400);
      }

      // Set defaults
      const notification = {
        ...notificationData,
        priority: notificationData.priority || 'normal',
        isRead: false,
        isDelivered: false,
      };

      return await this.notificationRepository.create(notification);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'NotificationService.createNotification',
      });
      throw error;
    }
  }

  /**
   * Send broadcast notification to all active customers
   * @param data - Notification data (type, title, message, icon, link, priority)
   * @returns Object with count of notifications sent
   */
  async sendBroadcastNotification(data: {
    type: 'order' | 'offer' | 'advertising' | 'promo_personalized';
    title: string;
    message: string;
    icon?: string;
    link?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }): Promise<{ count: number }> {
    try {
      // Validate required fields
      if (!data.type || !data.title || !data.message) {
        throw createError('Type, title, and message are required', 400);
      }

      // Get all active customers
      const customers = await this.customerRepository.findAllActive();

      if (customers.length === 0) {
        return { count: 0 };
      }

      // Create notification for each customer
      const notifications = await Promise.all(
        customers.map((customer) =>
          this.createNotification({
            customerId: customer.id,
            type: data.type,
            title: data.title,
            message: data.message,
            icon: data.icon,
            link: data.link,
            priority: data.priority || 'normal',
          })
        )
      );

      return { count: notifications.length };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'NotificationService.sendBroadcastNotification',
      });
      throw error;
    }
  }

  /**
   * Send notification to customers with specific product in wishlist
   * @param productCode - Product code
   * @param data - Notification data (type, title, message, icon, link, priority)
   * @returns Object with count of notifications sent
   */
  async sendWishlistNotification(
    productCode: string,
    data: {
      type: 'order' | 'offer' | 'advertising' | 'promo_personalized';
      title: string;
      message: string;
      icon?: string;
      link?: string;
      priority?: 'low' | 'normal' | 'high' | 'urgent';
    }
  ): Promise<{ count: number }> {
    try {
      // Validate inputs
      if (!productCode || productCode.trim() === '') {
        throw createError('Product code is required', 400);
      }

      if (!data.type || !data.title || !data.message) {
        throw createError('Type, title, and message are required', 400);
      }

      // Get customers with this product in wishlist
      const customerIds = await this.wishlistRepository.getCustomersWithProduct(
        productCode.toUpperCase()
      );

      if (customerIds.length === 0) {
        return { count: 0 };
      }

      // Create notification for each customer
      const notifications = await Promise.all(
        customerIds.map((customerId) =>
          this.createNotification({
            customerId,
            type: data.type,
            title: data.title,
            message: data.message,
            icon: data.icon,
            link: data.link,
            priority: data.priority || 'normal',
          })
        )
      );

      return { count: notifications.length };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'NotificationService.sendWishlistNotification',
      });
      throw error;
    }
  }
}
