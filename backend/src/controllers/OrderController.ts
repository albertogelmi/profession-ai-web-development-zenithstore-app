import { Response } from "express";
import { OrderService } from "../services/OrderService";
import { asyncHandler, createError } from "../middleware/errorHandler";
import {
  GetOrderRequest,
  GetOrderResponse,
  ProcessOrderRequest,
  ProcessOrderResponse,
  CreateShipmentRequest,
  CreateShipmentResponse,
  MarkShipmentSentRequest,
  MarkShipmentSentResponse,
  SearchOrdersRequest,
  SearchOrdersQuery,
  SearchOrdersResponse,
  CreateCheckoutOrderRequest,
  CreateCheckoutOrderRequestBody,
  CreateCheckoutOrderResponse,
  AddShippingAddressRequest,
  AddShippingAddressRequestBody,
  AddShippingAddressResponse,
  createApiResponse,
} from "../types/api";
import { SearchOrdersServiceRequest } from "../types/services";

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  /**
   * GET /api/orders/:id
   * Get order details with all items
   */
  getOrder = asyncHandler(
    async (
      req: GetOrderRequest,
      res: Response<GetOrderResponse>
    ): Promise<void> => {
      const role = req.user?.role;
      const customerId = req.user?.userId;
      if (!role) {
        throw createError("Authentication required", 401);
      }
      if (role === "customer" && !customerId) {
        throw createError("Customer authentication required", 401);
      }

      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        throw createError("Invalid order ID", 400);
      }

      const orderData = await this.orderService.getOrder({
        orderId,
        role,
        customerId: customerId ? parseInt(customerId) : undefined,
      });

      res
        .status(200)
        .json(
          createApiResponse(true, "Order retrieved successfully", orderData)
        );
    }
  );

  /**
   * PATCH /api/orders/:id/process
   * Take order in charge for processing (NEW -> PROCESSING)
   * Only accessible by technical users from localhost
   */
  processOrder = asyncHandler(
    async (
      req: ProcessOrderRequest,
      res: Response<ProcessOrderResponse>
    ): Promise<void> => {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError("User authentication required", 401);
      }

      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        throw createError("Valid order ID required", 400);
      }

      const result = await this.orderService.processOrder({
        orderId,
        userId,
      });

      res
        .status(200)
        .json(createApiResponse(true, "Order processed successfully", result));
    }
  );

  /**
   * POST /api/orders/:id/ship
   * Create shipment for PROCESSING order (PROCESSING -> SHIPPING)
   * Only accessible by technical users from localhost
   */
  createShipment = asyncHandler(
    async (
      req: CreateShipmentRequest,
      res: Response<CreateShipmentResponse>
    ): Promise<void> => {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError("User authentication required", 401);
      }

      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        throw createError("Valid order ID required", 400);
      }

      const { carrier } = req.body;

      if (!carrier || carrier.trim().length < 2) {
        throw createError(
          "Carrier name is required and must be at least 2 characters",
          400
        );
      }

      const shipmentData = await this.orderService.createShipment({
        orderId,
        carrier: carrier.toUpperCase().trim(),
        userId,
      });

      res
        .status(201)
        .json(
          createApiResponse(true, "Shipment created successfully", shipmentData)
        );
    }
  );

  /**
   * PATCH /api/orders/:id/ship/sent
   * Mark shipment as sent (SHIPPING -> SHIPPED)
   * Only accessible by technical users from localhost
   */
  markShipmentSent = asyncHandler(
    async (
      req: MarkShipmentSentRequest,
      res: Response<MarkShipmentSentResponse>
    ): Promise<void> => {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError("User authentication required", 401);
      }

      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        throw createError("Valid order ID required", 400);
      }

      const { actualShippingDate } = req.body;

      const result = await this.orderService.markShipmentSent({
        orderId,
        userId,
        actualShippingDate,
      });

      res
        .status(200)
        .json(
          createApiResponse(
            true,
            "Shipment marked as sent successfully",
            result
          )
        );
    }
  );

  /**
   * GET /api/orders/search
   * Advanced order search with multiple criteria
   */
  searchOrders = asyncHandler(
    async (
      req: SearchOrdersRequest,
      res: Response<SearchOrdersResponse>
    ): Promise<void> => {
      const {
        searchTerm,
        customerId,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        page = "1",
        limit = "50",
      }: SearchOrdersQuery = req.query;

      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        throw createError("Authentication required", 401);
      }

      // Parse and validate pagination parameters
      const pageNum = page ? parseInt(page) : 1;
      const limitNum = limit ? parseInt(limit) : 50;

      // Parse and validate other numeric parameters
      let minAmountNum: number | undefined;
      if (minAmount) {
        minAmountNum = parseFloat(minAmount);
        if (isNaN(minAmountNum) || minAmountNum < 0) {
          throw createError("minAmount must be a valid positive number", 400);
        }
      }

      let maxAmountNum: number | undefined;
      if (maxAmount) {
        maxAmountNum = parseFloat(maxAmount);
        if (isNaN(maxAmountNum) || maxAmountNum < 0) {
          throw createError("maxAmount must be a valid positive number", 400);
        }
      }

      // Parse dates
      let startDateObj: Date | undefined;
      if (startDate) {
        startDateObj = new Date(startDate);
        if (isNaN(startDateObj.getTime())) {
          throw createError("startDate must be a valid date", 400);
        }
      }

      let endDateObj: Date | undefined;
      if (endDate) {
        endDateObj = new Date(endDate);
        if (isNaN(endDateObj.getTime())) {
          throw createError("endDate must be a valid date", 400);
        }
      }

      // Validate date range
      if (startDateObj && endDateObj && startDateObj > endDateObj) {
        throw createError("startDate must be before endDate", 400);
      }

      // Validate amount range
      if (minAmountNum && maxAmountNum && minAmountNum > maxAmountNum) {
        throw createError("minAmount must be less than maxAmount", 400);
      }

      // Check user role and permissions
      await this.orderService.checkUserRole(userRole, userId, customerId);

      const searchRequest: SearchOrdersServiceRequest = {
        searchTerm: searchTerm?.trim(),
        customerId:
          userRole === "customer"
            ? parseInt(userId, 10)
            : customerId
            ? parseInt(customerId.toString(), 10)
            : undefined,
        status: status?.trim(),
        startDate: startDateObj,
        endDate: endDateObj,
        minAmount: minAmountNum,
        maxAmount: maxAmountNum,
        page: pageNum,
        limit: Math.min(limitNum, 100), // Max 100
      };

      const searchResponseData = await this.orderService.searchOrders(
        searchRequest
      );

      res.json(
        createApiResponse(
          true,
          "Orders retrieved successfully",
          searchResponseData
        )
      );
    }
  );

  /**
   * POST /api/orders/checkout
   * Create order from FE cart - validates stock and reserves inventory
   */
  checkoutFromCart = asyncHandler(
    async (
      req: CreateCheckoutOrderRequest,
      res: Response<CreateCheckoutOrderResponse>
    ): Promise<void> => {
      const customerId = req.user?.userId;
      if (!customerId) {
        throw createError("Customer authentication required", 401);
      }

      const requestBody: CreateCheckoutOrderRequestBody = req.body;

      // Validate items array
      if (!Array.isArray(requestBody.items) || requestBody.items.length === 0) {
        throw createError("Items array is required and cannot be empty", 400);
      }

      // Validate each item
      for (const item of requestBody.items) {
        if (!item.productCode || typeof item.productCode !== "string") {
          throw createError("Each item must have a valid productCode", 400);
        }
        if (
          !item.quantity ||
          typeof item.quantity !== "number" ||
          item.quantity <= 0 ||
          !Number.isInteger(item.quantity)
        ) {
          throw createError(
            "Each item must have a positive integer quantity",
            400
          );
        }
      }

      const checkoutResult = await this.orderService.createCheckoutOrder({
        customerId: parseInt(customerId),
        items: requestBody.items,
      });

      if (checkoutResult.success) {
        res.status(201).json(
          createApiResponse(
            true,
            "Order created and inventory reserved successfully",
            checkoutResult
          )
        );
      } else {
        res.status(409).json(
          createApiResponse(
            false,
            "Some products are not available in requested quantities",
            checkoutResult
          )
        );
      }
    }
  );

  /**
   * POST /api/orders/:id/shipping
   * Add shipping address to RESERVED order
   */
  addShippingAddress = asyncHandler(
    async (
      req: AddShippingAddressRequest,
      res: Response<AddShippingAddressResponse>
    ): Promise<void> => {
      const customerId = req.user?.userId;
      if (!customerId) {
        throw createError("Customer authentication required", 401);
      }

      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        throw createError("Invalid order ID", 400);
      }

      const requestBody: AddShippingAddressRequestBody = req.body;

      // Validate shipping address
      const { shippingAddress } = requestBody;
      if (!shippingAddress) {
        throw createError("Shipping address is required", 400);
      }

      if (
        !shippingAddress.firstName ||
        shippingAddress.firstName.trim().length < 2
      ) {
        throw createError("First name must be at least 2 characters long", 400);
      }

      if (
        !shippingAddress.lastName ||
        shippingAddress.lastName.trim().length < 2
      ) {
        throw createError("Last name must be at least 2 characters long", 400);
      }

      if (
        !shippingAddress.addressLine ||
        shippingAddress.addressLine.trim().length < 5
      ) {
        throw createError("Address line must be at least 5 characters long", 400);
      }

      if (!shippingAddress.city || shippingAddress.city.trim().length < 2) {
        throw createError("City must be at least 2 characters long", 400);
      }

      if (
        !shippingAddress.postalCode ||
        shippingAddress.postalCode.trim().length !== 5
      ) {
        throw createError("Postal code must be 5 characters", 400);
      }

      if (
        !shippingAddress.province ||
        shippingAddress.province.trim().length !== 2
      ) {
        throw createError("Province must be 2 characters", 400);
      }

      // Trim all fields
      shippingAddress.firstName = shippingAddress.firstName.trim();
      shippingAddress.lastName = shippingAddress.lastName.trim();
      shippingAddress.addressLine = shippingAddress.addressLine.trim();
      shippingAddress.city = shippingAddress.city.trim();
      shippingAddress.postalCode = shippingAddress.postalCode.trim();
      shippingAddress.province = shippingAddress.province.toUpperCase().trim();

      const result = await this.orderService.addShippingAddress({
        orderId,
        customerId: parseInt(customerId),
        shippingAddress,
      });

      res.status(200).json(
        createApiResponse(
          true,
          "Shipping address added successfully",
          result
        )
      );
    }
  );
}
