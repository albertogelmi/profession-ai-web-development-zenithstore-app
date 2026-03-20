import { Notification, INotification } from '../../entities/mongodb/Notification';
import { errorEmitter } from '../../utils/errorEmitter';

/**
 * Notification Repository
 * Handles all database operations for customer notifications
 */
export class NotificationRepository {
  
  /**
   * Create a new notification
   */
  async create(notificationData: Partial<INotification>): Promise<INotification> {
    try {
      const notification = new Notification(notificationData);
      return await notification.save();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'NotificationRepository.create',
      });
      throw error;
    }
  }

  /**
   * Find notifications by customer ID with filters and pagination
   */
  async findByCustomerId(
    customerId: number,
    filters?: {
      isRead?: boolean;
      limit?: number;
      page?: number;
    }
  ): Promise<{ notifications: INotification[]; total: number }> {
    try {
      const query: any = { customerId };
      
      if (filters?.isRead !== undefined) {
        query.isRead = filters.isRead;
      }

      const limit = filters?.limit || 20;
      const page = filters?.page || 1;
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip(skip)
          .select('-__v'),
        Notification.countDocuments(query),
      ]);

      return { notifications, total };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'NotificationRepository.findByCustomerId',
      });
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<INotification | null> {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) return null;

      notification.isRead = true;
      notification.readAt = new Date();
      
      return await notification.save();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'NotificationRepository.markAsRead',
      });
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a customer
   */
  async markAllAsRead(customerId: number): Promise<number> {
    try {
      const result = await Notification.updateMany(
        { customerId, isRead: false },
        { 
          $set: { 
            isRead: true, 
            readAt: new Date() 
          } 
        }
      );
      
      return result.modifiedCount;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'NotificationRepository.markAllAsRead',
      });
      throw error;
    }
  }

  /**
   * Get unread count for a customer
   */
  async getUnreadCount(customerId: number): Promise<number> {
    try {
      return await Notification.countDocuments({
        customerId,
        isRead: false,
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'NotificationRepository.getUnreadCount',
      });
      throw error;
    }
  }
}
