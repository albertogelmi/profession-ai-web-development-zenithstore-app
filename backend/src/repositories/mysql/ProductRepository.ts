import { Repository, EntityManager, In } from "typeorm";
import { AppDataSource } from "../../config/database";
import { ProductMaster } from "../../entities/mysql/ProductMaster";
import { ProductVersion } from "../../entities/mysql/ProductVersion";
import { InventoryQuantity } from "../../entities/mysql/InventoryQuantity";
import { errorEmitter } from "../../utils/errorEmitter";
import { createError } from "../../middleware/errorHandler";
import {
  ProductWithInventory,
  CreateProductRepositoryRequest,
  UpdateProductVersionRepositoryRequest,
  CheckInventoryRepositoryRequest,
  CheckInventoryRepositoryResponse,
  ReserveInventoryRepositoryRequest,
  UpdateInventoryAfterShipmentRepositoryRequest,
} from "../../types/repositories";

export class ProductRepository {
  private productMasterRepo: Repository<ProductMaster>;
  private productVersionRepo: Repository<ProductVersion>;
  private inventoryRepo: Repository<InventoryQuantity>;

  constructor() {
    this.productMasterRepo = AppDataSource.getRepository(ProductMaster);
    this.productVersionRepo = AppDataSource.getRepository(ProductVersion);
    this.inventoryRepo = AppDataSource.getRepository(InventoryQuantity);
  }

  /**
   * Builds a query builder with common joins and relations used by product queries
   * Does not apply SELECT, so callers can choose the desired columns
   */
  private buildBaseProductQueryBuilder(): ReturnType<
    Repository<ProductMaster>["createQueryBuilder"]
  > {
    return this.productMasterRepo
      .createQueryBuilder("pm")
      .leftJoinAndSelect("pm.creator", "creator")
      .leftJoin(
        "product_version",
        "pv",
        "pv.product_master_id = pm.id AND pv.is_current = 1"
      )
      .leftJoinAndSelect("pv.creator", "pv_creator")
      .leftJoinAndSelect("pv.updater", "pv_updater")
      .leftJoinAndSelect("pv.deleter", "pv_deleter")
      .leftJoin("inventory_quantity", "iq", "iq.product_master_id = pm.id");
  }

  /**
   * List of SELECT fields commonly used by queries that return product + version + inventory
   */
  private getCommonSelectFields(): string[] {
    return [
      "pm.id as pm_id",
      "pm.product_code as pm_product_code",
      "pm.created_at as pm_created_at",
      "pm.created_by as pm_created_by",
      "creator.id as pm_creator_id",
      "creator.first_name as pm_creator_first_name",
      "creator.last_name as pm_creator_last_name",
      "pv.id as pv_id",
      "pv.product_master_id as pv_product_master_id",
      "pv.name as pv_name",
      "pv.description as pv_description",
      "pv.price as pv_price",
      "pv.created_by as pv_created_by",
      "pv.start_date as pv_start_date",
      "pv_creator.id as pv_creator_id",
      "pv_creator.first_name as pv_creator_first_name",
      "pv_creator.last_name as pv_creator_last_name",
      "pv.updated_by as pv_updated_by",
      "pv.last_update as pv_last_update",
      "pv_updater.id as pv_updater_id",
      "pv_updater.first_name as pv_updater_first_name",
      "pv_updater.last_name as pv_updater_last_name",
      "pv.is_active as pv_is_active",
      "pv.deleted_by as pv_deleted_by",
      "pv.end_date as pv_end_date",
      "pv_deleter.id as pv_deleter_id",
      "pv_deleter.first_name as pv_deleter_first_name",
      "pv_deleter.last_name as pv_deleter_last_name",
      "pv.is_current as pv_is_current",
      "iq.product_master_id as iq_product_master_id",
      "iq.available_quantity as iq_available_quantity",
      "iq.reserved_quantity as iq_reserved_quantity",
      "iq.safety_stock as iq_safety_stock",
      "iq.updated_by_user as iq_updated_by_user",
      "iq.updated_by_order as iq_updated_by_order",
      "iq.last_update as iq_last_update",
    ];
  }

