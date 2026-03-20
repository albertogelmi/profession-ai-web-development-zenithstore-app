'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUnreadCount } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

export function NotificationBell() {
  const { data: session, status } = useSession();
  const { data: unreadCount, isLoading } = useUnreadCount(status === 'authenticated');
  const [isOpen, setIsOpen] = useState(false);
  
  const count = unreadCount || 0;
  const hasUnread = count > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {!isLoading && hasUnread && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 p-0 animate-in slide-in-from-top-2">
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
