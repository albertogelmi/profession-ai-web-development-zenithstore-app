'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { websocketManager, NotificationEventData } from '@/lib/websocket';
import { useNotificationStore } from '@/stores/notificationStore';
import { showNotificationToast, shouldPlayAudio } from '@/lib/notifications';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * Custom hook for WebSocket connection management
 * Automatically connects when user is authenticated
 * Handles notification events and integrates with store
 */
export function useWebSocket() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const { addNotification, addUrgentNotification, playSound } = useNotificationStore();
  const hasConnected = useRef(false);
  const hasFetchedMissed = useRef(false);

  /**
   * Fetch missed notifications on reconnect
   * Accepts the backendToken explicitly so the request can be authenticated
   * via the Authorization header, avoiding any cookie timing issues.
   */
  const fetchMissedNotifications = useCallback(async (backendToken: string) => {
    if (hasFetchedMissed.current) return;

    try {
      const response = await fetch('/api/notifications?isRead=false&limit=100', {
        headers: { Authorization: `Bearer ${backendToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data?.notifications)) {
          // Add unread notifications to store (but don't show toast for old ones)
          data.data.notifications.forEach((notification: any) => {
            addNotification({
              _id: notification._id,
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
              deliveredAt: notification.deliveredAt,
              readAt: notification.readAt,
            });
          });
          logger.info(`[useWebSocket] Fetched ${data.data.notifications.length} unread notifications`);
        }
      }
      hasFetchedMissed.current = true;
    } catch (error) {
      logger.error('[useWebSocket] Failed to fetch missed notifications:', error);
    }
  }, [addNotification]);

  /**
   * Handle notification event from WebSocket
   */
  const handleNotificationRef = useRef<((data: NotificationEventData) => void) | null>(null);
  handleNotificationRef.current = (data: NotificationEventData) => {
    const notification = {
      _id: data.id,
      customerId: data.customerId,
      type: data.type,
      title: data.title,
      message: data.message,
      icon: data.icon,
      link: data.link,
      priority: data.priority,
      isRead: data.isRead,
      isDelivered: data.isDelivered,
      createdAt: data.createdAt,
      deliveredAt: data.deliveredAt,
      readAt: data.readAt,
    };

    // Add to store
    addNotification(notification);

    // Refetch to ensure data consistency
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });

    // If urgent priority, add to urgent queue for modal display
    if (data.priority === 'urgent') {
      addUrgentNotification(notification);
    }

    // Play sound for all notifications
    if (shouldPlayAudio(data.priority)) {
      playSound();
    }

    // Show toast notification with appropriate variant and duration
    logger.debug('[useWebSocket] About to show toast for notification:', {
      id: notification._id,
      type: notification.type,
      priority: notification.priority,
      title: notification.title
    });
    showNotificationToast(notification, (link) => {
      window.location.href = link;
    });
    logger.debug('[useWebSocket] Toast function called');
  };

  /**
   * Handle connect event
   */
  const handleConnectRef = useRef<(() => void) | null>(null);
  handleConnectRef.current = () => {
    logger.debug('[useWebSocket] Connected to WebSocket');
    // Fetch missed notifications on reconnect, passing the token explicitly
    if (session?.user?.backendToken) {
      fetchMissedNotifications(session.user.backendToken);
    }
  };

  /**
   * Handle disconnect event
   */
  const handleDisconnectRef = useRef<((data: { reason: string }) => void) | null>(null);
  handleDisconnectRef.current = (data: { reason: string }) => {
    logger.debug('[useWebSocket] Disconnected from WebSocket:', data.reason);
    
    // Only show toast if it was an unexpected disconnect
    if (data.reason !== 'io client disconnect') {
      toast.warning('Disconnected', {
        description: 'Attempting to reconnect...',
        duration: 3000,
      });
    }
    
    // Reset fetch flag to allow fetching on next connect
    hasFetchedMissed.current = false;
  };

  // Create stable wrapper functions
  const handleNotification = useCallback((data: NotificationEventData) => {
    handleNotificationRef.current?.(data);
  }, []);

  const handleConnect = useCallback(() => {
    handleConnectRef.current?.();
  }, []);

  const handleDisconnect = useCallback((data: { reason: string }) => {
    handleDisconnectRef.current?.(data);
  }, []);

  /**
   * Initialize WebSocket connection when authenticated
   */
  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'authenticated' && session?.user?.backendToken) {
      const token = session.user.backendToken;

      // Connect to WebSocket
      websocketManager.connect(token);
      hasConnected.current = true;

      // Register event handlers
      websocketManager.on('notification', handleNotification);
      websocketManager.on('connect', handleConnect);
      websocketManager.on('disconnect', handleDisconnect);

      // Setup heartbeat (ping every 30 seconds)
      const heartbeatInterval = setInterval(() => {
        websocketManager.ping();
      }, 30000);

      // Cleanup on unmount or session change
      return () => {
        websocketManager.off('notification', handleNotification);
        websocketManager.off('connect', handleConnect);
        websocketManager.off('disconnect', handleDisconnect);
        clearInterval(heartbeatInterval);
        websocketManager.disconnect();
        hasConnected.current = false;
        hasFetchedMissed.current = false;
      };
    } else if (status === 'unauthenticated' && hasConnected.current) {
      // Disconnect if user logs out
      websocketManager.disconnect();
      hasConnected.current = false;
      hasFetchedMissed.current = false;
    }
  }, [status, session?.user?.backendToken, handleNotification, handleConnect, handleDisconnect]);

  return {
    isConnected: websocketManager.isConnected,
    ping: () => websocketManager.ping(),
  };
}