  /**
   * Map a raw row from query result to structured ProductWithInventory DTO
   */
  private mapRawRowToProductWithInventory(row: any): ProductWithInventory {
    return {
      productMaster: {
        id: row.pm_id,
        productCode: row.pm_product_code,
        createdAt: row.pm_created_at,
        createdBy: row.pm_created_by,
        creator: row.pm_creator_id
          ? {
              id: row.pm_creator_id,
              firstName: row.pm_creator_first_name,
              lastName: row.pm_creator_last_name,
            }
          : undefined,
      } as ProductMaster,
      currentVersion: row.pv_id
        ? ({
            id: row.pv_id,
            productMasterId: row.pv_product_master_id,
            name: row.pv_name,
            description: row.pv_description,
            price: parseFloat(row.pv_price),
            createdBy: row.pv_created_by,
            startDate: row.pv_start_date,
            updatedBy: row.pv_updated_by,
            lastUpdate: row.pv_last_update,
            isActive: Boolean(row.pv_is_active),
            deletedBy: row.pv_deleted_by,
            endDate: row.pv_end_date,
            isCurrent: Boolean(row.pv_is_current),
            creator: row.pv_creator_id
              ? {
                  id: row.pv_creator_id,
                  firstName: row.pv_creator_first_name,
                  lastName: row.pv_creator_last_name,
                }
              : undefined,
            updater: row.pv_updater_id
              ? {
                  id: row.pv_updater_id,
                  firstName: row.pv_updater_first_name,
                  lastName: row.pv_updater_last_name,
                }
              : undefined,
            deleter: row.pv_deleter_id
              ? {
                  id: row.pv_deleter_id,
                  firstName: row.pv_deleter_first_name,
                  lastName: row.pv_deleter_last_name,
                }
              : undefined,
          } as ProductVersion)
        : null,
      inventory: row.iq_product_master_id
        ? ({
            productMasterId: row.iq_product_master_id,
            availableQuantity: row.iq_available_quantity,
            reservedQuantity: row.iq_reserved_quantity,
            safetyStock: row.iq_safety_stock,
            updatedByUser: row.iq_updated_by_user,
            updatedByOrder: row.iq_updated_by_order,
            lastUpdate: row.iq_last_update,
          } as InventoryQuantity)
        : null,
    };
  }

