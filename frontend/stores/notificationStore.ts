import { create } from 'zustand';
import { logger } from '@/lib/logger';

export interface Notification {
  _id: string;
  customerId: number;
  type: 'order' | 'offer' | 'advertising' | 'promo_personalized';
  title: string;
  message: string;
  icon?: string;
  link?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  isDelivered: boolean;
  createdAt: Date | string;
  deliveredAt?: Date | string;
  readAt?: Date | string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  urgentNotifications: Notification[];
  currentUrgentNotification: Notification | null;
  // Actions
  addNotification: (notification: Notification) => void;
  addNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  removeNotification: (id: string) => void;
  setNotifications: (notifications: Notification[]) => void;
  playSound: (priority?: 'low' | 'normal' | 'high' | 'urgent') => void;
  addUrgentNotification: (notification: Notification) => void;
  removeUrgentNotification: (id: string) => void;
  // Helpers
  getUnreadNotifications: () => Notification[];
  getNotificationById: (id: string) => Notification | undefined;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  urgentNotifications: [],
  
  get unreadCount() {
    return get().notifications.filter((n) => !n.isRead).length;
  },
  
  get currentUrgentNotification() {
    return get().urgentNotifications[0] || null;
  },
  
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
  },
  
  addNotifications: (notifications) => {
    set((state) => ({
      notifications: [...notifications, ...state.notifications],
    }));
  },
  
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true, readAt: new Date() } : n
      ),
    }));
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({
        ...n,
        isRead: true,
        readAt: n.readAt || new Date(),
      })),
    }));
  },
  
  clearAll: () => {
    set({ notifications: [] });
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n._id !== id),
    }));
  },
  
  setNotifications: (notifications) => {
    set({ notifications });
  },
  
  playSound: (priority) => {
    // Play notification sound for all notifications
    if (typeof window !== 'undefined') {
      const audio = new Audio('/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch((error) => {
        logger.warn('[Notification] Unable to play notification sound:', error);
      });
    }
  },
  
  addUrgentNotification: (notification) => {
    set((state) => ({
      urgentNotifications: [...state.urgentNotifications, notification],
    }));
  },
  
  removeUrgentNotification: (id) => {
    set((state) => ({
      urgentNotifications: state.urgentNotifications.filter((n) => n._id !== id),
    }));
  },
  
  getUnreadNotifications: () => {
    return get().notifications.filter((n) => !n.isRead);
  },
  
  getNotificationById: (id) => {
    return get().notifications.find((n) => n._id === id);
  },
}));

