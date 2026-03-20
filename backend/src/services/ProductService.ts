import { ProductRepository } from '../repositories/mysql/ProductRepository';
import { CategoryRepository } from '../repositories/mysql/CategoryRepository';
import { createError } from '../middleware/errorHandler';
import { errorEmitter } from '../utils/errorEmitter';
import {
  GetAllProductsResponseData,
  ProductDetailResponseData,
  SearchProductsResponseData
} from '../types/api';
import {
  CreateProductServiceRequest,
  UpdateProductServiceRequest,
  UpdateInventoryServiceRequest,
  UpdateInventoryServiceResponse,
  DeleteProductServiceRequest,
  RestoreProductServiceRequest,
  SearchProductsServiceRequest
} from '../types/services';

export class ProductService {
  private productRepository: ProductRepository;
  private categoryRepository: CategoryRepository;

  constructor() {
    this.productRepository = new ProductRepository();
    this.categoryRepository = new CategoryRepository();
  }

  /**
   * List all active products with available quantity
   */
  async getAllActiveProducts(): Promise<GetAllProductsResponseData> {
    try {
      const productsWithInventory = await this.productRepository.findAllActiveWithInventory();

      const products = productsWithInventory
        .filter(p => p.currentVersion) // Only products with current version
        .map(p => ({
          productCode: p.productMaster.productCode,
          name: p.currentVersion!.name,
          description: p.currentVersion!.description,
          price: p.currentVersion!.price,
          availableQuantity: p.inventory?.availableQuantity || 0,
          reservedQuantity: p.inventory?.reservedQuantity || 0,
          safetyStock: p.inventory?.safetyStock || 0,
          createdBy: p.productMaster.createdBy || 'system',
          createdAt: p.productMaster.createdAt,
          updatedBy: p.currentVersion!.updatedBy || 'system',
          lastUpdate: p.currentVersion!.lastUpdate,
          isActive: p.currentVersion!.isActive
        }));

      return {
        products,
        count: products.length
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductService.getAllActiveProducts',
      });
      throw error;
    }
  }

  /**
   * Find a specific product by code with available quantity
   */
  async getProductByCode(productCode: string): Promise<ProductDetailResponseData | null> {
    try {
      const productWithInventory = await this.productRepository.findByProductCodeWithInventory(productCode);

      if (!productWithInventory || !productWithInventory.currentVersion) {
        return null;
      }

      const { productMaster, currentVersion, inventory } = productWithInventory;

      return {
        productCode: productMaster.productCode,
        name: currentVersion.name,
        description: currentVersion.description,
        price: currentVersion.price,
        availableQuantity: inventory?.availableQuantity || 0,
        reservedQuantity: inventory?.reservedQuantity || 0,
        safetyStock: inventory?.safetyStock || 0,
        categoryName: currentVersion.category?.name,
        categorySlug: currentVersion.category?.slug,
        createdBy: productMaster.createdBy || 'system',
        createdAt: productMaster.createdAt,
        updatedBy: currentVersion.updatedBy || 'system',
        lastUpdate: currentVersion.lastUpdate,
        isActive: currentVersion.isActive
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductService.getProductByCode',
      });
      throw error;
    }
  }

  /**
   * Register new product
   */
  async createProduct(productData: CreateProductServiceRequest): Promise<ProductDetailResponseData> {
    try {
      // Input validation
      this.validateProductData(productData);

      // Verify that the product code doesn't already exist
      const exists = await this.productRepository.existsByProductCode(productData.productCode);
      if (exists) {
        throw createError(`Product with code '${productData.productCode}' already exists`, 409);
      }

      // Verify category exists
      const category = await this.categoryRepository.findBySlug(productData.categorySlug);
      if (!category) {
        throw createError(`Category with slug '${productData.categorySlug}' not found`, 404);
      }

      // Create the product
      const createRequest = {
        productCode: productData.productCode,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        categorySlug: productData.categorySlug,
        initialQuantity: productData.initialQuantity,
        safetyStock: productData.safetyStock,
        createdBy: productData.createdBy
      };

      const productWithInventory = await this.productRepository.createProduct(createRequest);

      if (!productWithInventory.currentVersion) {
        throw createError('Failed to create product version', 500);
      }

      return {
        productCode: productWithInventory.productMaster.productCode,
        name: productWithInventory.currentVersion.name,
        description: productWithInventory.currentVersion.description,
        price: productWithInventory.currentVersion.price,
        availableQuantity: productWithInventory.inventory?.availableQuantity || 0,
        reservedQuantity: productWithInventory.inventory?.reservedQuantity || 0,
        safetyStock: productWithInventory.inventory?.safetyStock || 0,
        createdBy: productWithInventory.productMaster.createdBy || 'system',
        createdAt: productWithInventory.productMaster.createdAt,
        updatedBy: productWithInventory.currentVersion.updatedBy || 'system',
        lastUpdate: productWithInventory.currentVersion.lastUpdate,
        isActive: productWithInventory.currentVersion.isActive
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductService.createProduct'
      });
      throw error;
    }
  }

  /**
   * Update product (create new version)
   */
  async updateProduct(updateData: UpdateProductServiceRequest): Promise<ProductDetailResponseData | null> {
    try {
      // Input validation
      this.validateUpdateProductData(updateData);

      // Verify that the product exists
      const existingProduct = await this.productRepository.findByProductCodeWithInventory(updateData.productCode);
      if (!existingProduct || !existingProduct.currentVersion) {
        throw createError('Product not found', 404);
      }

      // Verify category exists if provided
      if (updateData.categorySlug) {
        const category = await this.categoryRepository.findBySlug(updateData.categorySlug);
        if (!category) {
          throw createError(`Category with slug '${updateData.categorySlug}' not found`, 404);
        }
      }

      // Update the product (create new version)
      const updateRequest = {
        name: updateData.name,
        description: updateData.description,
        price: updateData.price,
        categorySlug: updateData.categorySlug,
        updatedBy: updateData.updatedBy
      };

      const updatedProduct = await this.productRepository.updateProductVersion(updateData.productCode, updateRequest);

      if (!updatedProduct || !updatedProduct.currentVersion) {
        throw createError('Failed to update product', 500);
      }

      return {
        productCode: updatedProduct.productMaster.productCode,
        name: updatedProduct.currentVersion.name,
        description: updatedProduct.currentVersion.description,
        price: updatedProduct.currentVersion.price,
        availableQuantity: updatedProduct.inventory?.availableQuantity || 0,
        reservedQuantity: updatedProduct.inventory?.reservedQuantity || 0,
        safetyStock: updatedProduct.inventory?.safetyStock || 0,
        createdBy: updatedProduct.productMaster.createdBy || 'system',
        createdAt: updatedProduct.productMaster.createdAt,
        updatedBy: updatedProduct.currentVersion.updatedBy || 'system',
        lastUpdate: updatedProduct.currentVersion.lastUpdate,
        isActive: updatedProduct.currentVersion.isActive
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductService.updateProduct'
      });
      throw error;
    }
  }

  /**
   * Register/update product available quantity
   */
  async updateInventoryQuantity(updateData: UpdateInventoryServiceRequest): Promise<UpdateInventoryServiceResponse> {
    try {
      // Input validation
      this.validateInventoryData(updateData);

      // Verify that the product exists
      const existingProduct = await this.productRepository.findByProductCodeWithInventory(updateData.productCode);
      if (!existingProduct || !existingProduct.currentVersion) {
        throw createError('Product not found', 404);
      }

      if (updateData.availableQuantity && updateData.availableQuantity - (existingProduct.inventory?.reservedQuantity || 0) < 0) {
        throw createError('Available quantity cannot be less than reserved quantity', 400);
      }

      // Update the quantity
      const updatedInventory = await this.productRepository.updateInventoryQuantity(
        updateData.productCode, 
        updateData.updatedBy, 
        updateData.availableQuantity,
        updateData.safetyStock,
      );

      if (!updatedInventory) {
        throw createError('Failed to update inventory quantity', 500);
      }

      return {
        availableQuantity: updatedInventory.availableQuantity,
        safetyStock: updatedInventory.safetyStock,
        lastUpdate: updatedInventory.lastUpdate
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductService.updateInventoryQuantity'
      });
      throw error;
    }
  }

  /**
   * Soft delete product
   */
  async deleteProduct(deleteData: DeleteProductServiceRequest): Promise<boolean> {
    try {
      // Verify that the product exists
      const existingProduct = await this.productRepository.findByProductCodeWithInventory(deleteData.productCode);
      if (!existingProduct || !existingProduct.currentVersion) {
        throw createError('Product not found', 404);
      }

      // TODO: Add business rules checks (e.g. open orders)

      const success = await this.productRepository.softDeleteProduct(deleteData.productCode, deleteData.deletedBy);

      if (!success) {
        throw createError('Failed to delete product', 500);
      }

      return true;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductService.deleteProduct'
      });
      throw error;
    }
  }

  /**
   * Product data validation for creation
   */
  private validateProductData(productData: CreateProductServiceRequest): void {
    if (!productData.productCode || productData.productCode.trim().length === 0) {
      throw createError('Product code is required', 400);
    }

    if (productData.productCode.trim().length > 100) {
      throw createError('Product code must be at most 100 characters long', 400);
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(productData.productCode.trim())) {
      throw createError('Product code can only contain letters, numbers, underscores and hyphens', 400);
    }

    if (!productData.name || productData.name.trim().length < 2) {
      throw createError('Product name must be at least 2 characters long', 400);
    }

    if (productData.name.trim().length > 255) {
      throw createError('Product name must be at most 255 characters long', 400);
    }

    if (productData.price === undefined || productData.price < 0) {
      throw createError('Product price must be a positive number', 400);
    }

    if (productData.price > 999999999.99) {
      throw createError('Product price is too high', 400);
    }

    if (!productData.categorySlug || productData.categorySlug.trim().length === 0) {
      throw createError('Category slug is required', 400);
    }

    if (productData.initialQuantity !== undefined && productData.initialQuantity < 0) {
      throw createError('Initial quantity must be a positive number', 400);
    }
    if (productData.initialQuantity !== undefined && !Number.isInteger(productData.initialQuantity)) {
      throw createError('Initial quantity must be an integer', 400);
    }

    if (productData.safetyStock !== undefined && productData.safetyStock < 0) {
      throw createError('Safety stock must be a positive number', 400);
    }
    if (productData.safetyStock !== undefined && !Number.isInteger(productData.safetyStock)) {
      throw createError('Safety stock must be an integer', 400);
    }

    if (!productData.createdBy || productData.createdBy.trim().length === 0) {
      throw createError('Created by is required', 400);
    }

    // Normalize the data
    productData.productCode = productData.productCode.trim().toUpperCase();
    productData.name = productData.name.trim();
    if (productData.description) {
      productData.description = productData.description.trim();
    }
  }

  /**
   * Data validation for product update
   */
  private validateUpdateProductData(updateData: UpdateProductServiceRequest): void {
    if (updateData.name !== undefined) {
      if (!updateData.name || updateData.name.trim().length < 2) {
        throw createError('Product name must be at least 2 characters long', 400);
      }
      if (updateData.name.trim().length > 255) {
        throw createError('Product name must be at most 255 characters long', 400);
      }
      updateData.name = updateData.name.trim();
    }

    if (updateData.description !== undefined && updateData.description !== null) {
      updateData.description = updateData.description.trim();
    }

    if (updateData.price !== undefined) {
      if (updateData.price < 0) {
        throw createError('Product price must be a positive number', 400);
      }
      if (updateData.price > 999999999.99) {
        throw createError('Product price is too high', 400);
      }
    }

    if (!updateData.updatedBy || updateData.updatedBy.trim().length === 0) {
      throw createError('Updated by is required', 400);
    }

    // Verify that at least one field is specified for update
    if (updateData.name === undefined && updateData.description === undefined && updateData.price === undefined) {
      throw createError('At least one field (name, description, price) must be specified for update', 400);
    }
  }

  /**
   * Inventory data validation
   */
  private validateInventoryData(inventoryData: UpdateInventoryServiceRequest): void {
    if (inventoryData.availableQuantity !== null && inventoryData.availableQuantity !== undefined) {
      if (!Number.isInteger(inventoryData.availableQuantity)) {
        throw createError('Available quantity must be an integer', 400);
      }

      if (inventoryData.availableQuantity < 0) {
        throw createError('Available quantity must be a non-negative integer', 400);
      }
    }

    if (inventoryData.safetyStock !== null && inventoryData.safetyStock !== undefined) {
      if (!Number.isInteger(inventoryData.safetyStock)) {
        throw createError('Safety stock must be an integer', 400);
      }

      if (inventoryData.safetyStock < 0) {
        throw createError('Safety stock must be a non-negative integer', 400);
      }
    }

    if (!inventoryData.updatedBy || inventoryData.updatedBy.trim().length === 0) {
      throw createError('Updated by is required', 400);
    }
  }

  /**
   * Restore soft-deleted product
   */
  async restoreProduct(restoreData: RestoreProductServiceRequest): Promise<ProductDetailResponseData> {
    try {
      // Input validation
      if (!restoreData.productCode || restoreData.productCode.trim().length === 0) {
        throw createError('Product code is required', 400);
      }

      if (!restoreData.restoredBy || restoreData.restoredBy.trim().length === 0) {
        throw createError('Restored by is required', 400);
      }

      const normalizedProductCode = restoreData.productCode.trim().toUpperCase();

      // Verify that the product is actually deleted
      const deletedProduct = await this.productRepository.findDeletedProductByCode(normalizedProductCode);
      if (!deletedProduct || !deletedProduct.currentVersion) {
        throw createError('No deleted product found with this code', 404);
      }

      // Verify that there isn't already an active version
      const activeProduct = await this.productRepository.findByProductCodeWithInventory(normalizedProductCode);
      if (activeProduct && activeProduct.currentVersion && activeProduct.currentVersion.isActive) {
        throw createError('Product is already active, cannot restore', 409);
      }

      // Restore the product
      const restoredProduct = await this.productRepository.restoreProduct(normalizedProductCode, restoreData.restoredBy);

      if (!restoredProduct || !restoredProduct.currentVersion) {
        throw createError('Failed to restore product', 500);
      }

      return {
        productCode: restoredProduct.productMaster.productCode,
        name: restoredProduct.currentVersion.name,
        description: restoredProduct.currentVersion.description,
        price: restoredProduct.currentVersion.price,
        availableQuantity: restoredProduct.inventory?.availableQuantity || 0,
        reservedQuantity: restoredProduct.inventory?.reservedQuantity || 0,
        safetyStock: restoredProduct.inventory?.safetyStock || 0,
        createdBy: restoredProduct.productMaster.createdBy || 'system',
        createdAt: restoredProduct.productMaster.createdAt,
        updatedBy: restoredProduct.currentVersion.updatedBy || 'system',
        lastUpdate: restoredProduct.currentVersion.lastUpdate,
        isActive: restoredProduct.currentVersion.isActive
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductService.restoreProduct'
      });
      throw error;
    }
  }

  /**
   * Advanced product search with filters
   */
  async searchProducts(searchParams: SearchProductsServiceRequest): Promise<SearchProductsResponseData> { 
    try {
      // Validate search parameters
      this.validateSearchParams(searchParams);

      // Normalize pagination parameters
      const page = searchParams.page || 1;
      const limit = Math.min(searchParams.limit || 50, 100); // Max 100 results per page
      const offset = (page - 1) * limit;

      // Normalize parameters
      const filters = {
        name: searchParams.name?.trim(),
        priceMin: searchParams.priceMin,
        priceMax: searchParams.priceMax,
        productCode: searchParams.productCode?.trim().toUpperCase(),
        categorySlug: searchParams.categorySlug?.trim(),
        sortBy: searchParams.sortBy || 'createdAt',
        sortOrder: searchParams.sortOrder || 'DESC',
        limit,
        offset
      };

      // Execute search
      const { products: productsWithInventory, total } = await this.productRepository.searchProducts(filters);

      // Map the results
      const products = productsWithInventory
        .filter(p => p.currentVersion) // Only products with current version
        .map(p => ({
          productCode: p.productMaster.productCode,
          name: p.currentVersion!.name,
          description: p.currentVersion!.description,
          price: p.currentVersion!.price,
          availableQuantity: p.inventory?.availableQuantity || 0,
          reservedQuantity: p.inventory?.reservedQuantity || 0,
          safetyStock: p.inventory?.safetyStock || 0,
          createdBy: p.productMaster.createdBy || 'system',
          createdAt: p.productMaster.createdAt,
          updatedBy: p.currentVersion!.updatedBy || 'system',
          lastUpdate: p.currentVersion!.lastUpdate,
          isActive: p.currentVersion!.isActive
        }));

      const totalPages = Math.ceil(total / limit);

      return {
        items: products,
        total,
        page,
        totalPages
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductService.searchProducts'
      });
      throw error;
    }
  }

  /**
   * Search parameters validation
   */
  private validateSearchParams(searchParams: SearchProductsServiceRequest): void {
    if (searchParams.priceMin !== undefined && searchParams.priceMin < 0) {
      throw createError('Minimum price must be non-negative', 400);
    }

    if (searchParams.priceMax !== undefined && searchParams.priceMax < 0) {
      throw createError('Maximum price must be non-negative', 400);
    }

    if (searchParams.priceMin !== undefined && searchParams.priceMax !== undefined) {
      if (searchParams.priceMin > searchParams.priceMax) {
        throw createError('Minimum price cannot be greater than maximum price', 400);
      }
    }

    if (searchParams.limit !== undefined) {
      if (!Number.isInteger(searchParams.limit) || searchParams.limit <= 0) {
        throw createError('Limit must be a positive integer', 400);
      }
      if (searchParams.limit > 100) {
        throw createError('Limit cannot exceed 100', 400);
      }
    }

    if (searchParams.page !== undefined) {
      if (!Number.isInteger(searchParams.page) || searchParams.page < 1) {
        throw createError('Page must be a positive integer', 400);
      }
    }
  }
}