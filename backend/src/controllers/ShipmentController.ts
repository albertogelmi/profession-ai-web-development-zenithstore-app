import { Response } from "express";
import { asyncHandler, createError } from "../middleware/errorHandler";
import {
  GetShipmentsRequest,
  GetShipmentsQuery,
  GetShipmentsResponse,
  ShipmentWebhookRequest,
  ShipmentWebhookResponse,
  ShipmentWebhookResponseData,
  createApiResponse,
} from "../types/api";
import { ShipmentService } from "../services/ShipmentService";
import { ShipmentStatus } from "../entities/mysql/Shipment";

export class ShipmentController {
  private shipmentService: ShipmentService;

  constructor() {
    this.shipmentService = new ShipmentService();
  }

  /**
   * Get shipments with optional filtering
   * GET /api/shipments?orderId=xxx&carrier=xxx&status=xxx
   */
  getShipments = asyncHandler(
    async (
      req: GetShipmentsRequest,
      res: Response<GetShipmentsResponse>
    ): Promise<void> => {
      const {
        orderId,
        customerId,
        trackingCode,
        carrier,
        status,
        page = "1",
        limit = "50",
      }: GetShipmentsQuery = req.query;

      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        throw createError("Authentication required", 401);
      }

      // Parse and validate pagination parameters
      const pageNum = page ? parseInt(page) : 1;
      const limitNum = limit ? parseInt(limit) : 50;

      // Validate orderId if provided
      let parsedOrderId: number | undefined;
      if (orderId) {
        parsedOrderId = parseInt(orderId.toString(), 10);
        if (isNaN(parsedOrderId)) {
          throw createError("Invalid orderId parameter", 400);
        }
      }

      // Check user role and permissions
      await this.shipmentService.checkUserRole(userRole, userId, customerId);

      // Call service layer
      const serviceResult = await this.shipmentService.getShipments({
        orderId: parsedOrderId ? parsedOrderId : undefined,
        customerId:
          userRole === "customer"
            ? parseInt(userId, 10)
            : customerId
            ? parseInt(customerId.toString(), 10)
            : undefined,
        trackingCode: trackingCode?.toString(),
        carrier: carrier?.toString(),
        status: status?.toString(),
        page: pageNum,
        limit: Math.min(limitNum, 100), // Max 100
      });

      res
        .status(200)
        .json(
          createApiResponse(
            true,
            "Shipments retrieved successfully",
            serviceResult
          )
        );
    }
  );

  /**
   * Handle shipment webhook from shipping provider
   * POST /api/shipments/webhook
   */
  shipmentWebhook = asyncHandler(
    async (
      req: ShipmentWebhookRequest,
      res: Response<ShipmentWebhookResponse>
    ): Promise<void> => {
      const { trackingCode, status, location, timestamp, estimatedDelivery } =
        req.body;

      // Basic validation
      if (!trackingCode || !status) {
        throw createError("Missing required fields: trackingCode, status", 400);
      }

      // Validate status
      const validStatuses = [
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.DELIVERED,
        ShipmentStatus.FAILED,
      ];
      if (!validStatuses.includes(status)) {
        throw createError(`Invalid status. Must be one of: ${validStatuses.join(", ")}`, 400);
      }

      // Call service layer to process webhook
      const serviceResult = await this.shipmentService.processShipmentWebhook({
        trackingCode,
        status,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        location,
        estimatedDelivery: estimatedDelivery
          ? new Date(estimatedDelivery)
          : undefined,
      });

      const result: ShipmentWebhookResponseData = {
        received: serviceResult.received,
        processed: serviceResult.processed,
        trackingCode: serviceResult.trackingCode,
        status: serviceResult.status,
      };

      res
        .status(200)
        .json(
          createApiResponse(
            true,
            "Shipment webhook processed successfully",
            result
          )
        );
    }
  );
}
