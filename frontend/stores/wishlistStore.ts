import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistProduct {
  productCode: string;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  imageUrl?: string;
  categoryName?: string;
  stockQuantity?: number;
}

export interface WishlistItem {
  id: number;
  customerId: number;
  productCode: string;
  addedAt: string;
  product: WishlistProduct;
}

interface WishlistStore {
  items: WishlistItem[];
  productCodes: Set<string>;
  
  // Actions
  setWishlist: (items: WishlistItem[]) => void;
  addItem: (item: WishlistItem) => void;
  removeItem: (productCode: string) => void;
  clearWishlist: () => void;
  
  // Helpers
  isInWishlist: (productCode: string) => boolean;
  getItem: (productCode: string) => WishlistItem | undefined;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      productCodes: new Set<string>(),
      
      setWishlist: (items) => {
        set({
          items,
          productCodes: new Set(items.map(item => item.productCode)),
        });
      },
      
      addItem: (item) => {
        const { items } = get();
        
        // Check if already exists
        if (items.some(i => i.productCode === item.productCode)) {
          return;
        }
        
        const newItems = [...items, item];
        set({
          items: newItems,
          productCodes: new Set(newItems.map(i => i.productCode)),
        });
      },
      
      removeItem: (productCode) => {
        const newItems = get().items.filter(i => i.productCode !== productCode);
        set({
          items: newItems,
          productCodes: new Set(newItems.map(i => i.productCode)),
        });
      },
      
      clearWishlist: () => {
        set({
          items: [],
          productCodes: new Set(),
        });
      },
      
      isInWishlist: (productCode) => {
        return get().productCodes.has(productCode);
      },
      
      getItem: (productCode) => {
        return get().items.find(i => i.productCode === productCode);
      },
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({
        items: state.items,
        productCodes: Array.from(state.productCodes),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.productCodes)) {
          state.productCodes = new Set(state.productCodes);
        }
      },
    }
  )
);