  /**
   * Find all active products with current version and inventory quantity
   */
  async findAllActiveWithInventory(): Promise<ProductWithInventory[]> {
    try {
      const queryBuilder = this.buildBaseProductQueryBuilder();
      queryBuilder.select(this.getCommonSelectFields());
      const result = await queryBuilder.getRawMany();

      return result.map((row) => this.mapRawRowToProductWithInventory(row));
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.findAllActiveWithInventory",
      });
      throw error;
    }
  }

  /**
   * Find a product by product code with current version and inventory
   */
  async findByProductCodeWithInventory(
    productCode: string
  ): Promise<ProductWithInventory | null> {
    try {
      const productMaster = await this.productMasterRepo.findOne({
        where: { productCode },
        relations: ["creator"],
      });

      if (!productMaster) return null;

      const currentVersion = await this.productVersionRepo.findOne({
        where: {
          productMasterId: productMaster.id,
          isCurrent: true,
        },
        relations: ["creator", "updater", "category"],
      });

      const inventory = await this.inventoryRepo.findOne({
        where: { productMasterId: productMaster.id },
        relations: ["updatedByUserEntity"],
      });

      return {
        productMaster,
        currentVersion,
        inventory,
      };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.findByProductCodeWithInventory",
      });
      throw error;
    }
  }

  /**
   * Verify if a product master with the specified code already exists
   */
  async existsByProductCode(productCode: string): Promise<boolean> {
    try {
      const count = await this.productMasterRepo.count({
        where: { productCode },
      });
      return count > 0;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.existsByProductCode",
      });
      throw error;
    }
  }

  /**
   * Create a new product with initial version and inventory
   */
  async createProduct(
    productData: CreateProductRepositoryRequest
  ): Promise<ProductWithInventory> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create the ProductMaster
      const productMaster = queryRunner.manager.create(ProductMaster, {
        productCode: productData.productCode,
        createdAt: new Date(),
        createdBy: productData.createdBy,
      });
      const savedProductMaster = await queryRunner.manager.save(productMaster);

      // 2. Create the first ProductVersion
      const now = new Date();
      const productVersion = queryRunner.manager.create(ProductVersion, {
        productMasterId: savedProductMaster.id,
        categorySlug: productData.categorySlug,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        createdBy: productData.createdBy,
        startDate: now,
        updatedBy: productData.createdBy,
        lastUpdate: now,
        isActive: true,
      });
      const savedProductVersion = await queryRunner.manager.save(
        productVersion
      );

      // 3. Create InventoryQuantity record if initial quantity is specified
      let savedInventory: InventoryQuantity | null = null;
      if (
        productData.initialQuantity !== undefined ||
        productData.safetyStock !== undefined
      ) {
        const inventory = queryRunner.manager.create(InventoryQuantity, {
          productMasterId: savedProductMaster.id,
          availableQuantity: productData.initialQuantity || 0,
          reservedQuantity: 0,
          safetyStock: productData.safetyStock || 0,
          updatedByUser: productData.createdBy,
          updatedByOrder: null,
          lastUpdate: now,
        });
        savedInventory = await queryRunner.manager.save(inventory);
      }

      await queryRunner.commitTransaction();

      // Reload with relations
      const result = await this.findByProductCodeWithInventory(
        productData.productCode
      );
      return result!;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.createProduct",
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update the current version of a product (create new version)
   */
  async updateProductVersion(
    productCode: string,
    updateData: UpdateProductVersionRepositoryRequest
  ): Promise<ProductWithInventory | null> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find the ProductMaster
      const productMaster = await queryRunner.manager.findOne(ProductMaster, {
        where: { productCode },
      });

      if (!productMaster) return null;

      // 2. Find the current version
      const currentVersion = await queryRunner.manager.findOne(ProductVersion, {
        where: {
          productMasterId: productMaster.id,
          isCurrent: true,
        },
      });

      if (!currentVersion) return null;

      const now = new Date();

      // 3. Deactivate the current version
      await queryRunner.manager.update(ProductVersion, currentVersion.id, {
        isActive: false,
        deletedBy: updateData.updatedBy,
        endDate: now,
        updatedBy: updateData.updatedBy,
        lastUpdate: now,
      });

      // 4. Create new version with updated data
      const newVersion = queryRunner.manager.create(ProductVersion, {
        productMasterId: productMaster.id,
        categorySlug: updateData.categorySlug ?? currentVersion.categorySlug,
        name: updateData.name ?? currentVersion.name,
        description:
          updateData.description !== undefined
            ? updateData.description
            : currentVersion.description,
        price: updateData.price ?? currentVersion.price,
        createdBy: updateData.updatedBy,
        startDate: now,
        updatedBy: updateData.updatedBy,
        lastUpdate: now,
        isActive: true,
      });
      await queryRunner.manager.save(newVersion);

      await queryRunner.commitTransaction();

      // Reload with relations
      const result = await this.findByProductCodeWithInventory(productCode);
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.updateProductVersion",
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update or create the inventory quantity for a product
   */
  async updateInventoryQuantity(
    productCode: string,
    updatedByUser: string,
    availableQuantity?: number,
    safetyStock?: number
  ): Promise<InventoryQuantity | null> {
    try {
      // 1. Find the ProductMaster
      const productMaster = await this.productMasterRepo.findOne({
        where: { productCode },
      });

      if (!productMaster) return null;

      const now = new Date();

      // 2. Check if an inventory record already exists
      const existingInventory = await this.inventoryRepo.findOne({
        where: { productMasterId: productMaster.id },
      });

      if (existingInventory) {
        // Update existing inventory
        await this.inventoryRepo.update(existingInventory.productMasterId, {
          availableQuantity:
            availableQuantity || existingInventory.availableQuantity,
          reservedQuantity: existingInventory.reservedQuantity,
          safetyStock: safetyStock || existingInventory.safetyStock,
          updatedByUser,
          updatedByOrder: null,
          lastUpdate: now,
        });
        return await this.inventoryRepo.findOne({
          where: { productMasterId: productMaster.id },
        });
      } else {
        // Create new inventory record
        const inventory = this.inventoryRepo.create({
          productMasterId: productMaster.id,
          availableQuantity: availableQuantity || 0,
          reservedQuantity: 0,
          safetyStock: safetyStock || 0,
          updatedByUser,
          updatedByOrder: null,
          lastUpdate: now,
        });
        return await this.inventoryRepo.save(inventory);
      }
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.updateInventoryQuantity",
      });
      throw error;
    }
  }

  /**
   * Soft delete of a product (deactivates current version and removes inventory)
   */
  async softDeleteProduct(
    productCode: string,
    deletedBy: string
  ): Promise<boolean> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find the ProductMaster
      const productMaster = await queryRunner.manager.findOne(ProductMaster, {
        where: { productCode },
      });

      if (!productMaster) return false;

      // 2. Find and deactivate the current version
      const currentVersion = await queryRunner.manager.findOne(ProductVersion, {
        where: {
          productMasterId: productMaster.id,
          isCurrent: true,
        },
      });

      if (currentVersion) {
        const now = new Date();
        await queryRunner.manager.update(ProductVersion, currentVersion.id, {
          isActive: false,
          deletedBy,
          endDate: now,
          updatedBy: deletedBy,
          lastUpdate: now,
        });
      }

      // 3. Remove from inventory (if exists)
      await queryRunner.manager.delete(InventoryQuantity, {
        productMasterId: productMaster.id,
      });

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.softDeleteProduct",
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Find ProductMaster by ID
   */
  async findProductMasterById(id: number): Promise<ProductMaster | null> {
    try {
      return await this.productMasterRepo.findOne({
        where: { id },
        relations: ["creator"],
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.findProductMasterById",
      });
      throw error;
    }
  }

  /**
   * Find deleted products (soft delete) by code
   */
  async findDeletedProductByCode(
    productCode: string
  ): Promise<ProductWithInventory | null> {
    try {
      const productMaster = await this.productMasterRepo.findOne({
        where: { productCode },
        relations: ["creator"],
      });

      if (!productMaster) return null;

      // Find the last deleted version (is_active = false)
      const deletedVersion = await this.productVersionRepo.findOne({
        where: {
          productMasterId: productMaster.id,
          isActive: false,
        },
        relations: ["creator", "updater", "deleter"],
        order: { endDate: "DESC" }, // Takes the last deleted version
      });

      return {
        productMaster,
        currentVersion: deletedVersion,
        inventory: null, // Deleted products don't have inventory
      };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.findDeletedProductByCode",
      });
      throw error;
    }
  }

  /**
   * Restore soft-deleted product
   */
  async restoreProduct(
    productCode: string,
    restoredBy: string
  ): Promise<ProductWithInventory | null> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Find the ProductMaster
      const productMaster = await queryRunner.manager.findOne(ProductMaster, {
        where: { productCode },
      });

      if (!productMaster) return null;

      // 2. Verify that there isn't already an active version
      const activeVersion = await queryRunner.manager.findOne(ProductVersion, {
        where: {
          productMasterId: productMaster.id,
          isCurrent: true,
        },
      });

      if (activeVersion) {
        throw createError("Product is already active, cannot restore", 400);
      }

      // 3. Find the last deleted version
      const deletedVersion = await queryRunner.manager.findOne(ProductVersion, {
        where: {
          productMasterId: productMaster.id,
          isActive: false,
        },
        order: { endDate: "DESC" },
      });

      if (!deletedVersion) {
        throw createError("No deleted version found to restore", 404);
      }

      const now = new Date();

      // 4. Create new active version based on the last deleted one
      const restoredVersion = queryRunner.manager.create(ProductVersion, {
        productMasterId: productMaster.id,
        name: deletedVersion.name,
        description: deletedVersion.description,
        price: deletedVersion.price,
        createdBy: restoredBy,
        startDate: now,
        updatedBy: restoredBy,
        lastUpdate: now,
        isActive: true,
      });
      await queryRunner.manager.save(restoredVersion);

      await queryRunner.commitTransaction();

      // Reload with relations
      const result = await this.findByProductCodeWithInventory(productCode);
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.restoreProduct",
      });
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Advanced product search with filters
   */
  async searchProducts(filters: {
    name?: string;
    priceMin?: number;
    priceMax?: number;
    productCode?: string;
    categorySlug?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    limit?: number;
    offset?: number;
  }): Promise<{ products: ProductWithInventory[]; total: number }> {
    try {
      const query = this.buildBaseProductQueryBuilder().where("1 = 1");

      // Filter by product name (partial case-insensitive search)
      if (filters.name) {
        query.andWhere("pv.name LIKE :name", {
          name: `%${filters.name.toLowerCase()}%`,
        });
      }

      // Filter by product code (partial search)
      if (filters.productCode) {
        query.andWhere("pm.product_code LIKE :productCode", {
          productCode: `%${filters.productCode.toUpperCase()}%`,
        });
      }

      // Filter by category slug
      if (filters.categorySlug) {
        query
          .innerJoin("pv.category", "cat")
          .andWhere("cat.slug = :categorySlug", {
            categorySlug: filters.categorySlug,
          });
      }

      // Filter by minimum price
      if (filters.priceMin !== undefined) {
        query.andWhere("pv.price >= :priceMin", { priceMin: filters.priceMin });
      }

      // Filter by maximum price
      if (filters.priceMax !== undefined) {
        query.andWhere("pv.price <= :priceMax", { priceMax: filters.priceMax });
      }

      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'DESC';
      
      const sortMapping: Record<string, string> = {
        'createdAt': 'pm.created_at',
        'price': 'pv.price',
        'name': 'pv.name',
        'productCode': 'pm.product_code'
      };
      
      const sortColumn = sortMapping[sortBy] || 'pm.created_at';
      query.orderBy(sortColumn, sortOrder);

      const total = await query.getCount();

      // Apply pagination
      if (filters.offset) {
        query.offset(filters.offset);
      }
      if (filters.limit) {
        query.limit(filters.limit);
      }

      // Execute query with selection of all necessary fields
      query.select(this.getCommonSelectFields());

      const result = await query.getRawMany();

      const products = result.map((row) =>
        this.mapRawRowToProductWithInventory(row)
      );

      return { products, total };
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.searchProducts",
      });
      throw error;
    }
  }

  // ========== INVENTORY OPERATIONS ==========

  /**
   * Verify inventory availability for multiple products
   * @param requests CheckInventoryRepositoryRequest[] array of inventory check requests
   * @param manager EntityManager optional for managing external transactions
   * @returns CheckInventoryRepositoryResponse[] array of responses with inventory availability
   */
  async checkInventoryAvailability(
    requests: CheckInventoryRepositoryRequest[],
    manager?: EntityManager
  ): Promise<CheckInventoryRepositoryResponse[]> {
    try {
      const productRepo = manager
        ? manager.getRepository(ProductMaster)
        : this.productMasterRepo;
      const inventoryRepo = manager
        ? manager.getRepository(InventoryQuantity)
        : this.inventoryRepo;

      const productCodes = requests.map((req) => req.productCode);
      const products = await productRepo.find({
        where: { productCode: In(productCodes) },
      });

      const productMap = new Map<string, ProductMaster>();
      products.forEach((product) =>
        productMap.set(product.productCode, product)
      );

      // Get inventories by productMasterIds
      const productMasterIds = products.map((p) => p.id);
      const inventories = await inventoryRepo.find({
        where: { productMasterId: In(productMasterIds) },
      });

      const inventoryMap = new Map<number, InventoryQuantity>();
      inventories.forEach((inv) => inventoryMap.set(inv.productMasterId, inv));

      return requests.map((request) => {
        const product = productMap.get(request.productCode);
        if (!product) {
          return {
            productCode: request.productCode,
            availableToSell: 0,
            sufficient: false,
          };
        }

        const inventory = inventoryMap.get(product.id);
        const availableToSell = inventory
          ? inventory.availableQuantity -
            inventory.reservedQuantity -
            inventory.safetyStock
          : 0;
        const sufficient = availableToSell >= request.requestedQuantity;

        return {
          productCode: request.productCode,
          availableToSell,
          sufficient,
        };
      });
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.checkInventoryAvailability",
      });
      throw error;
    }
  }

  /**
   * Reserve inventory for multiple products
   * @param requests ReserveInventoryRepositoryRequest[] array of inventory reservation requests
   * @param manager Optional EntityManager to handle external transactions
   * @returns boolean true if all reservations succeeded, false otherwise
   */
  async reserveInventory(
    requests: ReserveInventoryRepositoryRequest[],
    manager?: EntityManager
  ): Promise<boolean> {
    try {
      const repo = manager
        ? manager.getRepository(InventoryQuantity)
        : this.inventoryRepo;
      const productRepo = manager
        ? manager.getRepository(ProductMaster)
        : this.productMasterRepo;

      // First get all products
      const productCodes = requests.map((req) => req.productCode);
      const products = await productRepo.find({
        where: { productCode: In(productCodes) },
      });

      const productMap = new Map<string, ProductMaster>();
      products.forEach((product) =>
        productMap.set(product.productCode, product)
      );

      // Get all inventories
      const productMasterIds = products.map((p) => p.id);
      const inventories = await repo.find({
        where: { productMasterId: In(productMasterIds) },
      });

      const inventoryMap = new Map<number, InventoryQuantity>();
      inventories.forEach((inv) => inventoryMap.set(inv.productMasterId, inv));

      // Verify all items can be reserved
      for (const request of requests) {
        const product = productMap.get(request.productCode);
        if (!product) {
          return false;
        }

        const inventory = inventoryMap.get(product.id);
        if (!inventory) {
          return false;
        }

        const availableToSell =
          inventory.availableQuantity -
          inventory.reservedQuantity -
          inventory.safetyStock;
        if (availableToSell < request.quantity) {
          return false;
        }
      }

      // Reserve all items
      for (const request of requests) {
        const product = productMap.get(request.productCode)!;
        const inventory = inventoryMap.get(product.id)!;
        inventory.reservedQuantity += request.quantity;
        inventory.updatedByUser = null;
        inventory.updatedByOrder = request.orderId;
        inventory.lastUpdate = new Date();
      }

      await repo.save([...inventoryMap.values()]);
      return true;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.reserveInventory",
      });
      throw error;
    }
  }

  /**
   * Release reserved inventory back to available quantity
   * @param productCode Product code to release inventory for
   * @param quantity Quantity to release from reserved back to available
   * @param manager Optional EntityManager to handle external transactions
   * @returns boolean success status
   */
  async releaseReservedInventory(
    productCode: string,
    orderId: number,
    quantity: number,
    manager?: EntityManager
  ): Promise<boolean> {
    try {
      const inventoryRepo = manager
        ? manager.getRepository(InventoryQuantity)
        : this.inventoryRepo;

      // Find the product master first
      const productMasterRepo = manager
        ? manager.getRepository(ProductMaster)
        : this.productMasterRepo;

      const productMaster = await productMasterRepo.findOne({
        where: { productCode },
      });

      if (!productMaster) {
        throw createError(`Product not found: ${productCode}`, 404);
      }

      // Get current inventory
      const inventory = await inventoryRepo.findOne({
        where: { productMasterId: productMaster.id },
      });

      if (!inventory) {
        throw createError(`Inventory not found for product: ${productCode}`, 404);
      }

      // Check if we have enough reserved quantity to release
      if (inventory.reservedQuantity < quantity) {
        throw createError(
          `Cannot release ${quantity} units: only ${inventory.reservedQuantity} reserved for product ${productCode}`, 400
        );
      }

      // Move quantity from reserved back
      inventory.reservedQuantity -= quantity;
      inventory.updatedByUser = null;
      inventory.updatedByOrder = orderId;
      inventory.lastUpdate = new Date();

      await inventoryRepo.save(inventory);
      return true;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.releaseReservedInventory",
      });
      throw error;
    }
  }

  // ========== PRODUCT OPERATIONS ==========

  /**
   * Get the current version of a product given its code
   * @param productCode Product code to get the current version
   * @param manager Optional EntityManager to handle external transactions
   * @returns ProductVersion | null the current version of the product or null if not found
   */
  async getCurrentVersion(
    productCode: string,
    manager?: EntityManager
  ): Promise<ProductVersion | null> {
    try {
      const productRepo = manager
        ? manager.getRepository(ProductMaster)
        : this.productMasterRepo;
      const versionRepo = manager
        ? manager.getRepository(ProductVersion)
        : this.productVersionRepo;

      const product = await productRepo.findOne({
        where: { productCode },
      });

      if (!product) {
        return null;
      }

      // Get the current version using the isCurrent field
      const currentVersion = await versionRepo.findOne({
        where: {
          productMasterId: product.id,
          isCurrent: true,
        },
      });

      return currentVersion;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.getCurrentVersion",
      });
      throw error;
    }
  }

  /**
   * Update inventory after shipment by decrementing both available_quantity and reserved_quantity
   * @param request UpdateInventoryAfterShipmentRepositoryRequest containing productMasterId and quantity
   * @param manager EntityManager optional for managing external transactions
   * @returns void
   */
  async updateInventoryAfterShipment(
    request: UpdateInventoryAfterShipmentRepositoryRequest,
    manager?: EntityManager
  ): Promise<void> {
    try {
      const repo = manager
        ? manager.getRepository(InventoryQuantity)
        : this.inventoryRepo;

      // Get the inventory for this product
      const inventory = await repo.findOne({
        where: { productMasterId: request.productMasterId },
      });

      if (!inventory) {
        throw createError(
          "Inventory record not found for product with ID " +
            request.productMasterId, 404
        );
      }

      // Verify we have enough reserved quantity to decrement
      if (inventory.reservedQuantity < request.quantity) {
        throw createError(
          "Not enough reserved quantity for product with ID " +
            request.productMasterId, 400
        );
      }

      // Verify we have enough available quantity to decrement
      if (inventory.availableQuantity < request.quantity) {
        throw createError(
          "Not enough available quantity for product with ID " +
            request.productMasterId, 400
        );
      }

      // Update quantities: decrement both available and reserved
      inventory.availableQuantity -= request.quantity;
      inventory.reservedQuantity -= request.quantity;
      inventory.lastUpdate = new Date();

      await repo.save(inventory);
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: "ProductRepository.updateInventoryAfterShipment",
      });
      throw error;
    }
  }
}
