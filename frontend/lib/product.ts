/**
 * Calculate the actual available quantity of a product
 * Formula: availableQuantity - reservedQuantity - safetyStock
 */
export function calculateAvailableStock(
  availableQuantity: number = 0,
  reservedQuantity: number = 0,
  safetyStock: number = 0
): number {
  const stock = availableQuantity - reservedQuantity - safetyStock;
  return Math.max(0, stock); // Never return negative
}

/**
 * Product interface with inventory fields
 */
export interface ProductWithInventory {
  availableQuantity?: number;
  stockQuantity?: number;
  reservedQuantity?: number;
  safetyStock?: number;
}

/**
 * Get the actual available stock from a product object
 */
export function getProductStock(product: ProductWithInventory): number {
  const available = product.availableQuantity ?? product.stockQuantity ?? 0;
  const reserved = product.reservedQuantity ?? 0;
  const safety = product.safetyStock ?? 0;
  
  return calculateAvailableStock(available, reserved, safety);
}
