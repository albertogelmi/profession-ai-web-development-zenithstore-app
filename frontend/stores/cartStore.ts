import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/logger';

/**
 * Cart item interface
 * Cart is managed entirely on frontend using localStorage
 */
export interface CartItem {
  productCode: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  maxQuantity?: number; // availableQuantity - reservedQuantity - safetyStock
}

interface CartStore {
  items: CartItem[];
  lastUpdate: number;
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productCode: string) => void;
  updateQuantity: (productCode: string, quantity: number) => void;
  updateMaxQuantity: (productCode: string, maxQuantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  checkCartExpiration: () => void;
  // Helpers
  getItem: (productCode: string) => CartItem | undefined;
  hasItem: (productCode: string) => boolean;
}

/**
 * Cart store using localStorage for persistent cart storage
 * No backend synchronization - cart is sent to backend only at checkout
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      lastUpdate: Date.now(),
      
      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find((i) => i.productCode === item.productCode);
        
        if (existingItem) {
          // Update quantity if item exists
          const newQuantity = existingItem.quantity + (item.quantity || 1);
          const maxQty = item.maxQuantity ?? existingItem.maxQuantity ?? 999;
          
          set({
            items: items.map((i) =>
              i.productCode === item.productCode
                ? { ...i, quantity: Math.min(newQuantity, maxQty), maxQuantity: item.maxQuantity ?? i.maxQuantity }
                : i
            ),
            lastUpdate: Date.now(),
          });
        } else {
          // Add new item
          const newItem: CartItem = {
            ...item,
            quantity: item.quantity || 1,
          };
          set({ items: [...items, newItem], lastUpdate: Date.now() });
        }
      },
      
      removeItem: (productCode) => {
        set({ items: get().items.filter((i) => i.productCode !== productCode), lastUpdate: Date.now() });
      },
      
      updateQuantity: (productCode, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productCode);
          return;
        }
        
        set({
          items: get().items.map((i) => {
            if (i.productCode === productCode) {
              const maxQty = i.maxQuantity ?? 999;
              return { ...i, quantity: Math.min(quantity, maxQty) };
            }
            return i;
          }),
          lastUpdate: Date.now(),
        });
      },
      
      updateMaxQuantity: (productCode, maxQuantity) => {
        set({
          items: get().items.map((i) => {
            if (i.productCode === productCode) {
              // If current quantity exceeds new max, adjust it
              const newQuantity = Math.min(i.quantity, maxQuantity);
              return { ...i, maxQuantity, quantity: newQuantity };
            }
            return i;
          }),
          lastUpdate: Date.now(),
        });
      },
      
      clearCart: () => {
        set({ items: [], lastUpdate: Date.now() });
      },
      
      setItems: (items) => {
        set({ items, lastUpdate: Date.now() });
      },
      
      checkCartExpiration: () => {
        const { lastUpdate, items } = get();
        const now = Date.now();
        const expirationHours = Number(process.env.NEXT_PUBLIC_CART_EXPIRATION_HOURS) || 72;
        const expirationMs = expirationHours * 60 * 60 * 1000;
        
        const isExpired = now - lastUpdate > expirationMs;
        
        if (isExpired && items.length > 0) {
          logger.info(`[CartStore] Cart expired after ${expirationHours}h - completely removed`);
          set({ items: [], lastUpdate: Date.now() });
        }
      },
      
      getItem: (productCode) => {
        return get().items.find((i) => i.productCode === productCode);
      },
      
      hasItem: (productCode) => {
        return get().items.some((i) => i.productCode === productCode);
      },
    }),
    {
      name: 'zenithstore-cart-storage',
      version: 1,
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
      onRehydrateStorage: () => (state) => {
        // Check for cart expiration on rehydration
        if (state) {
          logger.info('[CartStore] Rehydrating cart from localStorage, checking expiration...');
          state.checkCartExpiration();
        }
      },
    }
  )
);
