import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useWishlistStore, type WishlistItem } from '@/stores/wishlistStore';
import { useCallback } from 'react';

interface GetWishlistResponse {
  success: boolean;
  message: string;
  data: {
    wishlist: WishlistItem[];
    count: number;
  };
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Fetch wishlist from backend
 */
async function fetchWishlist(): Promise<WishlistItem[]> {
  const response = await apiClient.get<GetWishlistResponse>('/wishlist');
  return response.data.wishlist;
}

/**
 * Add product to wishlist
 */
async function addToWishlist(productCode: string): Promise<void> {
  await apiClient.post('/wishlist', { productCode });
}

/**
 * Remove product from wishlist
 */
async function removeFromWishlist(productCode: string): Promise<void> {
  await apiClient.delete(`/wishlist/${productCode}`);
}

/**
 * Hook to fetch and sync wishlist
 */
export function useWishlist() {
  const setWishlist = useWishlistStore((state) => state.setWishlist);
  
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const items = await fetchWishlist();
      // Sync with Zustand store
      setWishlist(items);
      return items;
    },
    staleTime: 60 * 1000, // 1 minute
    retry: 1,
  });
}

/**
 * Hook to add product to wishlist with optimistic update
 */
export function useAddToWishlist() {
  const queryClient = useQueryClient();
  const addItemToStore = useWishlistStore((state) => state.addItem);
  
  return useMutation({
    mutationFn: addToWishlist,
    
    onMutate: async (productCode) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      
      // Snapshot previous value
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist']);
      
      // Optimistically update (partial data - will be replaced by real data)
      const optimisticItem: WishlistItem = {
        id: Date.now(), // Temporary ID
        customerId: 0, // Will be set by backend
        productCode,
        addedAt: new Date().toISOString(),
        product: {
          productCode,
          name: '', // Will be fetched
          price: 0,
          isActive: true,
        },
      };
      
      // Update cache
      queryClient.setQueryData<WishlistItem[]>(['wishlist'], (old) => 
        old ? [...old, optimisticItem] : [optimisticItem]
      );
      
      // Update store optimistically
      addItemToStore(optimisticItem);
      
      return { previousWishlist };
    },
    
    onError: (err, productCode, context) => {
      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
        useWishlistStore.getState().setWishlist(context.previousWishlist);
      }
    },
    
    onSettled: () => {
      // Refetch to get accurate data
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}

/**
 * Hook to remove product from wishlist with optimistic update
 */
export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  const removeItemFromStore = useWishlistStore((state) => state.removeItem);
  
  return useMutation({
    mutationFn: removeFromWishlist,
    
    onMutate: async (productCode) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      
      // Snapshot previous value
      const previousWishlist = queryClient.getQueryData<WishlistItem[]>(['wishlist']);
      
      // Optimistically remove
      queryClient.setQueryData<WishlistItem[]>(['wishlist'], (old) =>
        old ? old.filter(item => item.productCode !== productCode) : []
      );
      
      // Update store
      removeItemFromStore(productCode);
      
      return { previousWishlist };
    },
    
    onError: (err, productCode, context) => {
      // Rollback on error
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
        useWishlistStore.getState().setWishlist(context.previousWishlist);
      }
    },
    
    onSettled: () => {
      // Refetch to get accurate data
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });
}

/**
 * Hook to check if product is in wishlist
 */
export function useIsInWishlist(productCode: string): boolean {
  return useWishlistStore((state) => state.isInWishlist(productCode));
}

/**
 * Hook to toggle wishlist
 */
export function useToggleWishlist() {
  const isInWishlist = useWishlistStore((state) => state.isInWishlist);
  const addMutation = useAddToWishlist();
  const removeMutation = useRemoveFromWishlist();
  
  const toggle = useCallback(
    (productCode: string) => {
      if (isInWishlist(productCode)) {
        return removeMutation.mutateAsync(productCode);
      } else {
        return addMutation.mutateAsync(productCode);
      }
    },
    [isInWishlist, addMutation, removeMutation]
  );
  
  const isLoading = addMutation.isPending || removeMutation.isPending;
  
  return {
    toggle,
    isLoading,
  };
}
