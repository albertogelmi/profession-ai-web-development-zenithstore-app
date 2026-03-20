import { OrderRepository } from "../repositories/mysql/OrderRepository";
import { ProductRepository } from "../repositories/mysql/ProductRepository";
import { TransactionManager } from "../utils/transactionManager";
import { errorEmitter } from "../utils/errorEmitter";
import { createError } from "../middleware/errorHandler";
import { getWebSocketManager, OrderPaidEventData } from "../utils/websocketManager";
import { createOrderNotification } from "../utils/notificationHelpers";
import {
  InitiatePaymentServiceRequest,
  InitiatePaymentServiceResponse,
  HandlePaymentWebhookServiceRequest,
  HandlePaymentWebhookServiceResponse,
} from "../types/services";
import { OrderStatus } from "../entities/mysql/CustomerOrder";

export class PaymentService {
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;
  private transactionManager: TransactionManager;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.transactionManager = new TransactionManager();
  }

  /**
   * Initiate payment for an order
   * @param request InitiatePaymentServiceRequest object containing orderId and paymentMethod
   * @returns InitiatePaymentServiceResponse object with payment details
   */
  async initiatePayment(
    request: InitiatePaymentServiceRequest
  ): Promise<InitiatePaymentServiceResponse> {
    try {
      return await this.transactionManager.withTransaction(async (manager) => {
        // Find order by ID
        const order = await this.orderRepository.findOrderById(
          { orderId: request.orderId, customerId: request.customerId },
          manager
        );

        if (!order) {
          throw createError("Order not found", 404);
        }

        // Check if order is in correct status for payment (only RESERVED is valid)
        if (order.status !== OrderStatus.RESERVED) {
          throw createError(
            `Order must be in RESERVED status. Current status: ${order.status}`, 400
          );
        }

        // Generate payment session data (mocked for external service)
        const transactionId = `txn_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const sessionId = `sess_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        const paymentUrl = `https://${request.paymentMethod.toLowerCase()}.com/pay/${sessionId}`;
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

        // Update order with payment provider info
        await this.orderRepository.updateOrderPayment(
          request.orderId,
          {
            paymentProvider: request.paymentMethod,
            transactionId: transactionId,
          },
          manager
        );

        // Get order items for total calculation
        const orderItems = await this.orderRepository.getOrderItems(
          request.orderId,
          manager
        );

        const totalAmount = orderItems.reduce(
          (sum, item) => sum + item.unitPrice * item.quantity,
          0
        );

        return {
          transactionId,
          paymentProvider: request.paymentMethod,
          paymentUrl,
          sessionId,
          expiresAt,
          order: {
            id: order.id,
            status: order.status,
            totalAmount,
          },
        };
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "PaymentService.initiatePayment",
      });
      throw error;
    }
  }

  /**
   * Process payment webhook from payment provider
   * @param request HandlePaymentWebhookServiceRequest object containing webhook data
   * @returns HandlePaymentWebhookServiceResponse object with processing result
   */
  async processPaymentWebhook(
    request: HandlePaymentWebhookServiceRequest
  ): Promise<HandlePaymentWebhookServiceResponse> {
    try {
      return await this.transactionManager.withTransaction(async (manager) => {
        // Find order by transaction ID and/or order ID
        const order = await this.orderRepository.findOrderByTransactionId(
          request.transactionId,
          request.orderId,
          manager
        );

        if (!order) {
          throw createError("Order not found", 404);
        }

        // If order already processed, return early
        if (order.status === OrderStatus.NEW) {
          return {
            received: true,
            processed: false,
            orderId: order.id,
            status: "ALREADY_PAID",
            message: "Payment already processed successfully for this order",
          };
        }

        if (order.status === OrderStatus.CANCELLED) {
          return {
            received: true,
            processed: false,
            orderId: order.id,
            status: "ALREADY_CANCELLED",
            message: "Order already cancelled, payment already processed",
          };
        }

        // Check if order is in correct status for payment processing (only RESERVED is valid)
        if (order.status !== OrderStatus.RESERVED) {
          throw createError(
            `Order must be in RESERVED status. Current status: ${order.status}`, 400
          );
        }

        // Update payment status based on webhook status
        let paymentStatus: "COMPLETED" | "FAILED";
        let newOrderStatus: OrderStatus;

        switch (request.status) {
          case "COMPLETED":
            paymentStatus = "COMPLETED";
            newOrderStatus = OrderStatus.NEW;
            break;
          case "FAILED":
          case "CANCELLED":
            paymentStatus = "FAILED";
            // Keep order in RESERVED for retry or move to CANCELLED
            newOrderStatus =
              request.status === "CANCELLED"
                ? OrderStatus.CANCELLED
                : order.status;
            break;
          default:
            throw createError(`Invalid payment status: ${request.status}`, 400);
        }

        // Update order payment information
        await this.orderRepository.updateOrderPayment(
          order.id,
          {
            paymentStatus,
            paymentDate: new Date(request.timestamp || Date.now()),
          },
          manager
        );

        // Update order status
        await this.orderRepository.updateOrderStatus(
          order.id,
          newOrderStatus,
          manager
        );

        // If payment completed, generate order.paid websocket event and notification
        if (paymentStatus === "COMPLETED") {
          try {
            const websocketManager = getWebSocketManager();
            
            // Get order with customer information and calculate total
            const orderWithItems = await this.orderRepository.findOrderWithItems(
              { orderId: order.id },
              manager
            );
            
            if (orderWithItems) {
              const totalAmount = orderWithItems.items.reduce(
                (sum, item) => sum + item.totalPrice,
                0
              );

              const eventData: OrderPaidEventData = {
                orderId: order.id,
                customerId: order.customerId,
                customerName: `${orderWithItems.customerFirstName || ''} ${orderWithItems.customerLastName || ''}`.trim() || "Unknown Customer",
                totalAmount,
                paymentDate: new Date(request.timestamp),
                paymentProvider: order.paymentProvider || "Unknown",
                transactionId: request.transactionId,
              };

              websocketManager.emitOrderPaidEvent(eventData);
            }
          } catch (wsError) {
            // Log WebSocket error but don't fail the payment processing
            errorEmitter.emitBusinessError(wsError as Error, {
              path: "PaymentService.processPaymentWebhook.websocket",
            });
          }

          // Create customer notification for order confirmation
          try {
            await createOrderNotification(
              order.customerId,
              order.id,
              'Ordine confermato!',
              `Il tuo ordine #ZENITH-${order.id.toString().padStart(6, '0')} è stato confermato e verrà elaborato a breve.`,
              'high'
            );
          } catch (notifError) {
            // Log notification error but don't fail the payment processing
            errorEmitter.emitBusinessError(notifError as Error, {
              path: "PaymentService.processPaymentWebhook.notification",
            });
          }
        }

        // If payment cancelled, release reserved inventory and create cancellation notification
        if (request.status === "CANCELLED" && newOrderStatus === OrderStatus.CANCELLED) {
          // Get order items to release reserved stock
          const orderItems = await this.orderRepository.getOrderItems(
            order.id,
            manager
          );

          // Release reserved inventory for each item
          for (const item of orderItems) {
            try {
              await this.productRepository.releaseReservedInventory(
                item.productMaster.productCode,
                order.id,
                item.quantity,
                manager
              );
            } catch (releaseError) {
              // Log error but continue processing other items
              errorEmitter.emitBusinessError(releaseError as Error, {
                path: "PaymentService.processPaymentWebhook.releaseInventory",
              });
            }
          }

          try {
            await createOrderNotification(
              order.customerId,
              order.id,
              'Ordine annullato',
              `Il tuo ordine #ZENITH-${order.id.toString().padStart(6, '0')} è stato annullato. Il pagamento non è andato a buon fine.`,
              'high'
            );
          } catch (notifError) {
            // Log notification error but don't fail the payment processing
            errorEmitter.emitBusinessError(notifError as Error, {
              path: "PaymentService.processPaymentWebhook.cancellation.notification",
            });
          }
        }

        const resultStatus =
          paymentStatus === "COMPLETED"
            ? "PAID"
            : paymentStatus === "FAILED"
            ? "PAYMENT_FAILED"
            : "PAYMENT_CANCELLED";

        return {
          received: true,
          processed: true,
          orderId: order.id,
          status: resultStatus,
        };
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "PaymentService.processPaymentWebhook",
      });
      throw error;
    }
  }
}
