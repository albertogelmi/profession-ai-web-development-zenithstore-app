'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';
import { useMarkAsRead } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, ExternalLink, X } from 'lucide-react';

/**
 * Modal for displaying urgent priority notifications
 * Shows full notification content with actions
 * Supports queue for multiple urgent notifications
 */
export function NotificationModal() {
  const router = useRouter();
  const { mutate: markAsRead } = useMarkAsRead();
  const { 
    urgentNotifications, 
    removeUrgentNotification, 
    currentUrgentNotification 
  } = useNotificationStore();

  const notification = currentUrgentNotification;

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (notification) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [notification]);

  const handleClose = () => {
    if (notification) {
      // Mark as read
      if (!notification.isRead) {
        markAsRead(notification._id);
      }
      // Remove from queue
      removeUrgentNotification(notification._id);
    }
  };

  const handleView = () => {
    if (notification) {
      // Mark as read
      if (!notification.isRead) {
        markAsRead(notification._id);
      }
      // Remove from queue
      removeUrgentNotification(notification._id);
      // Navigate to link
      if (notification.link) {
        router.push(notification.link);
      }
    }
  };

  if (!notification) {
    return null;
  }

  return (
    <Dialog open={!!notification} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="sm:max-w-md backdrop-blur-sm"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                {notification.icon ? (
                  <span className="text-3xl">{notification.icon}</span>
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold">
                {notification.title}
              </DialogTitle>
              {urgentNotifications.length > 1 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {urgentNotifications.length} notifiche urgenti in coda
                </p>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogDescription className="text-base text-foreground py-4">
          {notification.message}
        </DialogDescription>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            <X className="mr-2 h-4 w-4" />
            OK
          </Button>
          {notification.link && (
            <Button
              type="button"
              onClick={handleView}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visualizza
            </Button>
          )}
        </DialogFooter>

        {urgentNotifications.length > 1 && (
          <div className="text-center text-xs text-muted-foreground border-t pt-3">
            Dopo questa, verranno mostrate altre {urgentNotifications.length - 1} notifiche
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
