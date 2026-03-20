import { useEffect, useRef, useState } from 'react';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { apiClient } from '@/lib/api';
import { getProductStock } from '@/lib/product';
import { logger } from '@/lib/logger';

interface StockUpdate {
  productCode: string;
  oldMaxQuantity: number;
  newMaxQuantity: number;
  quantityAdjusted: boolean;
}

/**
 * Hook to validate cart items stock in real-time
 * - Validates when cart sidebar opens
 * - Validates every 60 seconds while cart is open
 * - Updates maxQuantity and adjusts quantities if needed
 */
export function useCartStockValidation() {
  const items = useCartStore((state) => state.items);
  const updateMaxQuantity = useCartStore((state) => state.updateMaxQuantity);
  const isCartOpen = useUIStore((state) => state.isCartOpen);
  
  const [stockUpdates, setStockUpdates] = useState<StockUpdate[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const lastValidationRef = useRef<number>(0);
  const validationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetch current stock for a product
   */
  const fetchProductStock = async (productCode: string) => {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          code: string;
          availableQuantity?: number;
          stockQuantity?: number;
          reservedQuantity?: number;
          safetyStock?: number;
        };
      }>(`/products/${productCode}`);

      if (response.success && response.data) {
        return getProductStock(response.data);
      }
      return null;
    } catch (error) {
      logger.error(`[CartStockValidation] Error fetching stock for ${productCode}:`, error);
      return null;
    }
  };

  /**
   * Validate all cart items stock
   */
  const validateCartStock = async () => {
    if (items.length === 0 || isValidating) return;

    const now = Date.now();
    // Throttle: don't validate more than once every 10 seconds
    if (now - lastValidationRef.current < 10000) {
      return;
    }

    setIsValidating(true);
    lastValidationRef.current = now;
    logger.debug('[CartStockValidation] Validating cart stock...', { itemsCount: items.length });

    const updates: StockUpdate[] = [];

    try {
      // Fetch all product stocks in parallel
      const stockPromises = items.map(async (item) => {
        const currentStock = await fetchProductStock(item.productCode);
        
        if (currentStock !== null) {
          const oldMaxQuantity = item.maxQuantity ?? 999;
          const newMaxQuantity = currentStock;
          
          // Check if stock changed
          if (oldMaxQuantity !== newMaxQuantity) {
            const quantityAdjusted = item.quantity > newMaxQuantity;
            
            // Update maxQuantity in store and adjust quantity if needed
            updateMaxQuantity(item.productCode, newMaxQuantity);
            
            updates.push({
              productCode: item.productCode,
              oldMaxQuantity,
              newMaxQuantity,
              quantityAdjusted,
            });

            logger.info('[CartStockValidation] Stock updated', {
              productCode: item.productCode,
              oldMax: oldMaxQuantity,
              newMax: newMaxQuantity,
              adjusted: quantityAdjusted,
            });
          }
        }
      });

      await Promise.all(stockPromises);

      if (updates.length > 0) {
        setStockUpdates(updates);
        
        // Clear updates after 5 seconds
        setTimeout(() => {
          setStockUpdates([]);
        }, 5000);
      }
    } catch (error) {
      logger.error('[CartStockValidation] Error during validation:', error);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Start periodic validation when cart is open
   */
  useEffect(() => {
    if (isCartOpen && items.length > 0) {
      // Validate immediately when cart opens
      validateCartStock();

      // Then validate every 60 seconds while cart remains open
      validationIntervalRef.current = setInterval(() => {
        validateCartStock();
      }, 60000);

      logger.debug('[CartStockValidation] Started periodic validation');
    } else {
      // Clear interval when cart closes
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = null;
        logger.debug('[CartStockValidation] Stopped periodic validation');
      }
    }

    // Cleanup on unmount
    return () => {
      if (validationIntervalRef.current) {
        clearInterval(validationIntervalRef.current);
        validationIntervalRef.current = null;
      }
    };
  }, [isCartOpen, items.length]);

  return {
    stockUpdates,
    isValidating,
    validateNow: validateCartStock,
  };
}
