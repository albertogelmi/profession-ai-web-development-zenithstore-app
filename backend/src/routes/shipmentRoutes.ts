import { Router } from 'express';
import { ShipmentController } from '../controllers/ShipmentController';
import { authenticateToken } from '../middleware/auth';

/**
 * Factory to create shipment routes
 * @returns Configured Express Router
 */
export function createShipmentRoutes(): Router {
  const router = Router();
  
  // Controller instantiation
  const shipmentController = new ShipmentController();

  /**
   * @route GET /api/shipments
   * @desc Get shipments with optional filtering by orderId
   * @access Public, JWT required (Customer or User)
   */
  router.get('/', authenticateToken, shipmentController.getShipments);

  /**
   * @route POST /api/shipments/webhook
   * @desc Handle shipment webhook (external shipment provider) 
   * @access Public (no auth required)
   */
  router.post('/webhook', shipmentController.shipmentWebhook);

  return router;
}