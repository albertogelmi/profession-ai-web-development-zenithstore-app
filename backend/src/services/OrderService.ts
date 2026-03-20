import { OrderRepository } from "../repositories/mysql/OrderRepository";
import { ProductRepository } from "../repositories/mysql/ProductRepository";
import { ShipmentRepository } from "../repositories/mysql/ShipmentRepository";
import { OrderStatus } from "../entities/mysql/CustomerOrder";
import { TransactionManager } from "../utils/transactionManager";
import { errorEmitter } from "../utils/errorEmitter";
import { createError } from "../middleware/errorHandler";
import { createOrderNotification } from "../utils/notificationHelpers";
import {
  GetOrderServiceRequest,
  GetOrderServiceResponse,
  UnavailableProductServiceData,
  ProcessOrderServiceRequest,
  ProcessOrderServiceResponse,
  CreateShipmentServiceRequest,
  CreateShipmentServiceResponse,
  MarkShipmentSentServiceRequest,
  MarkShipmentSentServiceResponse,
  SearchOrdersServiceRequest,
  SearchOrdersServiceResponse,
  CreateCheckoutOrderServiceRequest,
  CreateCheckoutOrderServiceResponse,
  AddShippingAddressServiceRequest,
  AddShippingAddressServiceResponse,
  OrderItemServiceData,
} from "../types/services";
import { SearchOrdersRepositoryRequest } from "../types/repositories";
import { ShipmentStatus } from "../entities/mysql/Shipment";

