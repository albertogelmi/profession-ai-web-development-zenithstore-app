import { Request, Response } from "express";
import { JwtPayload } from "../utils/jwt";
import { User } from "../entities/mysql/User";
import { Customer } from "../entities/mysql/Customer";
import { Shipment, ShipmentStatus } from "../entities/mysql/Shipment";
import { OrderStatus } from "../entities/mysql/CustomerOrder";

// ========== BASE API TYPES ==========

export interface AuthenticatedRequest<P, ResBody, ReqBody, ReqQuery>
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: JwtPayload;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  requestId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

// ========== COMMON QUERY TYPES ==========

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

// ========== USER API TYPES ==========

export interface GetAllUsersResponseData {
  users: User[];
  count: number;
}

export interface GetAllUsersRequest
  extends Request<{}, GetAllUsersResponseData> {}

export interface GetAllUsersResponse
  extends ApiResponse<GetAllUsersResponseData> {}

export interface CreateUserResponseData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    startDate: Date;
  };
  password: string;
}

export interface CreateUserRequestBody {
  id: string;
  firstName: string;
  lastName: string;
}

export interface CreateUserRequest
  extends Request<{}, CreateUserResponseData, CreateUserRequestBody> {}

export interface CreateUserResponse
  extends ApiResponse<CreateUserResponseData> {}

export interface DeleteUserRequest extends Request<{ id: string }> {}

export interface DeleteUserResponse extends ApiResponse<{}> {}

export interface UpdatePasswordRequestBody {
  password: string;
  newPassword: string;
}

export interface UpdatePasswordRequest
  extends Request<{ id: string }, {}, UpdatePasswordRequestBody> {}

export interface UpdatePasswordResponse extends ApiResponse<{}> {}

export interface LoginResponseData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  token: string;
  tokenExpiry: Date;
}

export interface LoginRequestBody {
  userId: string;
  password: string;
}

export interface LoginRequest
  extends Request<{}, LoginResponseData, LoginRequestBody> {}

export interface LoginResponse extends ApiResponse<LoginResponseData> {}

export interface SearchUsersResponseData extends PaginatedResponse<User> {}

export interface SearchUsersQuery extends PaginationQuery {
  searchTerm?: string;
  isBlocked?: string;
}

export interface SearchUsersRequest
  extends Request<{}, SearchUsersResponseData, {}, SearchUsersQuery> {}

export interface SearchUsersResponse
  extends ApiResponse<SearchUsersResponseData> {}

export interface ResetPasswordResponseData {
  newPassword: string;
}

export interface ResetPasswordRequest
  extends Request<{ id: string }, ResetPasswordResponseData> {}

export interface ResetPasswordResponse
  extends ApiResponse<ResetPasswordResponseData> {}

export interface BlockUserRequestBody {
  reason?: string;
}

export interface BlockUserRequest
  extends Request<{ id: string }, {}, BlockUserRequestBody> {}

export interface BlockUserResponse extends ApiResponse<{}> {}

export interface UnblockUserRequest extends Request<{ id: string }> {}

export interface UnblockUserResponse extends ApiResponse<{}> {}

export interface LogoutRequest extends AuthenticatedRequest<{}, {}, {}, {}> {}

export interface LogoutResponse extends ApiResponse<{}> {}

// ========== CUSTOMER API TYPES ==========

export interface GetAllCustomersResponseData {
  customers: Customer[];
  count: number;
}

export interface GetAllCustomersRequest
  extends Request<{}, GetAllCustomersResponseData> {}

export interface GetAllCustomersResponse
  extends ApiResponse<GetAllCustomersResponseData> {}

export interface GetCustomerByIdRequest
  extends AuthenticatedRequest<{}, Customer, {}, {}> {}

export interface GetCustomerByIdResponse extends ApiResponse<Customer> {}

export interface CreateCustomerResponseData {
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    startDate: Date;
  };
}

