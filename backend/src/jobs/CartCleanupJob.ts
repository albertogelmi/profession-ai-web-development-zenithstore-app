import { OrderRepository } from "../repositories/mysql/OrderRepository";
import { ProductRepository } from "../repositories/mysql/ProductRepository";
import { TransactionManager } from "../utils/transactionManager";
import { errorEmitter } from "../utils/errorEmitter";

// Order status constants
enum OrderStatus {
  CART = "CART",
  RESERVED = "RESERVED",
  EXPIRED = "EXPIRED",
}

/**
 * Cart Cleanup Job
 * Removes expired carts and releases reserved inventory
 */
export class CartCleanupJob {
  private orderRepository: OrderRepository;
  private productRepository: ProductRepository;
  private transactionManager: TransactionManager;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.productRepository = new ProductRepository();
    this.transactionManager = new TransactionManager();
  }

  /**
   * Execute cleanup job
   * Priority: RESERVED first (releases inventory), then CART
   */
  async execute(): Promise<void> {
    const startTime = Date.now();
    console.log("[CartCleanupJob] Starting cart cleanup...");

    try {
      // Configuration from environment
      const cartExpirationHours = Number(
        process.env.CART_EXPIRATION_HOURS || 72
      );
      const reservedExpirationHours = Number(
        process.env.RESERVED_EXPIRATION_HOURS || 24
      );
      const gracePeriodMinutes = Number(
        process.env.CART_GRACE_PERIOD_MINUTES || 10
      );

      let cleanedReserved = 0;
      let cleanedCart = 0;

      // Step 1: Cleanup expired RESERVED orders (priority - releases inventory)
      cleanedReserved = await this.cleanupReservedOrders(
        reservedExpirationHours,
        gracePeriodMinutes
      );

      // Step 2: Cleanup expired CART orders
      cleanedCart = await this.cleanupCartOrders(
        cartExpirationHours,
        gracePeriodMinutes
      );

      const duration = Date.now() - startTime;
      console.log(
        `[CartCleanupJob] Completed in ${duration}ms - RESERVED: ${cleanedReserved}, CART: ${cleanedCart}`
      );
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: "CartCleanupJob.execute",
      });
      console.error("[CartCleanupJob] Failed:", error);
    }
  }

  /**
   * Cleanup expired RESERVED orders
   * Releases inventory and marks orders as EXPIRED
   */
  private async cleanupReservedOrders(
    expirationHours: number,
    gracePeriodMinutes: number
  ): Promise<number> {
    return await this.transactionManager.withTransaction(async (manager) => {
      // Calculate threshold with grace period
      const thresholdDate = new Date();
      thresholdDate.setHours(
        thresholdDate.getHours() - expirationHours,
        thresholdDate.getMinutes() - gracePeriodMinutes
      );

      // Find expired RESERVED orders
      const expiredOrders = await manager.query(
        `
        SELECT id, customer_id as customerId 
        FROM customer_order 
        WHERE status = ? 
        AND last_update < ?
      `,
        [OrderStatus.RESERVED, thresholdDate]
      );

      if (expiredOrders.length === 0) {
        return 0;
      }

      console.log(
        `[CartCleanupJob] Found ${expiredOrders.length} expired RESERVED orders`
      );

      for (const order of expiredOrders) {
        try {
          // Get order items to release inventory
          const items = await this.orderRepository.findOrderItems(
            order.id,
            manager
          );

          // Release reserved inventory for each item
          for (const item of items) {
            await this.productRepository.releaseReservedInventory(
              item.productMaster.productCode,
              order.id,
              item.quantity,
              manager
            );
          }

          // Mark order as EXPIRED (soft delete for audit)
          await manager.query(
            `
            UPDATE customer_order 
            SET status = ?, last_update = NOW()
            WHERE id = ?
          `,
            [OrderStatus.EXPIRED, order.id]
          );

          console.log(
            `[CartCleanupJob] Expired RESERVED order ${order.id} for customer ${order.customerId}`
          );
        } catch (error) {
          console.error(
            `[CartCleanupJob] Failed to cleanup RESERVED order ${order.id}:`,
            error
          );
          // Continue with other orders even if one fails
        }
      }

      return expiredOrders.length;
    });
  }

  /**
   * Cleanup expired CART orders
   * Hard deletes orders and items
   */
  private async cleanupCartOrders(
    expirationHours: number,
    gracePeriodMinutes: number
  ): Promise<number> {
    return await this.transactionManager.withTransaction(async (manager) => {
      // Calculate threshold with grace period
      const thresholdDate = new Date();
      thresholdDate.setHours(
        thresholdDate.getHours() - expirationHours,
        thresholdDate.getMinutes() - gracePeriodMinutes
      );

      // Find expired CART orders
      const expiredOrders = await manager.query(
        `
        SELECT id, customer_id as customerId 
        FROM customer_order 
        WHERE status = ? 
        AND last_update < ?
      `,
        [OrderStatus.CART, thresholdDate]
      );

      if (expiredOrders.length === 0) {
        return 0;
      }

      console.log(
        `[CartCleanupJob] Found ${expiredOrders.length} expired CART orders`
      );

      for (const order of expiredOrders) {
        try {
          // Delete order items first (foreign key constraint)
          await manager.query(
            `
            DELETE FROM order_item 
            WHERE order_id = ?
          `,
            [order.id]
          );

          // Delete order
          await manager.query(
            `
            DELETE FROM customer_order 
            WHERE id = ?
          `,
            [order.id]
          );

          console.log(
            `[CartCleanupJob] Deleted CART order ${order.id} for customer ${order.customerId}`
          );
        } catch (error) {
          console.error(
            `[CartCleanupJob] Failed to cleanup CART order ${order.id}:`,
            error
          );
          // Continue with other orders even if one fails
        }
      }

      return expiredOrders.length;
    });
  }
}
