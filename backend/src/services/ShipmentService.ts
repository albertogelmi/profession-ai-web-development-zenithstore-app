import { ShipmentRepository } from "../repositories/mysql/ShipmentRepository";
import { TransactionManager } from "../utils/transactionManager";
import { errorEmitter } from "../utils/errorEmitter";
import { createError } from "../middleware/errorHandler";
import { createOrderNotification } from "../utils/notificationHelpers";
import {
  GetShipmentsServiceRequest,
  HandleShipmentWebhookServiceRequest,
  HandleShipmentWebhookServiceResponse,
} from "../types/services";
import { GetShipmentsResponseData } from "../types/api";
import { FindShipmentsRepositoryRequest } from "../types/repositories";
import { ShipmentStatus } from "../entities/mysql/Shipment";
import { OrderRepository } from "../repositories/mysql/OrderRepository";
import { OrderStatus } from "../entities/mysql/CustomerOrder";

export class ShipmentService {
  private shipmentRepository: ShipmentRepository;
  private orderRepository: OrderRepository;
  private transactionManager: TransactionManager;

  constructor() {
    this.shipmentRepository = new ShipmentRepository();
    this.orderRepository = new OrderRepository();
    this.transactionManager = new TransactionManager();
  }

  /**
   * Check user role and permissions for accessing shipments
   * @param userRole The role of the authenticated user
   * @param userId The authenticated user's ID
   * @param customerId The customer ID to validate against user ID
   */
  async checkUserRole(userRole: string, userId: string, customerId?: number) {
    if (userRole === "customer") {
      if (customerId && customerId !== parseInt(userId, 10)) {
        throw createError(
          "Unauthorized access: customer ID does not match user ID",
          403
        );
      }
    }
  }

  /**
   * Get shipments with optional filtering
   * @param request GetShipmentsServiceRequest object containing filters
   * @returns GetShipmentsResponseData object with paginated shipment data
   */
  async getShipments(
    request: GetShipmentsServiceRequest
  ): Promise<GetShipmentsResponseData> {
    try {
      return await this.transactionManager.withTransaction(async (manager) => {
        const filters: FindShipmentsRepositoryRequest = {};
        if (request.orderId) {
          filters.orderId = request.orderId;
        }
        if (request.customerId) {
          filters.customerId = request.customerId;
        }
        if (request.trackingCode) {
          filters.trackingCode = request.trackingCode;
        }
        if (request.carrier) {
          filters.carrier = request.carrier;
        }
        if (request.status) {
          filters.status = request.status;
        }

        // Apply pagination
        if (request.page && request.limit) {
          filters.limit = request.limit;
          filters.offset = (request.page - 1) * request.limit;
        }

        const { shipments, total } =
          await this.shipmentRepository.findShipments(filters, manager);

        const pageNum = request.page || 1;
        const limitNum = request.limit || 50;
        const totalPages = Math.ceil(total / limitNum);

        const result: GetShipmentsResponseData = {
          items: shipments,
          total,
          page: pageNum,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        };

        return result;
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "ShipmentService.getShipments",
      });
      throw error;
    }
  }

