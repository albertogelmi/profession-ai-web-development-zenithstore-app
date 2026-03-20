'use client';

import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Bell, CheckCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, isLoading, error } = useNotifications({
    limit: 5,
    page: 1,
  });
  
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllAsRead();

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const hasUnread = unreadNotifications.length > 0;

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleViewAll = () => {
    onClose();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Errore nel caricamento delle notifiche
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-muted p-4 mb-3">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">Nessuna notifica</p>
        <p className="text-xs text-muted-foreground">
          Ti avviseremo quando arriveranno nuove notifiche
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="font-semibold text-sm">Notifiche</h3>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
            className="h-7 text-xs"
          >
            <CheckCheck className="mr-1 h-3 w-3" />
            Segna tutte
          </Button>
        )}
      </div>
      
      <Separator />

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[450px]">
        {notifications.slice(0, 5).map((notification) => (
          <div key={notification._id}>
            <NotificationItem notification={notification} onClose={onClose} />
            <Separator />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center gap-2"
          onClick={handleViewAll}
          asChild
        >
          <Link href="/notifications">
            Vedi tutte le notifiche
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
