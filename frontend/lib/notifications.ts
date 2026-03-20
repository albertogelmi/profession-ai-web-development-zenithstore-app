import { toast } from 'sonner';
import type { Notification } from '@/stores/notificationStore';
import { logger } from '@/lib/logger';

/**
 * Toast notification type variants mapping
 */
const TYPE_VARIANTS = {
  order: 'success' as const,
  offer: 'info' as const,
  advertising: 'default' as const,
  promo_personalized: 'warning' as const,
};

/**
 * Priority duration mapping (in milliseconds)
 */
const PRIORITY_DURATIONS = {
  low: 3000,      // 3 seconds
  normal: 5000,   // 5 seconds
  high: 7000,     // 7 seconds
  urgent: 10000,  // 10 seconds
};

/**
 * Show toast notification with appropriate variant and duration
 * Maps notification type to toast variant and priority to duration
 * 
 * @param notification - Notification object to display
 * @param onAction - Optional callback when action button is clicked
 */
export function showNotificationToast(
  notification: Notification,
  onAction?: (link: string) => void
): void {
  logger.info('[showNotificationToast] Called with:', {
    id: notification._id,
    type: notification.type,
    priority: notification.priority,
    title: notification.title,
    message: notification.message
  });
  
  const variant = TYPE_VARIANTS[notification.type] || 'default';
  const duration = PRIORITY_DURATIONS[notification.priority];

  logger.debug('[showNotificationToast] Toast config:', { variant, duration });

  const toastOptions = {
    description: notification.message,
    icon: notification.icon,
    duration,
    action: notification.link
      ? {
          label: 'Visualizza',
          onClick: () => {
            if (onAction && notification.link) {
              onAction(notification.link);
            }
          },
        }
      : undefined,
  };

  logger.debug('[showNotificationToast] Calling toast variant:', { variant });
  
  // Call appropriate toast variant
  try {
    switch (variant) {
      case 'success':
        toast.success(notification.title, toastOptions);
        logger.debug('[showNotificationToast] toast.success called');
        break;
      case 'info':
        toast.info(notification.title, toastOptions);
        logger.debug('[showNotificationToast] toast.info called');
        break;
      case 'warning':
        toast.warning(notification.title, toastOptions);
        logger.debug('[showNotificationToast] toast.warning called');
        break;
      default:
        toast(notification.title, toastOptions);
        logger.debug('[showNotificationToast] toast (default) called');
    }
  } catch (error) {
    logger.error('[showNotificationToast] Error calling toast:', error);
  }
}

/**
 * Check if audio should play for notification based on priority
 * Audio plays for all notifications
 * 
 * @param priority - Notification priority
 * @returns true if audio should play
 */
export function shouldPlayAudio(
  priority: 'low' | 'normal' | 'high' | 'urgent'
): boolean {
  return true;
}