  /**
   * Process shipment webhook from shipping provider
   * @param request HandleShipmentWebhookServiceRequest object containing webhook data
   * @returns HandleShipmentWebhookServiceResponse object with processing result
   */
  async processShipmentWebhook(
    request: HandleShipmentWebhookServiceRequest
  ): Promise<HandleShipmentWebhookServiceResponse> {
    try {
      return await this.transactionManager.withTransaction(async (manager) => {
        // Find shipment by tracking code
        const shipment =
          await this.shipmentRepository.findShipmentByTrackingCode(
            request.trackingCode,
            manager
          );

        if (!shipment) {
          throw createError(
            `Shipment with tracking code '${request.trackingCode}' not found`,
            404
          );
        }

        if (shipment.status === ShipmentStatus.DELIVERED) {
          return {
            received: true,
            processed: false,
            trackingCode: shipment.trackingCode,
            status: shipment.status,
          };
        }

        // Update shipment status
        const updateData: any = {
          shipmentId: shipment.id,
          status: request.status,
          updatedBy: "WEBHOOK_SYSTEM",
        };

        if (request.status === ShipmentStatus.DELIVERED && request.timestamp) {
          updateData.deliveredAt = request.timestamp;
        }

        if (request.estimatedDelivery) {
          updateData.estimatedDelivery = request.estimatedDelivery;
        }

        const updatedShipment = await this.shipmentRepository.updateShipment(
          updateData,
          manager
        );

        if (!updatedShipment) {
          throw createError("Failed to update shipment", 500);
        }

        if (request.status === ShipmentStatus.DELIVERED) {
          await this.orderRepository.updateOrder(
            { orderId: shipment.orderId, status: OrderStatus.DELIVERED },
            manager
          );
        }

        // Create customer notifications for shipment status updates
        try {
          const order = await this.orderRepository.findOrderById(
            { orderId: shipment.orderId },
            manager
          );

          if (order) {
            let notificationTitle = '';
            let notificationMessage = '';
            let notificationPriority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

            switch (request.status) {
              case ShipmentStatus.IN_TRANSIT:
                notificationTitle = 'Aggiornamento spedizione';
                notificationMessage = `Il tuo ordine #ZENITH-${shipment.orderId.toString().padStart(6, '0')} è in transito${request.location ? ` - Posizione: ${request.location}` : ''}. Tracking: ${shipment.trackingCode}`;
                notificationPriority = 'normal';
                break;
              case ShipmentStatus.OUT_FOR_DELIVERY:
                notificationTitle = 'Ordine in consegna';
                notificationMessage = `Il tuo ordine #ZENITH-${shipment.orderId.toString().padStart(6, '0')} è in consegna. Tracking: ${shipment.trackingCode}`;
                notificationPriority = 'high';
                break;
              case ShipmentStatus.DELIVERED:
                notificationTitle = 'Ordine consegnato!';
                notificationMessage = `Il tuo ordine #ZENITH-${shipment.orderId.toString().padStart(6, '0')} è stato consegnato. Grazie per il tuo acquisto!`;
                notificationPriority = 'urgent';
                break;
              default:
                // Other statuses don't need customer notifications
                break;
            }

            if (notificationTitle && notificationMessage) {
              await createOrderNotification(
                order.customerId,
                shipment.orderId,
                notificationTitle,
                notificationMessage,
                notificationPriority
              );
            }
          }
        } catch (notifError) {
          // Log notification error but don't fail the shipment processing
          errorEmitter.emitBusinessError(notifError as Error, {
            path: "ShipmentService.processShipmentWebhook.notification",
          });
        }

        // Emit WebSocket events to the technical user who managed the order
        try {
          const { getWebSocketManager } = await import("../utils/websocketManager");
          const websocketManager = getWebSocketManager();
          
          // Get order details to find the managing user
          const order = await this.orderRepository.findOrderById(
            { orderId: shipment.orderId },
            manager
          );
          
          if (order && order.userId) {
            // Get order with customer details for the event
            const orderWithItems = await this.orderRepository.findOrderWithItems(
              { orderId: shipment.orderId },
              manager
            );
            
            if (orderWithItems) {
              const customerName = `${orderWithItems.customerFirstName || ''} ${orderWithItems.customerLastName || ''}`.trim() || "Unknown Customer";
              
              if (request.status === ShipmentStatus.DELIVERED) {
                // Emit order.delivered event
                const deliveredEventData = {
                  type: "order.delivered",
                  timestamp: new Date().toISOString(),
                  data: {
                    orderId: shipment.orderId,
                    customerId: order.customerId,
                    customerName,
                    trackingCode: shipment.trackingCode,
                    carrier: shipment.carrier,
                    deliveredAt: request.timestamp || new Date(),
                    managedBy: order.userId,
                  },
                };
                
                websocketManager.emitToSpecificUser(order.userId, "order.delivered", deliveredEventData);
              } else {
                // Emit order.shipping event for other status updates
                const shippingEventData = {
                  type: "order.shipping",
                  timestamp: new Date().toISOString(),
                  data: {
                    orderId: shipment.orderId,
                    customerId: order.customerId,
                    customerName,
                    trackingCode: shipment.trackingCode,
                    carrier: shipment.carrier,
                    status: request.status,
                    estimatedDelivery: request.estimatedDelivery,
                    managedBy: order.userId,
                    statusChangedAt: new Date(),
                  },
                };
                
                websocketManager.emitToSpecificUser(order.userId, "order.shipping", shippingEventData);
              }
            }
          }
        } catch (wsError) {
          // Log WebSocket error but don't fail the shipment processing
          errorEmitter.emitBusinessError(wsError as Error, {
            path: "ShipmentService.processShipmentWebhook.websocket",
          });
        }

        return {
          received: true,
          processed: true,
          trackingCode: updatedShipment.trackingCode,
          status: updatedShipment.status,
        };
      });
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "ShipmentService.processShipmentWebhook",
      });
      throw error;
    }
  }
}
