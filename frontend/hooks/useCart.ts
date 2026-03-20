import { useCartStore, type CartItem } from '@/stores/cartStore';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';

/**
 * Custom hook for cart management
 * Cart is managed entirely on frontend using localStorage
 * Cart is sent to backend only at checkout via POST /api/orders/checkout
 */
export function useCart() {
  const items = useCartStore((state) => state.items);
  const addItemToStore = useCartStore((state) => state.addItem);
  const removeItemFromStore = useCartStore((state) => state.removeItem);
  const updateQuantityInStore = useCartStore((state) => state.updateQuantity);
  const clearCartFromStore = useCartStore((state) => state.clearCart);
  const getItem = useCartStore((state) => state.getItem);
  const hasItem = useCartStore((state) => state.hasItem);

  // Calculate itemCount and total as derived values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  /**
   * Add item to cart (localStorage only)
   */
  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    logger.info("[useCart.addItem] Adding item to cart", {
      productCode: item.productCode,
      quantity: item.quantity ?? 1,
    });

    addItemToStore(item);
    logger.debug("[useCart.addItem] Item added to localStorage");
  }, [addItemToStore]);

  /**
   * Remove item from cart (localStorage only)
   */
  const removeItem = useCallback((productCode: string) => {
    removeItemFromStore(productCode);
    logger.debug("[useCart.removeItem] Item removed from localStorage", { productCode });
  }, [removeItemFromStore]);

  /**
   * Update quantity in cart (localStorage only)
   */
  const updateQuantity = useCallback((productCode: string, quantity: number) => {
    updateQuantityInStore(productCode, quantity);
    logger.debug("[useCart.updateQuantity] Quantity updated in localStorage", { productCode, quantity });
  }, [updateQuantityInStore]);

  /**
   * Clear cart (localStorage only)
   */
  const clearCart = useCallback(() => {
    clearCartFromStore();
    logger.debug("[useCart.clearCart] Cart cleared from localStorage");
  }, [clearCartFromStore]);

  const incrementQuantity = useCallback((productCode: string) => {
    const item = getItem(productCode);
    if (item) {
      updateQuantity(productCode, item.quantity + 1);
    }
  }, [getItem, updateQuantity]);

  const decrementQuantity = useCallback((productCode: string) => {
    const item = getItem(productCode);
    if (item && item.quantity > 1) {
      updateQuantity(productCode, item.quantity - 1);
    } else if (item && item.quantity === 1) {
      removeItem(productCode);
    }
  }, [getItem, updateQuantity, removeItem]);
  
  const isEmpty = items.length === 0;
  
  return {
    items,
    itemCount,
    total,
    isEmpty,
    addItem,
    removeItem,
    updateQuantity,
    incrementQuantity,
    decrementQuantity,
    clearCart,
    getItem,
    hasItem,
  };
}

