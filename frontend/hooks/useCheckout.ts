import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { websocketManager } from '@/lib/websocket';
import { CartItem } from '@/stores/cartStore';
import { logger } from '@/lib/logger';

export interface ShippingAddressData {
  firstName: string;
  lastName: string;
  addressLine: string;
  city: string;
  postalCode: string;
  province: string;
}

export interface CheckoutData {
  shippingAddress: ShippingAddressData;
  paymentMethod: 'card' | 'paypal';
  paymentDetails?: {
    cardNumber?: string;
    cardHolderName?: string;
    expiryDate?: string;
    cvv?: string;
  };
}

export interface Order {
  orderId: number;
  orderNumber: string;
  customerId: number;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine: string;
    city: string;
    postalCode: string;
    province: string;
  };
}

export interface OrderItem {
  id: number;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface CreateCheckoutOrderResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    orderId: number;
    status: string;
    items: OrderItem[];
    totalAmount: number;
    reservedUntil: string;
    error?: string;
    unavailableProducts?: Array<{
      productCode: string;
      requested: number;
      availableToSell: number;
    }>;
  };
}

interface AddShippingAddressResponse {
  success: boolean;
  message: string;
  data: {
    orderId: number;
    status: string;
    shippingAddress: string;
  };
}

interface OrdersResponse {
  success: boolean;
  data: {
    items: Order[];
    total: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/**
 * Create order from FE cart via POST /api/orders/checkout
 */
async function createCheckoutOrder(items: CartItem[]): Promise<CreateCheckoutOrderResponse> {
  const requestBody = {
    items: items.map(item => ({
      productCode: item.productCode,
      quantity: item.quantity,
    })),
  };
  
  return await apiClient.post<CreateCheckoutOrderResponse>('/orders/checkout', requestBody);
}

/**
 * Add shipping address to RESERVED order
 */
async function addShippingAddress(orderId: number, shippingAddress: ShippingAddressData): Promise<AddShippingAddressResponse> {
  return await apiClient.post<AddShippingAddressResponse>(
    `/orders/${orderId}/shipping`,
    { shippingAddress }
  );
}

/**
 * Hook for creating checkout order from cart
 */
export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCheckoutOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

/**
 * Hook for adding shipping address to order
 */
export function useAddShippingAddress() {
  return useMutation({
    mutationFn: ({ orderId, shippingAddress }: { orderId: number; shippingAddress: ShippingAddressData }) =>
      addShippingAddress(orderId, shippingAddress),
  });
}

/**
 * Fetch customer orders
 */
async function fetchOrders(page = 1, limit = 10, status?: string): Promise<OrdersResponse> {
  const params: Record<string, string | number> = { page, limit };
  if (status && status !== 'all') {
    params.status = status;
  }
  
  const response = await apiClient.get<OrdersResponse>('/orders/search', {
    params,
  });
  return response;
}

/**
 * Hook to fetch customer orders
 */
export function useOrders(page = 1, limit = 10, status?: string) {
  return useQuery({
    queryKey: ['orders', page, limit, status],
    queryFn: () => fetchOrders(page, limit, status),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch single order by ID
 */
async function fetchOrder(orderId: string): Promise<Order> {
  const response = await apiClient.get<{ success: boolean; message: string; data: Order }>(
    `/orders/${orderId}`
  );
  return response.data;
}

/**
 * Hook to fetch single order
 */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Payment interfaces
 */
export interface InitiatePaymentRequest {
  orderId: number;
  paymentMethod: 'card' | 'paypal';
}

export interface InitiatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    transactionId: string;
    paymentProvider: string;
    paymentUrl?: string;
    sessionId?: string;
    expiresAt: string;
    order: {
      id: number;
      status: string;
      totalAmount: number;
    };
  };
}

/**
 * Initiate payment for an order
 */
async function initiatePayment(request: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
  return await apiClient.post<InitiatePaymentResponse>('/payments', request);
}

/**
 * Hook for initiating payment
 */
export function useInitiatePayment() {
  return useMutation({
    mutationFn: initiatePayment,
  });
}

/**
 * Hook to listen for payment completion events via WebSocket
 * @param orderId - The order ID to listen for
 * @param onPaymentComplete - Callback when payment is completed
 * @param enabled - Whether to listen for events (default: true)
 */
export function usePaymentListener(
  orderId: number | null,
  onPaymentComplete: (data: any) => void,
  enabled = true
) {
  const handleOrderUpdate = useCallback(
    (data: any) => {
      // Check if this event is for our order
      if (data.orderId === orderId) {
        logger.info('Payment completed for order:', orderId);
        onPaymentComplete(data);
      }
    },
    [orderId, onPaymentComplete]
  );

  useEffect(() => {
    if (!enabled || !orderId) return;

    logger.debug('Listening for payment completion on order:', orderId);
    
    // Register listener for order-update events
    websocketManager.on('order-update', handleOrderUpdate);

    // Cleanup on unmount
    return () => {
      logger.debug('Stopped listening for payment completion on order:', orderId);
      websocketManager.off('order-update', handleOrderUpdate);
    };
  }, [orderId, enabled, handleOrderUpdate]);
}
