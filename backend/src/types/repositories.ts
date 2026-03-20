import { ProductMaster } from "../entities/mysql/ProductMaster";
import { ProductVersion } from "../entities/mysql/ProductVersion";
import { InventoryQuantity } from "../entities/mysql/InventoryQuantity";
import { ShipmentStatus } from "../entities/mysql/Shipment";

// ========== PRODUCT REPOSITORIES TYPES ==========

export interface ProductWithInventory {
  productMaster: ProductMaster;
  currentVersion: ProductVersion | null;
  inventory: InventoryQuantity | null;
}

export interface CreateProductRepositoryRequest {
  productCode: string;
  name: string;
  description?: string;
  price: number;
  categorySlug: string;
  initialQuantity?: number;
  safetyStock?: number;
  createdBy: string;
}

export interface UpdateProductVersionRepositoryRequest {
  name?: string;
  description?: string;
  price?: number;
  categorySlug?: string;
  updatedBy: string;
}

// ========== BLACKLIST REPOSITORIES TYPES ==========

export interface BlacklistTokenRepositoryRequest {
  tokenJti: string;
  userReference?: string;
  userType?: string;
  expiresAt: Date;
  reason?: string;
}

// ========== ORDER REPOSITORIES TYPES ==========

export interface CreateOrderRepositoryRequest {
  customerId: number;
}

export interface UpdateOrderRepositoryRequest {
  orderId: number;
  userId?: string;
  status?: string;
  shippingFirstName?: string;
  shippingLastName?: string;
  shippingAddressLine?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  shippingProvince?: string;
  resetShippingAddress?: boolean;
}

export interface FindOrderRepositoryRequest {
  orderId: number;
  customerId?: number;
}

export interface CreateOrderItemRepositoryRequest {
  orderId: number;
  productMasterId: number;
  productVersionId: number;
  unitPrice: number;
  quantity: number;
}

export interface CheckInventoryRepositoryRequest {
  productCode: string;
  requestedQuantity: number;
}

export interface CheckInventoryRepositoryResponse {
  productCode: string;
  availableToSell: number;
  sufficient: boolean;
}

export interface ReserveInventoryRepositoryRequest {
  productCode: string;
  quantity: number;
  orderId: number;
}

export interface UpdateInventoryAfterShipmentRepositoryRequest {
  productMasterId: number;
  quantity: number;
}

export interface OrderItemData {
  id: number;
  productCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderWithItemsData {
  id: number;
  customerId: number;
  customerFirstName: string;
  customerLastName: string;
  status: string;
  paymentProvider: string | null;
  paymentStatus: string | null;
  createdAt: Date;
  lastUpdated: Date;
  shippingFirstName: string | null;
  shippingLastName: string | null;
  shippingAddressLine: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingProvince: string | null;
  items: OrderItemData[];
}

export interface SearchOrdersRepositoryRequest {
  searchTerm?: string;
  customerId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  limit: number;
  offset: number;
}

// ========== SHIPMENT REPOSITORY TYPES ==========

export interface CreateShipmentRepositoryRequest {
  orderId: number;
  carrier: string;
  trackingCode: string;
  createdBy: string;
  estimatedDelivery?: Date;
}

export interface UpdateShipmentRepositoryRequest {
  shipmentId: number;
  status?: ShipmentStatus;
  shipmentDate?: Date;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
  updatedBy?: string;
}

export interface FindShipmentsRepositoryRequest {
  orderId?: number;
  customerId?: number;
  trackingCode?: string;
  carrier?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// ========== CATEGORY REPOSITORY TYPES ==========

export interface CreateCategoryRepositoryRequest {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: number;
  createdBy: string;
}

export interface UpdateCategoryRepositoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: number;
}

// ========== WISHLIST REPOSITORY TYPES ==========

export interface AddToWishlistRepositoryRequest {
  customerId: number;
  productCode: string;
}

export interface WishlistItemWithProduct {
  id: number;
  customerId: number;
  productCode: string;
  addedAt: Date;
  product: {
    productCode: string;
    name: string;
    description?: string;
    price: number;
    isActive: boolean;
  };
}

// ========== NOTIFICATION REPOSITORY TYPES ==========

export interface GetNotificationsFilters {
  isRead?: boolean;
  limit?: number;
  page?: number;
}
