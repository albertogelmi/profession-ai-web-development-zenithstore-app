import { Shipment, ShipmentStatus } from "../entities/mysql/Shipment";
import { OrderStatus } from "../entities/mysql/CustomerOrder";
import { UpdatePasswordRequestBody } from "./api";

// ========== COMMON QUERY TYPES ==========

interface PaginationQuery {
  page?: number;
  limit?: number;
}

// ========== USER SERVICES TYPES ==========

export interface UpdatePasswordServiceRequest
  extends UpdatePasswordRequestBody {
  userId: string;
}

export interface LogoutServiceRequest {
  token: string;
  userReference: string;
}

export interface SearchUsersServiceRequest extends PaginationQuery {
  searchTerm?: string;
  isBlocked?: boolean;
}

// ========== CUSTOMER SERVICES TYPES ==========

export interface UpdatePasswordCustomerServiceRequest
  extends UpdatePasswordRequestBody {
  email: string;
}

export interface LogoutCustomerServiceRequest {
  token: string;
  customerReference: string;
}

export interface SearchCustomersServiceRequest extends PaginationQuery {
  searchTerm?: string;
  email?: string;
  isBlocked?: boolean;
}

// ========== PRODUCT SERVICES TYPES ==========

export interface CreateProductServiceRequest {
  productCode: string;
  name: string;
  description?: string;
  price: number;
  categorySlug: string;
  initialQuantity?: number;
  safetyStock?: number;
  createdBy: string;
}

export interface UpdateProductServiceRequest {
  productCode: string;
  name?: string;
  description?: string;
  price?: number;
  categorySlug?: string;
  updatedBy: string;
}

export interface UpdateInventoryServiceRequest {
  productCode: string;
  availableQuantity?: number;
  safetyStock?: number;
  updatedBy: string;
}

export interface UpdateInventoryServiceResponse {
  availableQuantity: number;
  safetyStock: number;
  lastUpdate: Date;
}

export interface DeleteProductServiceRequest {
  productCode: string;
  deletedBy: string;
}

export interface RestoreProductServiceRequest {
  productCode: string;
  restoredBy: string;
}

export interface SearchProductsServiceRequest extends PaginationQuery {
  name?: string;
  priceMin?: number;
  priceMax?: number;
  productCode?: string;
  categorySlug?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ========== ORDER SERVICES TYPES ==========

export interface GetOrderServiceRequest {
  orderId: number;
  role: "user" | "customer";
  customerId?: number;
}

export interface OrderItemServiceData {
  id: number;
  productCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface GetOrderServiceResponse {
  orderId: number;
  orderNumber: string;
  customerId: number;
  customerName: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod: string;
  createdAt: Date;
  lastUpdated: Date;
  items: OrderItemServiceData[];
  summary: {
    totalItems: number;
    totalAmount: number;
    totalQuantity: number;
  };
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine: string;
    city: string;
    postalCode: string;
    province: string;
  };
}

export interface UnavailableProductServiceData {
  productCode: string;
  availableToSell: number;
  requested: number;
}

export interface CreateCheckoutOrderServiceRequest {
  customerId: number;
  items: Array<{
    productCode: string;
    quantity: number;
  }>;
}

export interface CreateCheckoutOrderServiceResponse {
  success: boolean;
  orderId?: number;
  status?: OrderStatus;
  items?: OrderItemServiceData[];
  totalAmount?: number;
  reservedUntil?: string;
  error?: string;
  unavailableProducts?: UnavailableProductServiceData[];
}

export interface AddShippingAddressServiceRequest {
  orderId: number;
  customerId: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    addressLine: string;
    city: string;
    postalCode: string;
    province: string;
  };
}

export interface AddShippingAddressServiceResponse {
  orderId: number;
  status: OrderStatus;
  shippingAddress: string; // Formatted address string
}

export interface SearchOrdersServiceRequest {
  searchTerm?: string;
  customerId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  page: number;
  limit: number;
}

