'use client';

import { Bell, Clock } from 'lucide-react';
import { Notification } from '@/stores/notificationStore';
import { useMarkAsRead } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

/**
 * Compact notification item for dropdown
 * Optimized for space with truncated message and relative time
 */
export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { mutate: markAsRead } = useMarkAsRead();
  const router = useRouter();

  const handleClick = () => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification._id);
    }

    // Close dropdown
    onClose?.();

    // Navigate to link if present
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: it,
  });

  return (
    <div
      className={cn(
        'flex gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer border-l-2',
        !notification.isRead ? 'bg-primary/5 border-l-primary' : 'border-l-transparent'
      )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        {notification.icon ? (
          <span className="text-xl">{notification.icon}</span>
        ) : (
          <Bell className="h-5 w-5 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-medium leading-tight line-clamp-1">
            {notification.title}
          </h4>
          {!notification.isRead && (
            <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2">
          {notification.message}
        </p>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}
