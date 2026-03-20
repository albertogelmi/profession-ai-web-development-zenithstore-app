import { Repository, EntityManager } from "typeorm";
import { AppDataSource } from "../../config/database";
import { Shipment, ShipmentStatus } from "../../entities/mysql/Shipment";
import {
  CreateShipmentRepositoryRequest,
  UpdateShipmentRepositoryRequest,
  FindShipmentsRepositoryRequest,
} from "../../types/repositories";
import { errorEmitter } from "../../utils/errorEmitter";

export class ShipmentRepository {
  private shipmentRepository: Repository<Shipment>;

  constructor() {
    this.shipmentRepository = AppDataSource.getRepository(Shipment);
  }

  /**
   * Create a new shipment record
   * @param request CreateShipmentRepositoryRequest object
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the created Shipment entity
   */
  async createShipment(
    request: CreateShipmentRepositoryRequest,
    manager?: EntityManager
  ): Promise<Shipment> {
    try {
      const repo = manager
        ? manager.getRepository(Shipment)
        : this.shipmentRepository;

      const shipment = repo.create({
        orderId: request.orderId,
        carrier: request.carrier,
        trackingCode: request.trackingCode,
        createdBy: request.createdBy,
        estimatedDelivery: request.estimatedDelivery,
        status: ShipmentStatus.CREATED,
      });

      const savedShipment = await repo.save(shipment);

      // Reload with relations
      return (await repo.findOne({
        where: { id: savedShipment.id },
        relations: ["order"],
      })) as Shipment;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ShipmentRepository.createShipment",
      });
      throw error;
    }
  }

  /**
   * Find a shipment by ID
   * @param shipmentId The ID of the shipment
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the found Shipment entity or null
   */
  async findShipmentById(
    shipmentId: number,
    manager?: EntityManager
  ): Promise<Shipment | null> {
    try {
      const repo = manager
        ? manager.getRepository(Shipment)
        : this.shipmentRepository;

      return await repo.findOne({
        where: { id: shipmentId },
        relations: ["order"],
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ShipmentRepository.findShipmentById",
      });
      throw error;
    }
  }

  /**
   * Find shipment by order ID
   * @param orderId The ID of the order
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the found Shipment entity or null
   */
  async findShipmentByOrderId(
    orderId: number,
    manager?: EntityManager
  ): Promise<Shipment | null> {
    try {
      const repo = manager
        ? manager.getRepository(Shipment)
        : this.shipmentRepository;

      return await repo.findOne({
        where: { orderId },
        relations: ["order"],
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ShipmentRepository.findShipmentByOrderId",
      });
      throw error;
    }
  }

  /**
   * Find shipment by tracking code
   * @param trackingCode The tracking code of the shipment
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the found Shipment entity or null
   */
  async findShipmentByTrackingCode(
    trackingCode: string,
    manager?: EntityManager
  ): Promise<Shipment | null> {
    try {
      const repo = manager
        ? manager.getRepository(Shipment)
        : this.shipmentRepository;

      return await repo.findOne({
        where: { trackingCode },
        relations: ["order"],
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ShipmentRepository.findShipmentByTrackingCode",
      });
      throw error;
    }
  }

  /**
   * Update a shipment record
   * @param request UpdateShipmentRepositoryRequest object
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to the updated Shipment entity or null
   */
  async updateShipment(
    request: UpdateShipmentRepositoryRequest,
    manager?: EntityManager
  ): Promise<Shipment | null> {
    try {
      const repo = manager
        ? manager.getRepository(Shipment)
        : this.shipmentRepository;

      const shipment = await repo.findOne({
        where: { id: request.shipmentId },
      });

      if (!shipment) {
        return null;
      }

      if (request.status) {
        shipment.status = request.status;
      }

      if (request.shipmentDate) {
        shipment.shipmentDate = request.shipmentDate;
      }

      if (request.deliveredAt) {
        shipment.deliveredAt = request.deliveredAt;
      }

      if (request.estimatedDelivery) {
        shipment.estimatedDelivery = request.estimatedDelivery;
      }

      if (request.updatedBy) {
        shipment.updatedBy = request.updatedBy;
      }

      shipment.lastUpdate = new Date();

      await repo.save(shipment);

      // Reload with relations
      return await repo.findOne({
        where: { id: request.shipmentId },
        relations: ["order"],
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ShipmentRepository.updateShipment",
      });
      throw error;
    }
  }

  /**
   * Find shipments with optional filtering
   * @param request FindShipmentsRepositoryRequest object with optional filters
   * @param manager Optional EntityManager for transaction support
   * @returns Promise resolving to an array of Shipment entities
   */
  async findShipments(
    request: FindShipmentsRepositoryRequest = {},
    manager?: EntityManager
  ): Promise<{ shipments: Shipment[]; total: number }> {
    try {
      const repo = manager
        ? manager.getRepository(Shipment)
        : this.shipmentRepository;

      const queryBuilder = repo
        .createQueryBuilder("shipment")
        .leftJoinAndSelect("shipment.order", "order");

      // Apply filters
      if (request.orderId) {
        queryBuilder.andWhere("shipment.orderId = :orderId", {
          orderId: request.orderId,
        });
      }

      if (request.customerId) {
        queryBuilder.andWhere("order.customerId = :customerId", {
          customerId: request.customerId,
        });
      }

      if (request.trackingCode) {
        queryBuilder.andWhere("shipment.trackingCode = :trackingCode", {
          trackingCode: request.trackingCode,
        });
      }

      if (request.carrier) {
        queryBuilder.andWhere("shipment.carrier LIKE :carrier", {
          carrier: `%${request.carrier}%`,
        });
      }

      if (request.status) {
        queryBuilder.andWhere("shipment.status = :status", {
          status: request.status,
        });
      }

      // Count total before applying pagination
      const total = await queryBuilder.getCount();

      // Apply pagination
      if (request.offset) {
        queryBuilder.offset(request.offset);
      }

      if (request.limit) {
        queryBuilder.limit(request.limit);
      }

      // Order by created date descending
      queryBuilder.orderBy("shipment.createdAt", "DESC");

      const shipments = await queryBuilder.getMany();

      return { shipments, total };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ShipmentRepository.findShipments",
      });
      throw error;
    }
  }

  /**
   * Generate a unique tracking code
   * @param carrier Carrier name
   * @returns Promise resolving to a unique tracking code
   */
  async generateTrackingCode(carrier: string): Promise<string> {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    const carrierCode = carrier.substring(0, 3).toUpperCase();
    return `${carrierCode}${timestamp}${random}`;
  }
}