export interface SearchOrdersServiceResponse {
  items: GetOrderServiceResponse[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ProcessOrderServiceRequest {
  orderId: number;
  userId: string;
}

export interface ProcessOrderServiceResponse {
  order: {
    id: number;
    status: string;
    managedBy: string;
    lastUpdated: Date;
  };
}

// ========== SHIPMENT SERVICE TYPES ==========

export interface CreateShipmentServiceRequest {
  orderId: number;
  carrier: string;
  userId: string;
}

export interface CreateShipmentServiceResponse {
  shipment: Shipment;
  order: {
    id: number;
    status: string;
    managedBy?: string;
  };
}

export interface MarkShipmentSentServiceRequest {
  orderId: number;
  userId: string;
  actualShippingDate?: Date;
}

export interface MarkShipmentSentServiceResponse {
  shipment: Shipment;
  order: {
    id: number;
    status: string;
    managedBy?: string;
  };
}

export interface GetShipmentsServiceRequest extends PaginationQuery {
  orderId?: number;
  customerId?: number;
  trackingCode?: string;
  carrier?: string;
  status?: string;
}

// ========== PAYMENT SERVICE TYPES ==========

export interface InitiatePaymentServiceRequest {
  orderId: number;
  customerId: number;
  paymentMethod: "STRIPE" | "PAYPAL";
}

export interface InitiatePaymentServiceResponse {
  transactionId: string;
  paymentProvider: string;
  paymentUrl: string;
  sessionId: string;
  expiresAt: Date;
  order: {
    id: number;
    status: string;
    totalAmount: number;
  };
}

export interface HandlePaymentWebhookServiceRequest {
  status: "COMPLETED" | "FAILED" | "CANCELLED";
  transactionId: string;
  timestamp: Date;
  orderId?: number;
}

export interface HandlePaymentWebhookServiceResponse {
  received: boolean;
  processed: boolean;
  orderId?: number;
  status?: string;
}

export interface HandleShipmentWebhookServiceRequest {
  trackingCode: string;
  status: ShipmentStatus;
  timestamp: Date;
  location?: string;
  estimatedDelivery?: Date;
}

export interface HandleShipmentWebhookServiceResponse {
  received: boolean;
  processed: boolean;
  trackingCode: string;
  status?: string;
}

// ========== PRODUCT REVIEW SERVICE TYPES ==========

export interface CreateReviewServiceRequest {
  customerId: number;
  productCode: string;
  orderId: number;
  rating: number;
  title?: string;
  comment?: string;
}

export interface CreateReviewServiceResponse {
  reviewId: string;
  customerId: number;
  productCode: string;
  orderId: number;
  rating: number;
  title?: string;
  comment?: string;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface GetProductReviewsServiceRequest {
  productCode: string;
  includeRejected?: boolean;
}

export interface ApproveReviewServiceRequest {
  reviewId: string;
  moderatorId: string;
}

export interface RejectReviewServiceRequest {
  reviewId: string;
  moderatorId: string;
  reason: string;
}

export interface DeleteReviewServiceRequest {
  reviewId: string;
  userId: number;
  userRole: 'user' | 'customer';
}

export interface GetPendingReviewsServiceRequest {
  limit?: number;
}

export interface GetMyReviewsServiceRequest {
  customerId: number;
  limit?: number;
}

// ========== PRODUCT QUESTION SERVICE TYPES ==========

export interface CreateQuestionServiceRequest {
  customerId: number;
  productCode: string;
  question: string;
}

export interface CreateQuestionServiceResponse {
  questionId: string;
  customerId: number;
  productCode: string;
  question: string;
  status: 'pending' | 'answered' | 'hidden';
  createdAt: Date;
}

export interface GetProductQuestionsServiceRequest {
  productCode: string;
  includeHidden?: boolean;
}

export interface AnswerQuestionServiceRequest {
  questionId: string;
  answer: string;
  userId: string;
}

export interface HideQuestionServiceRequest {
  questionId: string;
  moderatorId: string;
}

export interface DeleteQuestionServiceRequest {
  questionId: string;
  userId: number;
  userRole: 'user' | 'customer';
}

export interface GetPendingQuestionsServiceRequest {
  limit?: number;
}

export interface GetMyQuestionsServiceRequest {
  customerId: number;
  limit?: number;
}

// ========== CATEGORY SERVICE TYPES ==========

export interface CreateCategoryServiceRequest {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: number;
  createdBy: string;
}

export interface UpdateCategoryServiceRequest {
  slug: string;
  name?: string;
  newSlug?: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: number;
}

export interface DeleteCategoryServiceRequest {
  slug: string;
  deletedBy: string;
}

export interface RestoreCategoryServiceRequest {
  slug: string;
  restoredBy: string;
}

export interface SearchProductsByCategoryServiceRequest extends PaginationQuery {
  categorySlug: string;
  priceMin?: number;
  priceMax?: number;
}

// ========== WISHLIST SERVICE TYPES ==========

export interface AddToWishlistServiceRequest {
  customerId: number;
  productCode: string;
}

export interface RemoveFromWishlistServiceRequest {
  customerId: number;
  productCode: string;
}