export interface CreateCustomerRequestBody {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface CreateCustomerRequest
  extends Request<{}, CreateCustomerResponseData, CreateCustomerRequestBody> {}

export interface CreateCustomerResponse
  extends ApiResponse<CreateCustomerResponseData> {}

export interface DeleteCustomerRequest
  extends AuthenticatedRequest<{}, {}, {}, {}> {}

export interface DeleteCustomerResponse extends ApiResponse<{}> {}

export interface UpdatePasswordCustomerRequestBody {
  email: string;
  password: string;
  newPassword: string;
}

export interface UpdatePasswordCustomerRequest
  extends Request<{}, {}, UpdatePasswordCustomerRequestBody> {}

export interface UpdatePasswordCustomerResponse extends ApiResponse<{}> {}

export interface LoginCustomerResponseData {
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
  };
}

export interface LoginCustomerRequestBody {
  email: string;
  password: string;
}

export interface LoginCustomerRequest
  extends Request<{}, LoginCustomerResponseData, LoginCustomerRequestBody> {}

export interface LoginCustomerResponse
  extends ApiResponse<LoginCustomerResponseData> {}

export interface SearchCustomersResponseData
  extends PaginatedResponse<Customer> {}

export interface SearchCustomersQuery extends PaginationQuery {
  searchTerm?: string;
  email?: string;
  isBlocked?: string;
}

export interface SearchCustomersRequest
  extends Request<{}, SearchCustomersResponseData, {}, SearchCustomersQuery> {}

export interface SearchCustomersResponse
  extends ApiResponse<SearchCustomersResponseData> {}

export interface ResetPasswordCustomerRequestBody {
  email: string;
}

export interface ResetPasswordCustomerRequest
  extends Request<
    {},
    ResetPasswordResponseData,
    ResetPasswordCustomerRequestBody
  > {}

export interface ResetPasswordCustomerResponse
  extends ApiResponse<ResetPasswordResponseData> {}

export interface BlockCustomerRequestBody {
  reason?: string;
}

export interface BlockCustomerRequest
  extends Request<{ id: number }, {}, BlockCustomerRequestBody> {}

export interface BlockCustomerResponse extends ApiResponse<{}> {}

export interface UnblockCustomerRequest extends Request<{ id: number }> {}

export interface UnblockCustomerResponse extends ApiResponse<{}> {}

export interface LogoutCustomerRequest
  extends AuthenticatedRequest<{}, {}, {}, {}> {}

export interface LogoutCustomerResponse extends ApiResponse<{}> {}

// ========== PRODUCT API TYPES ==========

export interface ProductDetailResponseData {
  productCode: string;
  name: string;
  description?: string;
  price: number;
  availableQuantity: number;
  reservedQuantity: number;
  safetyStock: number;
  categoryName?: string;
  categorySlug?: string;
  createdBy: string;
  createdAt: Date;
  updatedBy: string;
  lastUpdate: Date;
  isActive: boolean;
}

export interface GetAllProductsResponseData {
  products: ProductDetailResponseData[];
  count: number;
}

export interface GetAllProductsRequest
  extends AuthenticatedRequest<{}, GetAllProductsResponseData, {}, {}> {}

export interface GetAllProductsResponse
  extends ApiResponse<GetAllProductsResponseData> {}

export interface GetProductRequest
  extends AuthenticatedRequest<
    { productCode: string },
    ProductDetailResponseData,
    {},
    {}
  > {}

export interface GetProductResponse
  extends ApiResponse<ProductDetailResponseData> {}

export interface CreateProductRequestBody {
  productCode: string;
  name: string;
  description?: string;
  price: number;
  categorySlug: string;
  initialQuantity?: number;
  safetyStock?: number;
}

export interface CreateProductRequest
  extends AuthenticatedRequest<
    {},
    ProductDetailResponseData,
    CreateProductRequestBody,
    {}
  > {}

