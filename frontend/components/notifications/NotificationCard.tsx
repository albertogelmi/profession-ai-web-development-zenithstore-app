'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  Package, 
  Tag, 
  Megaphone,
  Clock,
  ExternalLink,
  AlertCircle,
  Info,
  Zap
} from 'lucide-react';
import { Notification } from '@/stores/notificationStore';
import { useMarkAsRead } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NotificationCardProps {
  notification: Notification;
  compact?: boolean;
}

const typeIcons = {
  order: Package,
  offer: Tag,
  advertising: Megaphone,
  promo_personalized: Tag,
};

const priorityColors = {
  low: 'text-muted-foreground',
  normal: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
};

const priorityIcons = {
  low: Info,
  normal: Bell,
  high: AlertCircle,
  urgent: Zap,
};

export function NotificationCard({ notification, compact = false }: NotificationCardProps) {
  const { mutate: markAsRead } = useMarkAsRead();
  const router = useRouter();
  
  const TypeIcon = typeIcons[notification.type] || Bell;
  const PriorityIcon = priorityIcons[notification.priority];
  const priorityColor = priorityColors[notification.priority];
  
  const formattedDate = new Date(notification.createdAt).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: compact ? undefined : 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleClick = () => {
    // Mark as read if unread
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Navigate to link if present
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        !notification.isRead && 'bg-primary/5 border-primary/20',
        notification.link && 'cursor-pointer',
        compact && 'shadow-none border-0 rounded-none'
      )}
      onClick={handleClick}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        <div className="flex gap-3">
          {/* Icon */}
          <div className={cn(
            'flex-shrink-0 mt-1',
            priorityColor
          )}>
            {notification.icon ? (
              <span className={compact ? 'text-xl' : 'text-2xl'}>{notification.icon}</span>
            ) : (
              <TypeIcon className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header with title and badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className={cn('font-semibold leading-tight', compact ? 'text-xs' : 'text-sm')}>
                  {notification.title}
                </h3>
              </div>
              
              <div className="flex items-center gap-1 flex-shrink-0">
                {!notification.isRead && (
                  <Badge variant="default" className="text-xs">
                    Nuovo
                  </Badge>
                )}
                
                {notification.priority === 'urgent' && (
                  <PriorityIcon className={cn('h-4 w-4', priorityColor)} />
                )}
              </div>
            </div>

            {/* Message */}
            <p className={cn(
              'text-muted-foreground leading-relaxed',
              compact ? 'text-xs line-clamp-2' : 'text-sm'
            )}>
              {notification.message}
            </p>

            {/* Footer with timestamp and link indicator */}
            {!compact && (
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formattedDate}</span>
                </div>
                
                {notification.link && (
                  <div className="flex items-center gap-1 text-primary">
                    <ExternalLink className="h-3 w-3" />
                    <span className="font-medium">Visualizza</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Compact timestamp */}
            {compact && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formattedDate}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
