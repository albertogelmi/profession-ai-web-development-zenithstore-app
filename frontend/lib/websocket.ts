import { io, Socket } from 'socket.io-client';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export type NotificationEventData = {
  id: string;
  customerId: number;
  type: 'order' | 'offer' | 'advertising' | 'promo_personalized';
  title: string;
  message: string;
  icon: string;
  link?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  isDelivered: boolean;
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
};

export type WebSocketEventHandler = (data: any) => void;

/**
 * WebSocket Manager - Singleton for Socket.io connection
 * Handles authentication, events, and reconnection
 */
class WebSocketManager {
  private socket: Socket | null = null;
  private token: string | null = null;
  private isInitialized = false;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();

  /**
   * Initialize WebSocket connection with JWT token
   * @param backendToken - JWT token from NextAuth session
   */
  connect(backendToken: string): void {
    if (this.socket?.connected && this.token === backendToken) {
      logger.debug('[WebSocketManager.connect] WebSocket already connected');
      return;
    }

    // Disconnect existing connection if token changed
    if (this.socket && this.token !== backendToken) {
      logger.info('[WebSocketManager.connect] Token changed, reconnecting...');
      this.disconnect();
    }

    this.token = backendToken;

    this.socket = io(BACKEND_URL, {
      auth: {
        token: backendToken,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
    });

    this.setupEventListeners();
    this.isInitialized = true;

    logger.info('[WebSocketManager.connect] WebSocket connection initialized');
  }

  /**
   * Setup internal Socket.io event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      logger.debug('[WebSocketManager.setupEventListeners] WebSocket connected', this.socket?.id);
      this.emit('connect', { timestamp: new Date().toISOString() });
    });

    this.socket.on('disconnect', (reason: string) => {
      logger.debug('[WebSocketManager.setupEventListeners] WebSocket disconnected:', reason);
      this.emit('disconnect', { reason, timestamp: new Date().toISOString() });
    });

    this.socket.on('connect_error', (error: Error) => {
      logger.error('[WebSocketManager.setupEventListeners] WebSocket connection error:', error.message);
      this.emit('error', { error: error.message, timestamp: new Date().toISOString() });
    });

    // Handle notification events from backend
    this.socket.on('notification', (data: any) => {
      logger.debug('[WebSocketManager.setupEventListeners] Notification received:', data);
      const notificationData = data.notification || data;
      
      const mappedData: NotificationEventData = {
        id: notificationData._id || notificationData.id,
        customerId: notificationData.customerId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        icon: notificationData.icon,
        link: notificationData.link,
        priority: notificationData.priority,
        isRead: notificationData.isRead,
        isDelivered: notificationData.isDelivered,
        createdAt: notificationData.createdAt,
        deliveredAt: notificationData.deliveredAt,
        readAt: notificationData.readAt,
      };
      
      this.emit('notification', mappedData);
    });

    // Handle order.paid events (for future use if needed)
    this.socket.on('order.paid', (payload: any) => {
      logger.debug('[WebSocketManager.setupEventListeners] Order paid event received:', payload);
      // Extract the actual data from the payload wrapper
      const eventData = payload.data || payload;
      logger.debug('[WebSocketManager.setupEventListeners] Extracted event data:', eventData);
      logger.debug('[WebSocketManager.setupEventListeners] Emitting order-update event to listeners');
      this.emit('order-update', eventData);
      logger.debug('[WebSocketManager.setupEventListeners] order-update event emitted');
    });

    // Handle pong response for heartbeat
    this.socket.on('pong', (data: any) => {
      logger.debug('[WebSocketManager.setupEventListeners] Pong received:', data);
    });
  }

  /**
   * Disconnect WebSocket connection
   */
  disconnect(): void {
    if (this.socket) {
      logger.debug('[WebSocketManager.disconnect] Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
      this.isInitialized = false;
      this.eventHandlers.clear();
    }
  }

  /**
   * Register event handler
   * @param event - Event name
   * @param handler - Event handler function
   */
  on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
    logger.debug(`[WebSocketManager.on] Registered handler for event: ${event} (Total: ${this.eventHandlers.get(event)!.size})`);
  }

  /**
   * Unregister event handler
   * @param event - Event name
   * @param handler - Event handler function
   */
  off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
      logger.debug(`[WebSocketManager.off] Unregistered handler for event: ${event} (Remaining: ${handlers.size})`);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
        logger.debug(`[WebSocketManager.off] No more handlers for event: ${event}, removed from map`);
      }
    }
  }

  /**
   * Emit event to registered handlers
   * @param event - Event name
   * @param data - Event data
   */
  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    logger.debug(`[WebSocketManager.emit] Event: ${event}, Handlers: ${handlers?.size || 0}`);
    if (handlers) {
      handlers.forEach((handler) => {
        logger.debug(`[WebSocketManager.emit] Calling handler for event: ${event}`);
        handler(data);
      });
    } else {
      logger.warn(`[WebSocketManager.emit] No handlers registered for event: ${event}`);
    }
  }

  /**
   * Send ping to server (heartbeat)
   */
  ping(): void {
    if (this.socket?.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Check if WebSocket is connected
   */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get Socket.io instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket;
  }
}

// Singleton instance
export const websocketManager = new WebSocketManager();