export interface CreateProductResponse
  extends ApiResponse<ProductDetailResponseData> {}

export interface UpdateProductRequestBody {
  name?: string;
  description?: string;
  price?: number;
  categorySlug?: string;
}

export interface UpdateProductRequest
  extends AuthenticatedRequest<
    { productCode: string },
    ProductDetailResponseData,
    UpdateProductRequestBody,
    {}
  > {}

export interface UpdateProductResponse
  extends ApiResponse<ProductDetailResponseData> {}

export interface UpdateInventoryResponseData {
  productCode: string;
  previousAvailableQuantity?: number;
  newAvailableQuantity?: number;
  previousSafetyStock?: number;
  newSafetyStock?: number;
  updatedBy: string;
  timestamp: Date;
}

export interface UpdateInventoryRequestBody {
  availableQuantity?: number;
  safetyStock?: number;
}

export interface UpdateInventoryRequest
  extends AuthenticatedRequest<
    { productCode: string },
    UpdateInventoryResponseData,
    UpdateInventoryRequestBody,
    {}
  > {}

export interface UpdateInventoryResponse
  extends ApiResponse<UpdateInventoryResponseData> {}

export interface DeleteProductResponseData {
  productCode: string;
}

export interface DeleteProductRequest
  extends AuthenticatedRequest<
    { productCode: string },
    DeleteProductResponseData,
    {},
    {}
  > {}

export interface DeleteProductResponse
  extends ApiResponse<DeleteProductResponseData> {}

export interface RestoreProductResponseData {
  productCode: string;
}

export interface RestoreProductRequest
  extends AuthenticatedRequest<
    { productCode: string },
    RestoreProductResponseData,
    {},
    {}
  > {}

export interface RestoreProductResponse
  extends ApiResponse<RestoreProductResponseData> {}

export interface SearchProductsResponseData
  extends PaginatedResponse<ProductDetailResponseData> {}

