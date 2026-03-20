import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authenticateTokenCustomer } from '../middleware/auth';

/**
 * Factory to create payment routes
 * @returns Configured Express Router
 */
export function createPaymentRoutes(): Router {
  const router = Router();
  
  // Controller instantiation
  const paymentController = new PaymentController();

  /**
   * @route POST /api/payments
   * @desc Initiate payment for RESERVED order (RESERVED -> NEW)
   * @access Public, JWT required (Customer)
   */
  router.post('/', authenticateTokenCustomer, paymentController.initiatePayment);

  /**
   * @route POST /api/payments/webhook
   * @desc Handle payment webhook (external payment provider)
   * @access Public (no auth required)
   */
  router.post('/webhook', paymentController.paymentWebhook);

  return router;
}