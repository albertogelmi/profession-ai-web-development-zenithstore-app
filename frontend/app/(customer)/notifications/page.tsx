'use client';

import { useState } from 'react';
import { useNotifications, useUnreadCount, useTotalCount, useMarkAllAsRead } from '@/hooks/useNotifications';
import { NotificationCard } from '@/components/notifications/NotificationCard';
import { NotificationFilters } from '@/components/notifications/NotificationFilters';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export default function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const isReadFilter = filter === 'unread' ? false : undefined;
  
  const { 
    notifications, 
    total, 
    totalPages,
    isLoading, 
    error 
  } = useNotifications({
    isRead: isReadFilter,
    limit: ITEMS_PER_PAGE,
    page: currentPage,
  });
  
  const { data: unreadCountData } = useUnreadCount();
  const { data: totalCountData } = useTotalCount();
  const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMarkAllAsRead();
  
  const unreadCount = unreadCountData || 0;
  const totalCount = totalCountData || 0;

  const handleFilterChange = (newFilter: 'all' | 'unread') => {
    setFilter(newFilter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Errore nel caricamento delle notifiche. Riprova più tardi.
        </AlertDescription>
      </Alert>
    );
  }

  const hasNotifications = notifications && notifications.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifiche</h1>
          <p className="text-muted-foreground mt-2">
            {totalCount > 0
              ? `${totalCount} ${totalCount === 1 ? 'notifica' : 'notifiche'}`
              : 'Nessuna notifica'}
          </p>
        </div>
        
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAllAsRead}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Segna tutte come lette
          </Button>
        )}
      </div>

      {/* Filters */}
      <NotificationFilters
        value={filter}
        onValueChange={handleFilterChange}
        unreadCount={unreadCount}
        totalCount={totalCount}
      />

      {/* Notifications List or Empty State */}
      {hasNotifications ? (
        <>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationCard key={notification._id} notification={notification} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Precedente
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1);

                  if (!showPage) {
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Successiva
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Bell className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {filter === 'unread' ? 'Nessuna notifica non letta' : 'Nessuna notifica'}
          </h2>
          <p className="text-muted-foreground max-w-md">
            {filter === 'unread'
              ? 'Tutte le tue notifiche sono state lette. Ottimo lavoro!'
              : 'Non hai ancora ricevuto notifiche. Ti avviseremo quando ci saranno aggiornamenti!'}
          </p>
        </div>
      )}
    </div>
  );
}
