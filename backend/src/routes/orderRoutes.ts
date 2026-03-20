import { Router } from "express";
import { OrderController } from "../controllers/OrderController";
import {
  authenticateToken,
  authenticateTokenCustomer,
  authenticateTokenUser,
} from "../middleware/auth";
import { corsMiddleware } from "../middleware/security";
import { domainRestriction } from "../middleware/domainRestriction";

/**
 * Factory to create order routes
 * @returns Configured Express Router
 */
export function createOrderRoutes(): Router {
  const router = Router();

  // Controller instantiation
  const orderController = new OrderController();

  /**
   * @route POST /api/orders/checkout
   * @desc Create order from FE cart - validates stock and reserves inventory
   * @access Public, JWT required (Customer)
   */
  router.post(
    "/checkout",
    authenticateTokenCustomer,
    orderController.checkoutFromCart
  );

  /**
   * @route POST /api/orders/:id/shipping
   * @desc Add shipping address to RESERVED order
   * @access Public, JWT required (Customer)
   */
  router.post(
    "/:id/shipping",
    authenticateTokenCustomer,
    orderController.addShippingAddress
  );

  /**
   * @route GET /api/orders/search
   * @desc Advanced order search with multiple criteria
   * @access Public, JWT required (Customer or User)
   */
  router.get("/search", authenticateToken, orderController.searchOrders);

  /**
   * @route GET /api/orders/:id
   * @desc Get order details with all items
   * @access Public, JWT required (Customer or User)
   */
  router.get("/:id", authenticateToken, orderController.getOrder);

  /**
   * @route PATCH /api/orders/:id/process
   * @desc Take order in charge for processing (NEW -> PROCESSING)
   * @access Localhost only, JWT required (User)
   */
  router.patch(
    "/:id/process",
    corsMiddleware,
    domainRestriction,
    authenticateTokenUser,
    orderController.processOrder
  );

  /**
   * @route POST /api/orders/:id/ship
   * @desc Create shipment for an order (PROCESSING -> SHIPPING)
   * @access Localhost only, JWT required (User)
   */
  router.post(
    "/:id/ship",
    corsMiddleware,
    domainRestriction,
    authenticateTokenUser,
    orderController.createShipment
  );

  /**
   * @route PATCH /api/orders/:id/ship/sent
   * @desc Mark shipment as sent/picked up by carrier (SHIPPING -> SHIPPED)
   * @access Localhost only, JWT required (User)
   */
  router.patch(
    "/:id/ship/sent",
    corsMiddleware,
    domainRestriction,
    authenticateTokenUser,
    orderController.markShipmentSent
  );

  return router;
}

export default createOrderRoutes;