export interface SearchProductsQuery extends PaginationQuery {
  name?: string;
  priceMin?: string;
  priceMax?: string;
  productCode?: string;
  categorySlug?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface SearchProductsRequest
  extends AuthenticatedRequest<
    {},
    SearchProductsResponseData,
    {},
    SearchProductsQuery
  > {}

export interface SearchProductsResponse
  extends ApiResponse<SearchProductsResponseData> {}

// ========== TYPE GUARDS ==========

export function isValidBooleanString(value: any): value is "true" | "false" {
  return value.toLowerCase() === "true" || value.toLowerCase() === "false";
}

// ========== ORDER API TYPES ==========

// Types for cart items
export interface OrderItemResponseData {
  id: number;
  productCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

// Types for cart summary
export interface OrderSummaryResponseData {
  totalItems: number;
  totalAmount: number;
  totalQuantity: number;
}

// Types for shipping address
export interface ShippingAddressData {
  firstName: string;
  lastName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  province: string;
}

// API: GET /api/orders/:id
export interface GetOrderResponseData {
  orderId: number;
  customerId: number;
  customerName: string;
  status: OrderStatus;
  createdAt: Date;
  lastUpdated: Date;
  items: OrderItemResponseData[];
  summary: OrderSummaryResponseData;
  shippingAddress?: ShippingAddressData;
}

export interface GetOrderRequest
  extends AuthenticatedRequest<{ id: string }, GetOrderResponseData, {}, {}> {}
export interface GetOrderResponse extends ApiResponse<GetOrderResponseData> {}

export interface UnavailableProductData {
  productCode: string;
  availableToSell: number;
  requested: number;
}

// API: POST /api/orders/checkout - Create order from FE cart
export interface CreateCheckoutOrderRequestBody {
  items: Array<{
    productCode: string;
    quantity: number;
  }>;
}

export interface CreateCheckoutOrderResponseData {
  success: boolean;
  orderId?: number;
  status?: OrderStatus;
  items?: OrderItemResponseData[];
  totalAmount?: number;
  reservedUntil?: string;
  error?: string;
  unavailableProducts?: UnavailableProductData[];
}

export interface CreateCheckoutOrderRequest
  extends AuthenticatedRequest<
    {},
    CreateCheckoutOrderResponseData,
    CreateCheckoutOrderRequestBody,
    {}
  > {}
export interface CreateCheckoutOrderResponse
  extends ApiResponse<CreateCheckoutOrderResponseData> {}

// API: POST /api/orders/:id/shipping - Add shipping address to RESERVED order
export interface AddShippingAddressRequestBody {
  shippingAddress: ShippingAddressData;
}

export interface AddShippingAddressResponseData {
  orderId: number;
  status: OrderStatus;
  shippingAddress: string; // Formatted address string
}

export interface AddShippingAddressRequest
  extends AuthenticatedRequest<
    { id: string },
    AddShippingAddressResponseData,
    AddShippingAddressRequestBody,
    {}
  > {}

export interface AddShippingAddressResponse
  extends ApiResponse<AddShippingAddressResponseData> {}

// API: GET /api/orders/search - Advanced order search
export interface SearchOrdersQuery extends PaginationQuery {
  searchTerm?: string;
  customerId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
}

export interface SearchOrdersResponseData
  extends PaginatedResponse<GetOrderResponseData> {}

export interface SearchOrdersRequest
  extends AuthenticatedRequest<
    {},
    SearchOrdersResponseData,
    {},
    SearchOrdersQuery
  > {}

export interface SearchOrdersResponse
  extends ApiResponse<SearchOrdersResponseData> {}

// API: PATCH /api/orders/:id/process - Process order
export interface ProcessOrderResponseData {
  order: {
    id: number;
    status: string;
    managedBy: string;
    lastUpdated: Date;
  };
}

export interface ProcessOrderRequest
  extends AuthenticatedRequest<
    { id: string },
    ProcessOrderResponseData,
    {},
    {}
  > {}
export interface ProcessOrderResponse
  extends ApiResponse<ProcessOrderResponseData> {}

// ========== SHIPMENT API TYPES ==========

// API: POST /api/orders/:id/ship - Create shipment
export interface CreateShipmentRequestBody {
  carrier: string;
}

export interface CreateShipmentResponseData {
  shipment: Shipment;
  order: {
    id: number;
    status: string;
    managedBy?: string;
  };
}

export interface CreateShipmentRequest
  extends AuthenticatedRequest<
    { id: string },
    CreateShipmentResponseData,
    CreateShipmentRequestBody,
    {}
  > {}
export interface CreateShipmentResponse
  extends ApiResponse<CreateShipmentResponseData> {}

// API: PATCH /api/orders/:id/ship/sent - Mark shipment as sent
export interface MarkShipmentSentRequestBody {
  actualShippingDate?: Date;
}

export interface MarkShipmentSentResponseData {
  shipment: Shipment;
  order: {
    id: number;
    status: string;
    managedBy?: string;
  };
}

export interface MarkShipmentSentRequest
  extends AuthenticatedRequest<
    { id: string },
    MarkShipmentSentResponseData,
    MarkShipmentSentRequestBody,
    {}
  > {}
export interface MarkShipmentSentResponse
  extends ApiResponse<MarkShipmentSentResponseData> {}

// ========== PAYMENT API TYPES ==========

// API: POST /api/payments - Initiate payment
export interface InitiatePaymentRequestBody {
  orderId: number;
  paymentMethod: "STRIPE" | "PAYPAL";
}

export interface InitiatePaymentResponseData {
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

export interface InitiatePaymentRequest
  extends AuthenticatedRequest<
    {},
    InitiatePaymentResponseData,
    InitiatePaymentRequestBody,
    {}
  > {}
export interface InitiatePaymentResponse
  extends ApiResponse<InitiatePaymentResponseData> {}

// API: POST /api/payments/webhook - Payment webhook
export interface PaymentWebhookRequestBody {
  status: "COMPLETED" | "FAILED" | "CANCELLED";
  transactionId: string;
  timestamp: Date;
  orderId?: number;
}

export interface PaymentWebhookResponseData {
  received: boolean;
  processed: boolean;
  orderId?: number;
  status?: string;
}

export interface PaymentWebhookRequest
  extends Request<{}, PaymentWebhookResponseData, PaymentWebhookRequestBody> {}
export interface PaymentWebhookResponse
  extends ApiResponse<PaymentWebhookResponseData> {}

// API: GET /api/shipments - Get shipments
export interface GetShipmentsQuery extends PaginationQuery {
  orderId?: string;
  customerId?: number;
  trackingCode?: string;
  carrier?: string;
  status?: string;
}

export interface GetShipmentsResponseData extends PaginatedResponse<Shipment> {}

export interface GetShipmentsRequest
  extends AuthenticatedRequest<
    {},
    GetShipmentsResponseData,
    {},
    GetShipmentsQuery
  > {}
export interface GetShipmentsResponse
  extends ApiResponse<GetShipmentsResponseData> {}

// API: POST /api/shipments/webhook - Shipment webhook
export interface ShipmentWebhookRequestBody {
  trackingCode: string;
  status: ShipmentStatus;
  timestamp: Date;
  location?: string;
  estimatedDelivery?: Date;
}

export interface ShipmentWebhookResponseData {
  received: boolean;
  processed: boolean;
  trackingCode: string;
  status?: string;
}

export interface ShipmentWebhookRequest
  extends Request<
    {},
    ShipmentWebhookResponseData,
    ShipmentWebhookRequestBody
  > {}
export interface ShipmentWebhookResponse
  extends ApiResponse<ShipmentWebhookResponseData> {}

// ========== UTILITY FUNCTIONS ==========

export function createApiResponse<T>(
  success: boolean,
  message: string,
  data?: T,
  error?: string
): ApiResponse<T> {
  return {
    success,
    message,
    data,
    error,
  };
}

// ========== PRODUCT REVIEW API TYPES ==========

export interface CreateReviewRequestParams {
  productCode: string;
}

export interface CreateReviewRequestBody {
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  orderId: number;
}

export interface CreateReviewRequest 
  extends AuthenticatedRequest<CreateReviewRequestParams, any, CreateReviewRequestBody, {}> {}

export interface GetReviewsRequestParams {
  productCode: string;
}

export interface GetReviewsRequestQuery {
  status?: 'pending' | 'approved' | 'rejected';
}

export interface GetReviewsRequest 
  extends Request<GetReviewsRequestParams, any, any, GetReviewsRequestQuery> {}

export interface ReviewIdRequestParams {
  id: string;
}

export interface RejectReviewRequestBody {
  reason?: string;
}

export interface ReviewIdRequest 
  extends AuthenticatedRequest<ReviewIdRequestParams, any, RejectReviewRequestBody, {}> {}

export interface GetPendingReviewsQuery {
  limit?: string;
}

export interface GetPendingReviewsRequest 
  extends AuthenticatedRequest<{}, any, any, GetPendingReviewsQuery> {}

export interface GetMyReviewsQuery {
  limit?: string;
}

export interface GetMyReviewsRequest 
  extends AuthenticatedRequest<{}, any, any, GetMyReviewsQuery> {}

// ========== PRODUCT QUESTION API TYPES ==========

export interface CreateQuestionRequestParams {
  productCode: string;
}

export interface CreateQuestionRequestBody {
  question: string;
}

export interface CreateQuestionRequest 
  extends AuthenticatedRequest<CreateQuestionRequestParams, any, CreateQuestionRequestBody, {}> {}

export interface GetQuestionsRequestParams {
  productCode: string;
}

export interface GetQuestionsRequestQuery {
  includeHidden?: string;
}

export interface GetQuestionsRequest 
  extends Request<GetQuestionsRequestParams, any, any, GetQuestionsRequestQuery> {}

export interface QuestionIdRequestParams {
  id: string;
}

export interface QuestionIdRequest 
  extends AuthenticatedRequest<QuestionIdRequestParams, any, any, {}> {}

export interface AnswerQuestionRequestBody {
  answer: string;
}

export interface AnswerQuestionRequest 
  extends AuthenticatedRequest<QuestionIdRequestParams, any, AnswerQuestionRequestBody, {}> {}

export interface GetPendingQuestionsQuery {
  limit?: string;
}

export interface GetPendingQuestionsRequest 
  extends AuthenticatedRequest<{}, any, any, GetPendingQuestionsQuery> {}

export interface GetMyQuestionsQuery {
  limit?: string;
}

export interface GetMyQuestionsRequest 
  extends AuthenticatedRequest<{}, any, any, GetMyQuestionsQuery> {}

// ========== CATEGORY API TYPES ==========

export interface GetAllCategoriesResponseData {
  categories: {
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    displayOrder: number;
    isActive: number;
  }[];
  count: number;
}

export interface GetAllCategoriesRequest 
  extends Request<{}, GetAllCategoriesResponseData> {}

export interface GetAllCategoriesResponse 
  extends ApiResponse<GetAllCategoriesResponseData> {}

export interface GetCategoryBySlugParams {
  slug: string;
}

export interface GetCategoryBySlugResponseData {
  category: {
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    displayOrder: number;
    isActive: number;
    createdAt: Date;
    createdBy?: string;
  };
}

export interface GetCategoryBySlugRequest 
  extends Request<GetCategoryBySlugParams, GetCategoryBySlugResponseData> {}

export interface GetCategoryBySlugResponse 
  extends ApiResponse<GetCategoryBySlugResponseData> {}

export interface GetProductsByCategoryParams {
  slug: string;
}

export interface GetProductsByCategoryQuery extends PaginationQuery {
  priceMin?: string;
  priceMax?: string;
}

export interface GetProductsByCategoryRequest 
  extends Request<GetProductsByCategoryParams, any, {}, GetProductsByCategoryQuery> {}

export interface GetProductsByCategoryResponse extends ApiResponse<any> {}

export interface CreateCategoryRequestBody {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: number;
}

export interface CreateCategoryResponseData {
  category: {
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    displayOrder: number;
    isActive: number;
    createdAt: Date;
    createdBy?: string;
  };
}

export interface CreateCategoryRequest 
  extends AuthenticatedRequest<{}, CreateCategoryResponseData, CreateCategoryRequestBody, {}> {}

export interface CreateCategoryResponse 
  extends ApiResponse<CreateCategoryResponseData> {}

export interface UpdateCategoryParams {
  slug: string;
}

export interface UpdateCategoryRequestBody {
  name?: string;
  slug?: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  isActive?: number;
}

export interface UpdateCategoryResponseData {
  category: {
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    displayOrder: number;
    isActive: number;
    createdAt: Date;
    createdBy?: string;
  };
}

export interface UpdateCategoryRequest 
  extends AuthenticatedRequest<UpdateCategoryParams, UpdateCategoryResponseData, UpdateCategoryRequestBody, {}> {}

export interface UpdateCategoryResponse 
  extends ApiResponse<UpdateCategoryResponseData> {}

export interface DeleteCategoryParams {
  slug: string;
}

export interface DeleteCategoryRequest 
  extends AuthenticatedRequest<DeleteCategoryParams, {}, {}, {}> {}

export interface DeleteCategoryResponse extends ApiResponse<{}> {}

export interface RestoreCategoryParams {
  slug: string;
}

export interface RestoreCategoryRequest 
  extends AuthenticatedRequest<RestoreCategoryParams, {}, {}, {}> {}

export interface RestoreCategoryResponse extends ApiResponse<{}> {}

// ========== WISHLIST API TYPES ==========

export interface WishlistItem {
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

export interface GetWishlistResponseData {
  wishlist: WishlistItem[];
  count: number;
}

export interface GetWishlistRequest 
  extends AuthenticatedRequest<{}, GetWishlistResponseData, {}, {}> {}

export interface GetWishlistResponse 
  extends ApiResponse<GetWishlistResponseData> {}

export interface AddToWishlistRequestBody {
  productCode: string;
}

export interface AddToWishlistRequest 
  extends AuthenticatedRequest<{}, {}, AddToWishlistRequestBody, {}> {}

export interface AddToWishlistResponse extends ApiResponse<{}> {}

export interface RemoveFromWishlistParams {
  productCode: string;
}

export interface RemoveFromWishlistRequest 
  extends AuthenticatedRequest<RemoveFromWishlistParams, {}, {}, {}> {}

export interface RemoveFromWishlistResponse extends ApiResponse<{}> {}

// ========== NOTIFICATION API TYPES ==========

export interface NotificationItem {
  _id: string;
  customerId: number;
  type: 'order' | 'offer' | 'advertising' | 'promo_personalized';
  title: string;
  message: string;
  icon?: string;
  link?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  isDelivered: boolean;
  createdAt: Date;
  readAt?: Date;
  deliveredAt?: Date;
}

export interface GetNotificationsQuery {
  isRead?: string;
  limit?: string;
  page?: string;
}

export interface GetNotificationsResponseData {
  notifications: NotificationItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetNotificationsRequest 
  extends AuthenticatedRequest<{}, GetNotificationsResponseData, {}, GetNotificationsQuery> {}

export interface GetNotificationsResponse 
  extends ApiResponse<GetNotificationsResponseData> {}

export interface MarkAsReadParams {
  id: string;
}

export interface MarkAsReadRequest 
  extends AuthenticatedRequest<MarkAsReadParams, {}, {}, {}> {}

export interface MarkAsReadResponse extends ApiResponse<{}> {}

export interface MarkAllAsReadResponseData {
  count: number;
}

export interface MarkAllAsReadRequest 
  extends AuthenticatedRequest<{}, MarkAllAsReadResponseData, {}, {}> {}

export interface MarkAllAsReadResponse 
  extends ApiResponse<MarkAllAsReadResponseData> {}

export interface GetUnreadCountResponseData {
  count: number;
}

export interface GetUnreadCountRequest 
  extends AuthenticatedRequest<{}, GetUnreadCountResponseData, {}, {}> {}

export interface GetUnreadCountResponse 
  extends ApiResponse<GetUnreadCountResponseData> {}

// Admin Notification APIs
export interface SendBroadcastNotificationRequestBody {
  type: 'order' | 'offer' | 'advertising' | 'promo_personalized';
  title: string;
  message: string;
  icon?: string;
  link?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SendBroadcastNotificationResponseData {
  count: number;
}

export interface SendBroadcastNotificationRequest 
  extends AuthenticatedRequest<{}, SendBroadcastNotificationResponseData, SendBroadcastNotificationRequestBody, {}> {}

export interface SendBroadcastNotificationResponse 
  extends ApiResponse<SendBroadcastNotificationResponseData> {}

export interface SendWishlistNotificationParams {
  productCode: string;
}

export interface SendWishlistNotificationRequestBody {
  type: 'order' | 'offer' | 'advertising' | 'promo_personalized';
  title: string;
  message: string;
  icon?: string;
  link?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SendWishlistNotificationResponseData {
  count: number;
}

export interface SendWishlistNotificationRequest 
  extends AuthenticatedRequest<SendWishlistNotificationParams, SendWishlistNotificationResponseData, SendWishlistNotificationRequestBody, {}> {}

export interface SendWishlistNotificationResponse 
  extends ApiResponse<SendWishlistNotificationResponseData> {}
