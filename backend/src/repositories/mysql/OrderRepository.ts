import { Repository, EntityManager } from "typeorm";
import { AppDataSource } from "../../config/database";
import { CustomerOrder, OrderStatus } from "../../entities/mysql/CustomerOrder";
import { OrderItem } from "../../entities/mysql/OrderItem";
import { errorEmitter } from "../../utils/errorEmitter";
import { createError } from "../../middleware/errorHandler";
import {
  CreateOrderRepositoryRequest,
  UpdateOrderRepositoryRequest,
  FindOrderRepositoryRequest,
  CreateOrderItemRepositoryRequest,
  OrderWithItemsData,
  OrderItemData,
  SearchOrdersRepositoryRequest,
} from "../../types/repositories";

export class OrderRepository {
  private orderRepository: Repository<CustomerOrder>;
  private orderItemRepository: Repository<OrderItem>;

  constructor() {
    this.orderRepository = AppDataSource.getRepository(CustomerOrder);
    this.orderItemRepository = AppDataSource.getRepository(OrderItem);
  }

  // ========== ORDER OPERATIONS ==========

  /**
   * Create a new order for a customer
   * @param request CreateOrderRepositoryRequest object containing customerId
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the created CustomerOrder entity
   */
  async createOrder(
    request: CreateOrderRepositoryRequest,
    manager?: EntityManager
  ): Promise<CustomerOrder> {
    try {
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;

      const order = repo.create({
        customerId: request.customerId,
        status: OrderStatus.CART,
        startDate: new Date(),
        lastUpdate: new Date(),
      });

      return await repo.save(order);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.createOrder",
      });
      throw error;
    }
  }

  /**
   * Find an order by its ID and customer ID
   * @param request FindOrderRepositoryRequest object containing orderId and customerId
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the found CustomerOrder entity or null if not found
   */
  async findOrderById(
    request: FindOrderRepositoryRequest,
    manager?: EntityManager
  ): Promise<CustomerOrder | null> {
    try {
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;
      const queryBuilder = repo.createQueryBuilder("order");

      queryBuilder.where("order.id = :orderId", { orderId: request.orderId });
      if (request.customerId !== undefined) {
        queryBuilder.andWhere("order.customerId = :customerId", {
          customerId: request.customerId,
        });
      }

      return await queryBuilder.getOne();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.findOrderById",
      });
      throw error;
    }
  }

  /**
   * Find an order by its transaction ID (and optionally order ID)
   * @param transactionId The transaction ID associated with the order
   * @param orderId Optional order ID to further narrow down the search
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the found CustomerOrder entity or null if not found
   */
  async findOrderByTransactionId(
    transactionId: string,
    orderId?: number,
    manager?: EntityManager
  ): Promise<CustomerOrder | null> {
    try {
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;
      const queryBuilder = repo.createQueryBuilder("order");

      queryBuilder.where("order.transactionId = :transactionId", {
        transactionId,
      });
      if (orderId !== undefined) {
        queryBuilder.andWhere("order.id = :orderId", { orderId });
      }

      return await queryBuilder.getOne();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.findOrderByTransactionId",
      });
      throw error;
    }
  }

  /**
   * Find an order with its items by order ID and customer ID
   * @param request FindOrderRepositoryRequest object containing orderId and customerId
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to OrderWithItemsData or null if not found
   */
  async findOrderWithItems(
    request: FindOrderRepositoryRequest,
    manager?: EntityManager
  ): Promise<OrderWithItemsData | null> {
    try {
      // Get the order with customer data
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;

      const orderWithCustomer = await repo
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.customer", "customer")
        .where("order.id = :orderId", { orderId: request.orderId })
        .andWhere(
          request.customerId !== undefined
            ? "order.customerId = :customerId"
            : "1=1",
          request.customerId !== undefined
            ? { customerId: request.customerId }
            : {}
        )
        .getOne();

      if (!orderWithCustomer) {
        return null;
      }

      // Then get the order items
      const orderItems = await this.getOrderItems(
        orderWithCustomer.id,
        manager
      );

      const items: OrderItemData[] = orderItems.map((item: OrderItem) => ({
        id: item.id,
        productCode: item.productMaster.productCode,
        productName: item.productVersion.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.unitPrice * item.quantity,
      }));

      return {
        id: orderWithCustomer.id,
        customerId: orderWithCustomer.customerId,
        customerFirstName: orderWithCustomer.customer.firstName,
        customerLastName: orderWithCustomer.customer.lastName,
        status: orderWithCustomer.status,
        paymentProvider: orderWithCustomer.paymentProvider || null,
        paymentStatus: orderWithCustomer.paymentStatus || null,
        createdAt: orderWithCustomer.startDate,
        lastUpdated: orderWithCustomer.lastUpdate,
        shippingFirstName: orderWithCustomer.shippingFirstName,
        shippingLastName: orderWithCustomer.shippingLastName,
        shippingAddressLine: orderWithCustomer.addressLine,
        shippingCity: orderWithCustomer.city,
        shippingPostalCode: orderWithCustomer.postalCode,
        shippingProvince: orderWithCustomer.province,
        items,
      };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.findOrderWithItems",
      });
      throw error;
    }
  }

  /**
   * Update an existing order with new details
   * @param request UpdateOrderRepositoryRequest object containing orderId and fields to update
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the updated CustomerOrder entity or null if not found
   */
  async updateOrder(
    request: UpdateOrderRepositoryRequest,
    manager?: EntityManager
  ): Promise<CustomerOrder | null> {
    try {
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;

      const order = await repo.findOne({
        where: { id: request.orderId },
      });

      if (!order) {
        throw createError("Order not found", 404);
      }

      if (request.status) {
        order.status = request.status as OrderStatus;
      }

      // Update shipping fields
      if (request.resetShippingAddress) {
        order.shippingFirstName = null;
        order.shippingLastName = null;
        order.addressLine = null;
        order.city = null;
        order.postalCode = null;
        order.province = null;
      } else {
        if (request.shippingFirstName !== undefined) {
          order.shippingFirstName = request.shippingFirstName;
        }
        if (request.shippingLastName !== undefined) {
          order.shippingLastName = request.shippingLastName;
        }
        if (request.shippingAddressLine !== undefined) {
          order.addressLine = request.shippingAddressLine;
        }
        if (request.shippingCity !== undefined) {
          order.city = request.shippingCity;
        }
        if (request.shippingPostalCode !== undefined) {
          order.postalCode = request.shippingPostalCode;
        }
        if (request.shippingProvince !== undefined) {
          order.province = request.shippingProvince;
        }
      }

      if (request.userId !== undefined) {
        order.userId = request.userId;
      }

      order.lastUpdate = new Date();

      return await repo.save(order);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.updateOrder",
      });
      throw error;
    }
  }

  // ========== ORDER ITEM OPERATIONS ==========

  /**
   * Create a new order item
   * @param request CreateOrderItemRepositoryRequest object containing order item details
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the created OrderItem entity
   */
  async createOrderItem(
    request: CreateOrderItemRepositoryRequest,
    manager?: EntityManager
  ): Promise<OrderItem> {
    try {
      const repo = manager
        ? manager.getRepository(OrderItem)
        : this.orderItemRepository;

      const orderItem = repo.create({
        ...request,
      });

      const savedItem = await repo.save(orderItem);

      // Update order timestamp
      await this.updateOrderTimestamp(request.orderId, manager);

      // Reload with relations
      return (await repo.findOne({
        where: { id: savedItem.id },
        relations: ["productMaster", "productVersion"],
      })) as OrderItem;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.createOrderItem",
      });
      throw error;
    }
  }

  /**
   * Get all order items for a specific order
   * @param orderId The ID of the order
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to an array of OrderItem entities
   */
  async getOrderItems(
    orderId: number,
    manager?: EntityManager
  ): Promise<OrderItem[]> {
    try {
      const repo = manager
        ? manager.getRepository(OrderItem)
        : this.orderItemRepository;

      return await repo.find({
        where: { orderId },
        relations: ["productMaster", "productVersion"],
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.getOrderItems",
      });
      throw error;
    }
  }

  // ========== HELPER METHODS ==========

  /**
   * Update the last_update timestamp of an order
   * @param orderId The ID of the order to update
   * @param manager Optional EntityManager for transaction support
   */
  private async updateOrderTimestamp(
    orderId: number,
    manager?: EntityManager
  ): Promise<void> {
    try {
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;
      await repo.update({ id: orderId }, { lastUpdate: new Date() });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.updateOrderTimestamp",
      });
      throw error;
    }
  }

  /**
   * Find orders by customer ID and status, with an optional limit on the number of results
   * @param customerId The ID of the customer
   * @param status The status of the orders to find
   * @param limit Number of orders to return
   * @param manager Optional EntityManager for transaction support
   * @returns An array of CustomerOrder objects
   */
  async findOrdersByCustomerAndStatus(
    customerId: number,
    status: OrderStatus[],
    limit?: number,
    manager?: EntityManager
  ): Promise<CustomerOrder[]> {
    try {
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;
      const queryBuilder = repo
        .createQueryBuilder("order")
        .where("order.customerId = :customerId", { customerId })
        .andWhere("order.status IN (:...status)", { status })
        .orderBy("order.startDate", "DESC");

      if (limit) {
        queryBuilder.take(limit);
      }

      return await queryBuilder.getMany();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.findOrdersByCustomerAndStatus",
      });
      throw error;
    }
  }

  /**
   * Find the active cart for a customer
   * @param customerId The ID of the customer
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the active cart CustomerOrder or null if not found
   */
  async findCustomerCart(
    customerId: number,
    manager?: EntityManager
  ): Promise<CustomerOrder | null> {
    try {
      const carts = await this.findOrdersByCustomerAndStatus(
        customerId,
        [OrderStatus.CART, OrderStatus.RESERVED],
        1,
        manager
      );
      return carts.length > 0 ? carts[0] || null : null;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.findCustomerCart",
      });
      throw error;
    }
  }

  /**
   * Update order status
   * @param orderId The ID of the order to update
   * @param status New status for the order
   * @param manager Optional EntityManager for transaction support
   */
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    manager?: EntityManager
  ): Promise<void> {
    try {
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;

      await repo.update(
        { id: orderId },
        {
          status,
          lastUpdate: new Date(),
        }
      );
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.updateOrderStatus",
      });
      throw error;
    }
  }

  /**
   * Update payment information for an order
   * @param orderId The ID of the order
   * @param paymentData Payment information to update
   * @param manager Optional EntityManager for transaction support
   */
  async updateOrderPayment(
    orderId: number,
    paymentData: {
      paymentProvider?: string;
      transactionId?: string;
      paymentStatus?: "COMPLETED" | "FAILED";
      paymentDate?: Date;
    },
    manager?: EntityManager
  ): Promise<void> {
    try {
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;

      const updateData: any = {
        lastUpdate: new Date(),
      };

      if (paymentData.paymentProvider !== undefined) {
        updateData.paymentProvider = paymentData.paymentProvider;
      }

      if (paymentData.transactionId !== undefined) {
        updateData.transactionId = paymentData.transactionId;
      }

      if (paymentData.paymentStatus !== undefined) {
        updateData.paymentStatus = paymentData.paymentStatus;
      }

      if (paymentData.paymentDate !== undefined) {
        updateData.paymentDate = paymentData.paymentDate;
      }

      await repo.update({ id: orderId }, updateData);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.updateOrderPayment",
      });
      throw error;
    }
  }

  /**
   * Find order items by order ID
   * @param orderId The ID of the order
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to array of OrderItem
   */
  async findOrderItems(
    orderId: number,
    manager?: EntityManager
  ): Promise<OrderItem[]> {
    try {
      return await this.getOrderItems(orderId, manager);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.findOrderItems",
      });
      throw error;
    }
  }

  /**
   * Advanced order search with multiple filters
   * @param request - Search parameters
   * @param manager - Entity manager for the transaction
   * @returns Array of orders with items and total
   */
  async searchOrders(
    request: SearchOrdersRepositoryRequest,
    manager?: EntityManager
  ): Promise<{ orders: OrderWithItemsData[]; total: number }> {
    try {
      const repo = manager
        ? manager.getRepository(CustomerOrder)
        : this.orderRepository;

      // Build base query for counting
      let countQuery = repo.createQueryBuilder("o").leftJoin("o.customer", "c");

      // Apply filters for count
      if (request.searchTerm) {
        countQuery = countQuery.andWhere(
          "(c.firstName LIKE :searchTerm OR c.lastName LIKE :searchTerm OR CAST(o.id AS CHAR) LIKE :searchTerm)",
          { searchTerm: `%${request.searchTerm}%` }
        );
      }

      if (request.customerId) {
        countQuery = countQuery.andWhere("o.customerId = :customerId", {
          customerId: request.customerId,
        });
      }

      if (request.status) {
        countQuery = countQuery.andWhere("o.status = :status", {
          status: request.status,
        });
      }

      if (request.startDate) {
        countQuery = countQuery.andWhere("o.startDate >= :startDate", {
          startDate: request.startDate,
        });
      }

      if (request.endDate) {
        countQuery = countQuery.andWhere("o.startDate <= :endDate", {
          endDate: request.endDate,
        });
      }

      // Total count
      const total = await countQuery.getCount();

      // Query to get orders with customer
      let query = repo
        .createQueryBuilder("o")
        .leftJoinAndSelect("o.customer", "c");

      // Apply same filters
      if (request.searchTerm) {
        query = query.andWhere(
          "(c.firstName LIKE :searchTerm OR c.lastName LIKE :searchTerm OR CAST(o.id AS CHAR) LIKE :searchTerm)",
          { searchTerm: `%${request.searchTerm}%` }
        );
      }

      if (request.customerId) {
        query = query.andWhere("o.customerId = :customerId", {
          customerId: request.customerId,
        });
      }

      if (request.status) {
        query = query.andWhere("o.status = :status", {
          status: request.status,
        });
      }

      if (request.startDate) {
        query = query.andWhere("o.startDate >= :startDate", {
          startDate: request.startDate,
        });
      }

      if (request.endDate) {
        query = query.andWhere("o.startDate <= :endDate", {
          endDate: request.endDate,
        });
      }

      // Sorting and pagination
      const ordersEntities = await query
        .orderBy("o.lastUpdate", "DESC")
        .addOrderBy("o.startDate", "DESC")
        .skip(request.offset)
        .take(request.limit)
        .getMany();

      // For each order, get items using the existing method
      const orders: OrderWithItemsData[] = [];

      for (const orderEntity of ordersEntities) {
        const orderItems = await this.getOrderItems(orderEntity.id, manager);

        const items: OrderItemData[] = orderItems.map((item) => ({
          id: item.id,
          productCode: item.productMaster.productCode,
          productName: item.productVersion.name,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          totalPrice: item.quantity * item.unitPrice,
        }));

        orders.push({
          id: orderEntity.id,
          customerId: orderEntity.customerId,
          customerFirstName: orderEntity.customer.firstName,
          customerLastName: orderEntity.customer.lastName,
          status: orderEntity.status,
          paymentProvider: orderEntity.paymentProvider || null,
          paymentStatus: orderEntity.paymentStatus || null,
          createdAt: orderEntity.startDate,
          lastUpdated: orderEntity.lastUpdate,
          shippingFirstName: orderEntity.shippingFirstName,
          shippingLastName: orderEntity.shippingLastName,
          shippingAddressLine: orderEntity.addressLine,
          shippingCity: orderEntity.city,
          shippingPostalCode: orderEntity.postalCode,
          shippingProvince: orderEntity.province,
          items,
        });
      }

      // Post-query filter for amounts
      let filteredOrders = orders;
      if (request.minAmount !== undefined || request.maxAmount !== undefined) {
        filteredOrders = orders.filter((order) => {
          const totalAmount = order.items.reduce(
            (sum, item) => sum + item.totalPrice,
            0
          );
          if (
            request.minAmount !== undefined &&
            totalAmount < request.minAmount
          ) {
            return false;
          }
          if (
            request.maxAmount !== undefined &&
            totalAmount > request.maxAmount
          ) {
            return false;
          }
          return true;
        });
      }

      return { orders: filteredOrders, total };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "OrderRepository.searchOrders",
      });
      throw error;
    }
  }
}
