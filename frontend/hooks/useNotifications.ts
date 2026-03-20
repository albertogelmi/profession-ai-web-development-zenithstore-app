import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { useNotificationStore, type Notification } from '@/stores/notificationStore';
import { logger } from '@/lib/logger';

interface FetchNotificationsParams {
  isRead?: boolean;
  limit?: number;
  page?: number;
}

interface NotificationsResponse {
  success: boolean;
  message: string;
  data: {
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  };
}

interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

interface MarkAllAsReadResponse {
  success: boolean;
  message: string;
  data: {
    count: number;
  };
}

/**
 * Fetch notifications from API
 */
async function fetchNotifications(params?: FetchNotificationsParams) {
  const queryParams: Record<string, string> = {};
  
  if (params?.isRead !== undefined) {
    queryParams.isRead = String(params.isRead);
  }
  if (params?.limit) {
    queryParams.limit = String(params.limit);
  }
  if (params?.page) {
    queryParams.page = String(params.page);
  }
  
  const response = await apiClient.get<NotificationsResponse>(
    '/notifications',
    { params: queryParams as any }
  );
  
  return response.data;
}

/**
 * Fetch unread count
 */
async function fetchUnreadCount() {
  const response = await apiClient.get<UnreadCountResponse>(
    '/notifications/unread-count'
  );
  return response.data.count;
}

/**
 * Fetch total count (all notifications)
 */
async function fetchTotalCount() {
  const response = await apiClient.get<NotificationsResponse>(
    '/notifications',
    { params: { limit: '1', page: '1' } as any }
  );
  return response.data.total;
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(id: string) {
  await apiClient.patch(`/notifications/${id}/read`);
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead() {
  const response = await apiClient.patch<MarkAllAsReadResponse>(
    '/notifications/mark-all-read'
  );
  return response.data.count;
}

/**
 * Hook to fetch notifications with filters and pagination
 */
export function useNotifications(params?: FetchNotificationsParams) {
  const queryClient = useQueryClient();
  const setNotifications = useNotificationStore((state) => state.setNotifications);
  
  const query = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => fetchNotifications(params),
    staleTime: 30 * 1000, // 30 seconds
  });

  // Sync with Zustand store when data changes
  useEffect(() => {
    if (query.data?.notifications) {
      setNotifications(query.data.notifications);
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    }
  }, [query.data, setNotifications, queryClient]);

  return {
    ...query,
    notifications: query.data?.notifications || [],
    total: query.data?.total || 0,
    page: query.data?.page || 1,
    totalPages: query.data?.totalPages || 1,
  };
}

/**
 * Hook to get unread count
 */
export function useUnreadCount(enabled: boolean = true) {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    enabled,
  });
}

/**
 * Hook to get total count (all notifications)
 */
export function useTotalCount(enabled: boolean = true) {
  return useQuery({
    queryKey: ['notifications', 'total-count'],
    queryFn: fetchTotalCount,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    enabled,
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  
  return useMutation({
    mutationFn: markNotificationAsRead,
    
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(['notifications']);
      
      // Optimistic update in store
      markAsRead(id);
      
      return { previousData };
    },
    
    onError: (error, id, context) => {
      logger.error('Failed to mark notification as read:', error);
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications'], context.previousData);
      }
    },
    
    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  
  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      
      // Snapshot previous value
      const previousData = queryClient.getQueryData(['notifications']);
      
      // Optimistic update in store
      markAllAsRead();
      
      return { previousData };
    },
    
    onError: (error, _, context) => {
      logger.error('Failed to mark all notifications as read:', error);
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['notifications'], context.previousData);
      }
    },
    
    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}
