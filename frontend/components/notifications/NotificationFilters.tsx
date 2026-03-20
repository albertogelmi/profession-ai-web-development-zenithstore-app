'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface NotificationFiltersProps {
  value: 'all' | 'unread';
  onValueChange: (value: 'all' | 'unread') => void;
  unreadCount: number;
  totalCount: number;
}

export function NotificationFilters({
  value,
  onValueChange,
  unreadCount,
  totalCount,
}: NotificationFiltersProps) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as 'all' | 'unread')}>
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="all" className="gap-2">
          Tutte
          {totalCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {totalCount}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="unread" className="gap-2">
          Non lette
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-1">
              {unreadCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
