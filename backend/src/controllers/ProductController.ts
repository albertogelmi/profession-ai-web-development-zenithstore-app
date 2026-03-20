import { Response } from 'express';
import { ProductService } from '../services/ProductService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  GetAllProductsRequest,
  GetAllProductsResponse,
  GetProductRequest,
  GetProductResponse,
  CreateProductRequest,
  CreateProductRequestBody,
  CreateProductResponse,
  UpdateProductRequest,
  UpdateProductRequestBody,
  UpdateProductResponse,
  UpdateInventoryRequest,
  UpdateInventoryRequestBody,
  UpdateInventoryResponse,
  DeleteProductRequest,
  DeleteProductResponse,
  RestoreProductRequest,
  RestoreProductResponse,
  RestoreProductResponseData,
  SearchProductsRequest,
  SearchProductsQuery,
  SearchProductsResponse,
  createApiResponse,
  UpdateInventoryResponseData
} from '../types/api';
import {
  CreateProductServiceRequest,
  DeleteProductServiceRequest,
  RestoreProductServiceRequest,
  SearchProductsServiceRequest,
  UpdateInventoryServiceRequest,
  UpdateProductServiceRequest
} from '../types/services';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * GET /api/products
   * List all active products with available quantity
   */
  getAllProducts = asyncHandler(async (req: GetAllProductsRequest, res: Response<GetAllProductsResponse>): Promise<void> => {
    const products = await this.productService.getAllActiveProducts();

    res.status(200).json(createApiResponse(
      true,
      'Products retrieved successfully',
      products
    ));
  });

  /**
   * GET /api/products/:productCode
   * Inquiry for specific product with available quantity
   */
  getProductByCode = asyncHandler(async (req: GetProductRequest, res: Response<GetProductResponse>): Promise<void> => {
    const productCode: string = req.params.productCode;

    if (!productCode) {
      throw createError('Product code is required', 400);
    }

    const product = await this.productService.getProductByCode(productCode.toUpperCase());

    if (!product) {
      throw createError('Product not found', 404);
    }

    res.status(200).json(createApiResponse(
      true,
      'Product retrieved successfully',
      product
    ));
  });

  /**
   * POST /api/products
   * Register new product
   */
  createProduct = asyncHandler(async (req: CreateProductRequest, res: Response<CreateProductResponse>): Promise<void> => {
    const createProductRequest: CreateProductRequestBody = req.body;

    // Extract userId from JWT (added by auth middleware)
    const createdBy = req.user?.userId;
    if (!createdBy) {
      throw createError('User authentication required', 401);
    }

    const createProductServiceRequest: CreateProductServiceRequest = {
      productCode: createProductRequest.productCode,
      name: createProductRequest.name,
      description: createProductRequest.description,
      price: createProductRequest.price,
      categorySlug: createProductRequest.categorySlug,
      initialQuantity: createProductRequest.initialQuantity,
      safetyStock: createProductRequest.safetyStock,
      createdBy
    };

    const product = await this.productService.createProduct(createProductServiceRequest);

    res.status(201).json(createApiResponse(
      true,
      'Product created successfully',
      product
    ));
  });

  /**
   * PATCH /api/products/:productCode
   * Update product (product_version: name, description, price)
   */
  updateProduct = asyncHandler(async (req: UpdateProductRequest, res: Response<UpdateProductResponse>): Promise<void> => {
    const productCode: string = req.params.productCode;
    const updateProductRequest: UpdateProductRequestBody = req.body;

    if (!productCode) {
      throw createError('Product code is required', 400);
    }

    // Extract userId from JWT (added by auth middleware)
    const updatedBy = req.user?.userId;
    if (!updatedBy) {
      throw createError('User authentication required', 401);
    }

    const updateProductServiceRequest: UpdateProductServiceRequest = {
      productCode: productCode.toUpperCase(),
      name: updateProductRequest.name,
      description: updateProductRequest.description,
      price: updateProductRequest.price,
      categorySlug: updateProductRequest.categorySlug,
      updatedBy
    };

    const product = await this.productService.updateProduct(updateProductServiceRequest);

    if (!product) {
      throw createError('Product not found', 404);
    }

    res.status(200).json(createApiResponse(
      true,
      'Product updated successfully',
      product
    ));
  });

  /**
   * PATCH /api/products/:productCode/inventory
   * Register/update product available quantity
   */
  updateInventoryQuantity = asyncHandler(async (req: UpdateInventoryRequest, res: Response<UpdateInventoryResponse>): Promise<void> => {
    const productCode: string = req.params.productCode;
    const updateInventoryRequest: UpdateInventoryRequestBody = req.body;

    if (!productCode) {
      throw createError('Product code is required', 400);
    }

    if ((updateInventoryRequest.availableQuantity === null || updateInventoryRequest.availableQuantity === undefined) &&
        (updateInventoryRequest.safetyStock === null || updateInventoryRequest.safetyStock === undefined)) {
      throw createError('Quantity or safety stock is required', 400);
    }

    // Extract userId from JWT (added by auth middleware)
    const updatedBy = req.user?.userId;
    if (!updatedBy) {
      throw createError('User authentication required', 401);
    }

    // Retrieve current quantity before update
    const currentProduct = await this.productService.getProductByCode(productCode.toUpperCase());
    const previousAvailableQuantity = currentProduct?.availableQuantity || 0;
    const previousSafetyStock = currentProduct?.safetyStock || 0;

    const updateInventoryServiceRequest: UpdateInventoryServiceRequest = {
      productCode: productCode.toUpperCase(),
      availableQuantity: updateInventoryRequest.availableQuantity,
      safetyStock: updateInventoryRequest.safetyStock,
      updatedBy
    };

    const result = await this.productService.updateInventoryQuantity(updateInventoryServiceRequest);
    
    const updateInventoryResponseData: UpdateInventoryResponseData = {
      productCode: productCode.toUpperCase(),
      previousAvailableQuantity,
      newAvailableQuantity: result.availableQuantity,
      previousSafetyStock,
      newSafetyStock: result.safetyStock,
      updatedBy,
      timestamp: result.lastUpdate
    };

    res.status(200).json(createApiResponse(
      true,
      'Inventory quantity updated successfully',
      updateInventoryResponseData
    ));
  });

  /**
   * DELETE /api/products/:productCode
   * Soft delete product (product_version + available quantity)
   */
  deleteProduct = asyncHandler(async (req: DeleteProductRequest, res: Response<DeleteProductResponse>): Promise<void> => {
    const productCode: string = req.params.productCode;

    if (!productCode) {
      throw createError('Product code is required', 400);
    }

    // Extract userId from JWT (added by auth middleware)
    const deletedBy = req.user?.userId;
    if (!deletedBy) {
      throw createError('User authentication required', 401);
    }

    const deleteProductServiceRequest: DeleteProductServiceRequest = {
      productCode: productCode.toUpperCase(),
      deletedBy
    };

    const success = await this.productService.deleteProduct(deleteProductServiceRequest);

    if (success) {
      res.status(200).json(createApiResponse(
        true,
        'Product deleted successfully'
      ));
    } else {
      throw createError('Failed to delete product', 500);
    }
  });

  /**
   * POST /api/products/:productCode/restore
   * Restore soft-deleted product
   */
  restoreProduct = asyncHandler(async (req: RestoreProductRequest, res: Response<RestoreProductResponse>): Promise<void> => {
    const productCode: string = req.params.productCode;

    if (!productCode) {
      throw createError('Product code is required', 400);
    }

    // Extract userId from JWT (added by auth middleware)
    const restoredBy = req.user?.userId;
    if (!restoredBy) {
      throw createError('User authentication required', 401);
    }

    const restoreProductServiceRequest: RestoreProductServiceRequest = {
      productCode: productCode.toUpperCase(),
      restoredBy
    };

    const product = await this.productService.restoreProduct(restoreProductServiceRequest);

    const restoreProductResponseData: RestoreProductResponseData = {
      productCode: product.productCode
    };

    res.status(200).json(createApiResponse(
      true,
      'Product restored successfully',
      restoreProductResponseData
    ));
  });

  /**
   * GET /api/products/search
   * Advanced product search with filters
   */
  searchProducts = asyncHandler(async (req: SearchProductsRequest, res: Response<SearchProductsResponse>): Promise<void> => {
    const { 
      name, 
      priceMin, 
      priceMax, 
      productCode, 
      categorySlug,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = '1', 
      limit = '50' 
    }: SearchProductsQuery = req.query;

    // Parse and validate pagination parameters
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;

    // Convert query parameters to correct types
    const searchRequest: SearchProductsServiceRequest = {
      name,
      priceMin: priceMin ? parseFloat(String(priceMin)) : undefined,
      priceMax: priceMax ? parseFloat(String(priceMax)) : undefined,
      productCode,
      categorySlug: categorySlug ? String(categorySlug) : undefined,
      sortBy: String(sortBy),
      sortOrder: (String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'),
      page: pageNum,
      limit: Math.min(limitNum, 100) // Max 100
    };

    // Validate numeric parameters
    if (searchRequest.priceMin !== undefined && isNaN(searchRequest.priceMin)) {
      throw createError('priceMin must be a valid number', 400);
    }
    if (searchRequest.priceMax !== undefined && isNaN(searchRequest.priceMax)) {
      throw createError('priceMax must be a valid number', 400);
    }

    const searchProductsResponseData = await this.productService.searchProducts(searchRequest);

    res.status(200).json(createApiResponse(
      true,
      'Products search completed successfully',
      searchProductsResponseData
    ));
  });
}