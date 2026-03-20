import { Response } from "express";
import { asyncHandler, createError } from "../middleware/errorHandler";
import {
  InitiatePaymentRequest,
  InitiatePaymentResponse,
  InitiatePaymentResponseData,
  PaymentWebhookRequest,
  PaymentWebhookResponse,
  PaymentWebhookResponseData,
  createApiResponse,
} from "../types/api";
import { PaymentService } from "../services/PaymentService";

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Initiate payment for an order
   * POST /api/payments
   */
  initiatePayment = asyncHandler(
    async (
      req: InitiatePaymentRequest,
      res: Response<InitiatePaymentResponse>
    ): Promise<void> => {
      const { orderId, paymentMethod } = req.body;
      const customerId = req.user?.userId;

      // Basic validation
      if (!orderId || !paymentMethod) {
        throw createError(
          "Missing required fields: orderId, paymentMethod",
          400
        );
      }

      if (!customerId) {
        throw createError("Customer authentication required", 401);
      }

      // Call service layer
      const serviceResult = await this.paymentService.initiatePayment({
        orderId,
        customerId: parseInt(customerId, 10),
        paymentMethod,
      });

      const result: InitiatePaymentResponseData = {
        transactionId: serviceResult.transactionId,
        paymentProvider: serviceResult.paymentProvider,
        paymentUrl: serviceResult.paymentUrl,
        sessionId: serviceResult.sessionId,
        expiresAt: serviceResult.expiresAt,
        order: serviceResult.order,
      };

      res
        .status(201)
        .json(
          createApiResponse(true, "Payment initiated successfully", result)
        );
    }
  );

  /**
   * Handle payment webhook from payment provider
   * POST /api/payments/webhook
   */
  paymentWebhook = asyncHandler(
    async (
      req: PaymentWebhookRequest,
      res: Response<PaymentWebhookResponse>
    ): Promise<void> => {
      const { status, transactionId, timestamp, orderId } = req.body;

      // Basic validation
      if (!status || !transactionId) {
        throw createError(
          "Missing required fields: status, transactionId",
          400
        );
      }

      // Validate status
      const validStatuses = ["COMPLETED", "FAILED", "CANCELLED"];
      if (!validStatuses.includes(status)) {
        throw createError(`Invalid status value: ${status}`, 400);
      }

      // Call service layer to process webhook
      const serviceResult = await this.paymentService.processPaymentWebhook({
        status: status as "COMPLETED" | "FAILED" | "CANCELLED",
        transactionId,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        orderId,
      });

      const result: PaymentWebhookResponseData = {
        received: serviceResult.received,
        processed: serviceResult.processed,
        orderId: serviceResult.orderId,
        status: serviceResult.status,
      };

      res
        .status(200)
        .json(
          createApiResponse(
            true,
            "Payment webhook processed successfully",
            result
          )
        );
    }
  );
}
