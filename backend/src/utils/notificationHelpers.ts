import { NotificationService } from '../services/NotificationService';
import { getWebSocketManager } from './websocketManager';
import { errorEmitter } from './errorEmitter';

/**
 * Helper functions for creating and emitting order notifications
 */

const notificationService = new NotificationService();

/**
 * Creates an order notification and emits it via WebSocket
 * @param customerId - Customer ID
 * @param orderId - Order ID
 * @param title - Notification title
 * @param message - Notification message
 * @param priority - Notification priority (default: 'normal')
 * @returns Created notification or null if error
 */
export async function createOrderNotification(
  customerId: number,
  orderId: number,
  title: string,
  message: string,
  priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
): Promise<void> {
  try {
    // Create notification in MongoDB
    const notification = await notificationService.createNotification({
      customerId,
      type: 'order',
      title,
      message,
      icon: '📦',
      link: `/orders/${orderId}`,
      priority,
    });

    // Emit via WebSocket to customer (if connected)
    try {
      const websocketManager = getWebSocketManager();
      websocketManager.emitToCustomer(customerId.toString(), 'notification', {
        type: 'notification',
        notification: {
          _id: notification._id.toString(),
          customerId: notification.customerId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          icon: notification.icon,
          link: notification.link,
          priority: notification.priority,
          isRead: notification.isRead,
          isDelivered: notification.isDelivered,
          createdAt: notification.createdAt,
        },
      });
    } catch (wsError) {
      // Log WebSocket error but don't block notification creation
      errorEmitter.emitBusinessError(wsError as Error, {
        path: 'notificationHelpers.createOrderNotification.websocket',
      });
    }
  } catch (error) {
    // Log error but don't block main operation
    errorEmitter.emitBusinessError(error as Error, {
      path: 'notificationHelpers.createOrderNotification',
    });
  }
}
