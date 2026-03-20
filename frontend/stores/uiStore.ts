import { create } from 'zustand';

interface UIStore {
  // Mobile menu
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  openMobileMenu: () => void;
  
  // Cart drawer
  isCartOpen: boolean;
  toggleCart: () => void;
  closeCart: () => void;
  openCart: () => void;
  
  // Notification panel
  isNotificationPanelOpen: boolean;
  toggleNotificationPanel: () => void;
  closeNotificationPanel: () => void;
  openNotificationPanel: () => void;
  
  // Notification modal
  selectedNotificationId: string | null;
  openNotificationModal: (id: string) => void;
  closeNotificationModal: () => void;
  
  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
  
  // Close all panels
  closeAll: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Mobile menu
  isMobileMenuOpen: false,
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  
  // Cart drawer
  isCartOpen: false,
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  closeCart: () => set({ isCartOpen: false }),
  openCart: () => set({ isCartOpen: true }),
  
  // Notification panel
  isNotificationPanelOpen: false,
  toggleNotificationPanel: () => set((state) => ({ isNotificationPanelOpen: !state.isNotificationPanelOpen })),
  closeNotificationPanel: () => set({ isNotificationPanelOpen: false }),
  openNotificationPanel: () => set({ isNotificationPanelOpen: true }),
  
  // Notification modal
  selectedNotificationId: null,
  openNotificationModal: (id) => set({ selectedNotificationId: id }),
  closeNotificationModal: () => set({ selectedNotificationId: null }),
  
  // Loading states
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),
  
  // Close all panels
  closeAll: () => set({
    isMobileMenuOpen: false,
    isCartOpen: false,
    isNotificationPanelOpen: false,
    selectedNotificationId: null,
  }),
}));
