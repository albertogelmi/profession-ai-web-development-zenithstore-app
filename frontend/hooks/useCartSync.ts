import { useEffect } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { logger } from '@/lib/logger';

/**
 * Hook to sync cart across browser tabs
 * Listens to localStorage changes from other tabs and updates the cart store
 */
export function useCartSync() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;

    const handleStorageChange = (e: StorageEvent) => {
      // Only sync if the cart storage key changed
      if (e.key !== 'zenithstore-cart-storage') return;
      
      // Ignore if change is from the same tab (newValue will be null on removeItem)
      if (e.storageArea !== localStorage) return;

      try {
        if (e.newValue) {
          const newState = JSON.parse(e.newValue);
          
          // Update store with new state from other tab
          if (newState && newState.state) {
            logger.debug('[CartSync] Syncing cart from another tab', {
              items: newState.state.items?.length || 0,
            });
            
            // Use setItems to update without triggering another storage event
            useCartStore.setState({
              items: newState.state.items || [],
              lastUpdate: newState.state.lastUpdate || Date.now(),
            });
          }
        } else {
          // Cart was cleared in another tab
          logger.debug('[CartSync] Cart cleared in another tab');
          useCartStore.setState({
            items: [],
            lastUpdate: Date.now(),
          });
        }
      } catch (error) {
        logger.error('[CartSync] Error syncing cart:', error);
      }
    };

    // Listen to storage events (fires when localStorage changes in OTHER tabs)
    window.addEventListener('storage', handleStorageChange);

    logger.info('[CartSync] Cross-tab synchronization enabled');

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      logger.debug('[CartSync] Cross-tab synchronization disabled');
    };
  }, []);
}