export class OrderService {
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;
  private shipmentRepository: ShipmentRepository;
  private transactionManager: TransactionManager;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.shipmentRepository = new ShipmentRepository();
    this.transactionManager = new TransactionManager();
  }

  /**
   * Get order details along with its items for a specific customer
   * @param request GetOrderServiceRequest object containing orderId and customerId
   * @returns GetOrderServiceResponse object containing order details and items
   */
  async getOrder(
    request: GetOrderServiceRequest
  ): Promise<GetOrderServiceResponse> {
    try {
      // Use shared transaction manager for get order operation to ensure data consistency
      return await this.transactionManager.withTransaction(async (manager) => {
        if (request.role === "customer" && !request.customerId) {
          throw createError("Customer ID is required for customer role", 400);
        }
        const orderWithItems = await this.orderRepository.findOrderWithItems(
          {
            orderId: request.orderId,
            ...(request.customerId ? { customerId: request.customerId } : {}),
          },
          manager
        );

        if (!orderWithItems) {
          throw createError("Order not found", 404);
        }

        // Calculate totals
        const totalItems = orderWithItems.items.length;
        const totalQuantity = orderWithItems.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        const totalAmount = orderWithItems.items.reduce(
          (sum, item) => sum + Number(item.totalPrice),
          0
        );

        // Prepare shipping address if available
        const shippingAddress =
          orderWithItems.shippingFirstName ||
          orderWithItems.shippingLastName ||
          orderWithItems.shippingAddressLine ||
          orderWithItems.shippingCity ||
          orderWithItems.shippingPostalCode ||
          orderWithItems.shippingProvince
            ? {
                firstName: orderWithItems.shippingFirstName || "",
                lastName: orderWithItems.shippingLastName || "",
                addressLine: orderWithItems.shippingAddressLine || "",
                city: orderWithItems.shippingCity || "",
                postalCode: orderWithItems.shippingPostalCode || "",
                province: orderWithItems.shippingProvince || "",
              }
            : undefined;

        return {
          orderId: orderWithItems.id,
          orderNumber: `ZENITH-${orderWithItems.id.toString().padStart(6, '0')}`,
          customerId: orderWithItems.customerId,
          customerName: `${orderWithItems.customerFirstName || ""} ${
            orderWithItems.customerLastName || ""
          }`.trim(),
          status: orderWithItems.status as OrderStatus,
          totalAmount,
          paymentMethod: orderWithItems.paymentProvider || 'N/A',
          createdAt: orderWithItems.createdAt,
          lastUpdated: orderWithItems.lastUpdated,
          items: orderWithItems.items,
          summary: {
            totalItems,
            totalAmount,
            totalQuantity,
          },
          shippingAddress,
        } as GetOrderServiceResponse;
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "OrderService.getOrder",
      });
      throw error;
    }
  }

  /**
   * Process order from NEW to PROCESSING (take order in charge)
   * @param request ProcessOrderServiceRequest containing orderId and userId
   * @returns ProcessOrderServiceResponse with updated order details
   */
  async processOrder(
    request: ProcessOrderServiceRequest
  ): Promise<ProcessOrderServiceResponse> {
    try {
      return await this.transactionManager.withTransaction(async (manager) => {
        // Get order and verify it exists and is in NEW status
        const order = await this.orderRepository.findOrderById(
          { orderId: request.orderId },
          manager
        );

        if (!order) {
          throw createError("Order not found", 404);
        }

        if (order.status !== OrderStatus.NEW) {
          throw createError(
            `Order must be in NEW status to process. Current status: ${order.status}`,
            400
          );
        }

        // Update order status to PROCESSING and set managedBy
        await this.orderRepository.updateOrder(
          {
            orderId: request.orderId,
            status: OrderStatus.PROCESSING,
            userId: request.userId,
          },
          manager
        );

        // Emit order.processing event to the specific technical user who took charge
        try {
          const { getWebSocketManager } = await import("../utils/websocketManager");
          const websocketManager = getWebSocketManager();
          
          // Get order details for the event
          const orderWithItems = await this.orderRepository.findOrderWithItems(
            { orderId: request.orderId },
            manager
          );
          
          if (orderWithItems) {
            const totalAmount = orderWithItems.items.reduce(
              (sum, item) => sum + Number(item.totalPrice),
              0
            );

            const eventData = {
              type: "order.processing",
              timestamp: new Date().toISOString(),
              data: {
                orderId: order.id,
                customerId: order.customerId,
                customerName: `${orderWithItems.customerFirstName || ''} ${orderWithItems.customerLastName || ''}`.trim() || "Unknown Customer",
                totalAmount,
                managedBy: request.userId,
                statusChangedAt: new Date(),
              },
            };

            // Emit to the specific technical user who took charge
            websocketManager.emitToSpecificUser(request.userId, "order.processing", eventData);
          }
        } catch (wsError) {
          // Log WebSocket error but don't fail the order processing
          errorEmitter.emitBusinessError(wsError as Error, {
            path: "OrderService.processOrder.websocket",
          });
        }

        // Create customer notification for order being processed
        try {
          await createOrderNotification(
            order.customerId,
            order.id,
            'Ordine in preparazione',
            `Il tuo ordine #ZENITH-${order.id.toString().padStart(6, '0')} è stato preso in carico ed è in preparazione.`,
            'normal'
          );
        } catch (notifError) {
          // Log notification error but don't fail the order processing
          errorEmitter.emitBusinessError(notifError as Error, {
            path: "OrderService.processOrder.notification",
          });
        }

        return {
          order: {
            id: order.id,
            status: OrderStatus.PROCESSING,
            managedBy: request.userId,
            lastUpdated: new Date(),
          },
        };
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "OrderService.processOrder",
      });
      throw error;
    }
  }

  /**
   * Create shipment for PROCESSING order (PROCESSING -> SHIPPING)
   * @param request CreateShipmentServiceRequest containing order and shipment details
   * @returns CreateShipmentServiceResponse with shipment and order details
   */
  async createShipment(
    request: CreateShipmentServiceRequest
  ): Promise<CreateShipmentServiceResponse> {
    try {
      return await this.transactionManager.withTransaction(async (manager) => {
        // Get order and verify it exists and is in PROCESSING status
        const order = await this.orderRepository.findOrderById(
          { orderId: request.orderId },
          manager
        );

        if (!order) {
          throw createError("Order not found", 404);
        }

        if (order.status !== OrderStatus.PROCESSING) {
          throw createError(
            `Order must be in PROCESSING status to create shipment. Current status: ${order.status}`,
            400
          );
        }

        // TODO: Insert here call to external shipping API to create shipment and obtain tracking code

        // Generate tracking code
        // In a real system, this would come from the shipping carrier API
        const trackingCode = await this.shipmentRepository.generateTrackingCode(
          request.carrier
        );

        // Generate estimated delivery date (e.g., 5 days from now)
        // In a real system, this would come from the shipping carrier API
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

        // Create shipment
        const shipment = await this.shipmentRepository.createShipment(
          {
            orderId: request.orderId,
            carrier: request.carrier,
            trackingCode,
            createdBy: request.userId,
            estimatedDelivery,
          },
          manager
        );

        // Update order status to SHIPPING
        await this.orderRepository.updateOrderStatus(
          request.orderId,
          OrderStatus.SHIPPING,
          manager
        );

        return {
          shipment,
          order: {
            id: order.id,
            status: OrderStatus.SHIPPING,
            managedBy: request.userId,
          },
        };
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "OrderService.createShipment",
      });
      throw error;
    }
  }

  /**
   * Mark shipment as sent (SHIPPING -> SHIPPED)
   * @param request MarkShipmentSentServiceRequest containing order details
   * @returns MarkShipmentSentServiceResponse with updated shipment and order details
   */
  async markShipmentSent(
    request: MarkShipmentSentServiceRequest
  ): Promise<MarkShipmentSentServiceResponse> {
    try {
      return await this.transactionManager.withTransaction(async (manager) => {
        // Get order and verify it exists and is in SHIPPING status
        const order = await this.orderRepository.findOrderById(
          { orderId: request.orderId },
          manager
        );

        if (!order) {
          throw createError("Order not found", 404);
        }

        if (order.status !== OrderStatus.SHIPPING) {
          throw createError(
            `Order must be in SHIPPING status to mark as sent. Current status: ${order.status}`,
            400
          );
        }

        // Find shipment for this order
        const shipment = await this.shipmentRepository.findShipmentByOrderId(
          request.orderId,
          manager
        );

        if (!shipment) {
          throw createError("No shipment found for this order", 404);
        }

        // Update shipment status to PICKED_UP and set shipping date
        const updatedShipment = await this.shipmentRepository.updateShipment(
          {
            shipmentId: shipment.id,
            status: ShipmentStatus.PICKED_UP,
            shipmentDate: request.actualShippingDate || new Date(),
            updatedBy: request.userId,
          },
          manager
        );

        if (!updatedShipment) {
          throw createError("Failed to update shipment", 500);
        }

        // Update order status to SHIPPED
        await this.orderRepository.updateOrderStatus(
          request.orderId,
          OrderStatus.SHIPPED,
          manager
        );

        // Update inventory (decrement available_quantity and reserved_quantity)
        // Get all order items to update inventory
        const orderItems = await this.orderRepository.findOrderItems(
          request.orderId,
          manager
        );

        // Update inventory for each product in the order
        for (const item of orderItems) {
          await this.productRepository.updateInventoryAfterShipment(
            {
              productMasterId: item.productMasterId,
              quantity: item.quantity,
            },
            manager
          );
        }

        // Emit order.sent event to the technical user who managed the order
        try {
          const { getWebSocketManager } = await import("../utils/websocketManager");
          const websocketManager = getWebSocketManager();
          
          // Get order details for the event
          const orderWithItems = await this.orderRepository.findOrderWithItems(
            { orderId: request.orderId },
            manager
          );
          
          if (orderWithItems && order.userId) {
            const totalAmount = orderWithItems.items.reduce(
              (sum, item) => sum + Number(item.totalPrice),
              0
            );

            const eventData = {
              type: "order.sent",
              timestamp: new Date().toISOString(),
              data: {
                orderId: order.id,
                customerId: order.customerId,
                customerName: `${orderWithItems.customerFirstName || ''} ${orderWithItems.customerLastName || ''}`.trim() || "Unknown Customer",
                totalAmount,
                managedBy: order.userId,
                carrier: updatedShipment.carrier,
                trackingCode: updatedShipment.trackingCode,
                shipmentDate: updatedShipment.shipmentDate,
                estimatedDelivery: updatedShipment.estimatedDelivery,
                statusChangedAt: new Date(),
              },
            };

            // Emit to the specific technical user who managed the order
            websocketManager.emitToSpecificUser(order.userId, "order.sent", eventData);
          }
        } catch (wsError) {
          // Log WebSocket error but don't fail the shipment processing
          errorEmitter.emitBusinessError(wsError as Error, {
            path: "OrderService.markShipmentSent.websocket",
          });
        }

        // Create customer notification for order shipped
        try {
          await createOrderNotification(
            order.customerId,
            order.id,
            'Ordine spedito!',
            `Il tuo ordine #ZENITH-${order.id.toString().padStart(6, '0')} è stato spedito. Tracking: ${updatedShipment.trackingCode}`,
            'high'
          );
        } catch (notifError) {
          // Log notification error but don't fail the shipment processing
          errorEmitter.emitBusinessError(notifError as Error, {
            path: "OrderService.markShipmentSent.notification",
          });
        }

        return {
          shipment: updatedShipment,
          order: {
            id: order.id,
            status: OrderStatus.SHIPPED,
            managedBy: request.userId,
          },
        };
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "OrderService.markShipmentSent",
      });
      throw error;
    }
  }

  /**
   * Check user role and permissions for accessing order data
   * @param userRole The role of the authenticated user
   * @param userId The authenticated user's ID
   * @param customerId The customer ID to validate against user ID
   */
  async checkUserRole(userRole: string, userId: string, customerId?: string) {
    if (userRole === "customer") {
      if (customerId && parseInt(customerId, 10) !== parseInt(userId, 10)) {
        throw createError(
          "Unauthorized access: customer ID does not match user ID",
          403
        );
      }
    }
  }

  /**
   * Advanced order search with multiple filters
   * @param request - Search parameters
   * @returns Paginated list of orders
   */
  async searchOrders(
    request: SearchOrdersServiceRequest
  ): Promise<SearchOrdersServiceResponse> {
    try {
      return await this.transactionManager.withTransaction(async (manager) => {
        // Repository parameter preparation
        const repositoryRequest: SearchOrdersRepositoryRequest = {
          searchTerm: request.searchTerm,
          customerId: request.customerId,
          status: request.status,
          startDate: request.startDate,
          endDate: request.endDate,
          minAmount: request.minAmount,
          maxAmount: request.maxAmount,
          limit: request.limit,
          offset: (request.page - 1) * request.limit,
        };

        // Execute search
        const { orders, total } = await this.orderRepository.searchOrders(
          repositoryRequest,
          manager
        );

        // Data transformation to GetOrderServiceResponse format
        const items = orders.map((order) => {
          const totalItems = order.items.length;
          const totalQuantity = order.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          );
          const totalAmount = order.items.reduce(
            (sum, item) => sum + Number(item.totalPrice),
            0
          );

          const shippingAddress = order.shippingAddressLine
            ? {
                firstName: order.shippingFirstName || "",
                lastName: order.shippingLastName || "",
                addressLine: order.shippingAddressLine,
                city: order.shippingCity || "",
                postalCode: order.shippingPostalCode || "",
                province: order.shippingProvince || "",
              }
            : undefined;

          return {
            orderId: order.id,
            orderNumber: `ZENITH-${order.id.toString().padStart(6, '0')}`,
            customerId: order.customerId,
            customerName: `${order.customerFirstName || ""} ${
              order.customerLastName || ""
            }`.trim(),
            status: order.status as OrderStatus,
            totalAmount,
            paymentMethod: order.paymentProvider || 'N/A',
            totalItems,
            totalQuantity,
            createdAt: order.createdAt,
            lastUpdated: order.lastUpdated,
            items: order.items,
            summary: {
              totalItems,
              totalAmount,
              totalQuantity,
            },
            shippingAddress,
          } as GetOrderServiceResponse;
        });

        // Pagination calculation
        const totalPages = Math.ceil(total / request.limit);

        return {
          items,
          total,
          page: request.page,
          totalPages,
          hasNextPage: request.page < totalPages,
          hasPreviousPage: request.page > 1,
        };
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "OrderService.searchOrders",
      });
      throw error;
    }
  }

  /**
   * Create order from FE cart - validates stock and reserves inventory
   * Handles idempotency by canceling any existing RESERVED orders for the customer
   * @param request CreateCheckoutOrderServiceRequest object containing customerId and items
   * @returns CreateCheckoutOrderServiceResponse object with order details or validation errors
   */
  async createCheckoutOrder(
    request: CreateCheckoutOrderServiceRequest
  ): Promise<CreateCheckoutOrderServiceResponse> {
    try {
      return await this.transactionManager.withTransaction(async (manager) => {
        // Check if customer has an existing RESERVED order (within last 24h)
        const existingReserved = await this.orderRepository.findCustomerCart(
          request.customerId,
          manager
        );

        // If exists and is RESERVED, release stock and cancel it
        if (existingReserved && existingReserved.status === OrderStatus.RESERVED) {
          const items = await this.orderRepository.getOrderItems(
            existingReserved.id,
            manager
          );

          // Release reserved inventory for each item
          for (const item of items) {
            await this.productRepository.releaseReservedInventory(
              item.productMaster.productCode,
              existingReserved.id,
              item.quantity,
              manager
            );
          }

          // Update order status to CANCELLED
          await this.orderRepository.updateOrderStatus(
            existingReserved.id,
            OrderStatus.CANCELLED,
            manager
          );
        }

        // Validate availability for ALL products in FE cart
        const inventoryChecks = request.items.map((item) => ({
          productCode: item.productCode,
          requestedQuantity: item.quantity,
        }));

        const availabilityResults =
          await this.productRepository.checkInventoryAvailability(
            inventoryChecks,
            manager
          );

        const unavailableProducts: UnavailableProductServiceData[] = [];
        for (const result of availabilityResults) {
          if (!result.sufficient) {
            unavailableProducts.push({
              productCode: result.productCode,
              availableToSell: result.availableToSell,
              requested:
                request.items.find((i) => i.productCode === result.productCode)
                  ?.quantity || 0,
            });
          }
        }

        // If any products unavailable, return error without creating order
        if (unavailableProducts.length > 0) {
          return {
            success: false,
            error: "INSUFFICIENT_STOCK",
            unavailableProducts,
          };
        }

        // Create order in RESERVED status
        const order = await this.orderRepository.createOrder(
          {
            customerId: request.customerId,
          },
          manager
        );

        // Update order status to RESERVED immediately
        await this.orderRepository.updateOrderStatus(
          order.id,
          OrderStatus.RESERVED,
          manager
        );

        // Create order items
        const createdItems: OrderItemServiceData[] = [];
        for (const item of request.items) {
          const productVersion = await this.productRepository.getCurrentVersion(
            item.productCode,
            manager
          );

          if (!productVersion) {
            throw createError(`Product ${item.productCode} not found`, 404);
          }

          const orderItem = await this.orderRepository.createOrderItem(
            {
              orderId: order.id,
              productMasterId: productVersion.productMasterId,
              productVersionId: productVersion.id,
              unitPrice: productVersion.price,
              quantity: item.quantity,
            },
            manager
          );

          createdItems.push({
            id: orderItem.id,
            productCode: item.productCode,
            productName: productVersion.name,
            unitPrice: Number(productVersion.price),
            quantity: item.quantity,
            totalPrice: Number(productVersion.price) * item.quantity,
          });
        }

        // Reserve inventory
        const reservationRequests = request.items.map((item) => ({
          productCode: item.productCode,
          quantity: item.quantity,
          orderId: order.id,
        }));

        const reservationSuccess =
          await this.productRepository.reserveInventory(
            reservationRequests,
            manager
          );

        if (!reservationSuccess) {
          throw createError("Failed to reserve inventory", 500);
        }

        // Calculate total amount
        const totalAmount = createdItems.reduce(
          (sum, item) => sum + item.totalPrice,
          0
        );

        // Calculate reserved until (24 hours from now)
        const reservedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

        return {
          success: true,
          orderId: order.id,
          status: OrderStatus.RESERVED,
          items: createdItems,
          totalAmount,
          reservedUntil: reservedUntil.toISOString(),
        };
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "OrderService.createCheckoutOrder",
      });
      throw error;
    }
  }

  /**
   * Add shipping address to RESERVED order
   * - Validates order exists and belongs to customer
   * - Validates order is in RESERVED status
   * - Saves shipping address to order
   */
  async addShippingAddress(
    request: AddShippingAddressServiceRequest
  ): Promise<AddShippingAddressServiceResponse> {
    try {
      const { orderId, customerId, shippingAddress } = request;

      return await this.transactionManager.withTransaction(async (manager) => {
        // Get order and validate
        const order = await this.orderRepository.findOrderById(
          { orderId, customerId },
          manager
        );

        if (!order) {
          throw createError(`Order ${orderId} not found`, 404);
        }

        if (order.status !== OrderStatus.RESERVED) {
          throw createError(
            `Cannot add shipping address to order in status ${order.status}. Order must be in RESERVED status`,
            400
          );
        }

        // Format shipping address
        const formattedAddress = `${shippingAddress.firstName} ${shippingAddress.lastName}, ${shippingAddress.addressLine}, ${shippingAddress.postalCode} ${shippingAddress.city} (${shippingAddress.province})`;

        // Update order with shipping address
        await this.orderRepository.updateOrder(
          {
            orderId,
            shippingFirstName: shippingAddress.firstName,
            shippingLastName: shippingAddress.lastName,
            shippingAddressLine: shippingAddress.addressLine,
            shippingCity: shippingAddress.city,
            shippingPostalCode: shippingAddress.postalCode,
            shippingProvince: shippingAddress.province,
          },
          manager
        );

        return {
          orderId,
          status: OrderStatus.RESERVED,
          shippingAddress: formattedAddress,
        };
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "OrderService.addShippingAddress",
      });
      throw error;
    }
  }
}
