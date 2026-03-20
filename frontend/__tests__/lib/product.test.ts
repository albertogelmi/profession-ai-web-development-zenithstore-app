import {
  calculateAvailableStock,
  getProductStock,
  ProductWithInventory,
} from '../../lib/product';

// ---------------------------------------------------------------------------
// calculateAvailableStock
// ---------------------------------------------------------------------------
describe('calculateAvailableStock', () => {
  it('should return available − reserved − safetyStock when the result is positive', () => {
    expect(calculateAvailableStock(100, 20, 10)).toBe(70);
  });

  it('should return 0 when reserved + safetyStock exceeds the available quantity', () => {
    expect(calculateAvailableStock(10, 8, 5)).toBe(0);
  });

  it('should return 0 (not negative) when all quantities are zero', () => {
    expect(calculateAvailableStock(0, 0, 0)).toBe(0);
  });

  it('should treat missing parameters as zero', () => {
    // All params have default value 0
    expect(calculateAvailableStock()).toBe(0);
    expect(calculateAvailableStock(50)).toBe(50);
    expect(calculateAvailableStock(50, 10)).toBe(40);
  });
});

// ---------------------------------------------------------------------------
// getProductStock
// ---------------------------------------------------------------------------
describe('getProductStock', () => {
  it('should prefer availableQuantity over stockQuantity', () => {
    const product: ProductWithInventory = {
      availableQuantity: 80,
      stockQuantity: 999, // should be ignored
      reservedQuantity: 10,
      safetyStock: 5,
    };
    expect(getProductStock(product)).toBe(65);
  });

  it('should fall back to stockQuantity when availableQuantity is absent', () => {
    const product: ProductWithInventory = {
      stockQuantity: 50,
      reservedQuantity: 5,
      safetyStock: 5,
    };
    expect(getProductStock(product)).toBe(40);
  });

  it('should return 0 for an empty product object', () => {
    expect(getProductStock({})).toBe(0);
  });

  it('should never return a negative value even with over-reserved stock', () => {
    const product: ProductWithInventory = {
      availableQuantity: 5,
      reservedQuantity: 20,
      safetyStock: 0,
    };
    expect(getProductStock(product)).toBe(0);
  });
});
