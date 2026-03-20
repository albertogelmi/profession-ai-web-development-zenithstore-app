import { Response } from 'express';
import { CategoryService } from '../services/CategoryService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  GetAllCategoriesRequest,
  GetAllCategoriesResponse,
  GetCategoryBySlugRequest,
  GetCategoryBySlugResponse,
  GetProductsByCategoryRequest,
  GetProductsByCategoryResponse,
  CreateCategoryRequest,
  CreateCategoryResponse,
  UpdateCategoryRequest,
  UpdateCategoryResponse,
  DeleteCategoryRequest,
  DeleteCategoryResponse,
  RestoreCategoryRequest,
  RestoreCategoryResponse,
  createApiResponse,
} from '../types/api';
import {
  CreateCategoryServiceRequest,
  UpdateCategoryServiceRequest,
  DeleteCategoryServiceRequest,
  RestoreCategoryServiceRequest,
  SearchProductsByCategoryServiceRequest,
} from '../types/services';

/**
 * Controller for category-related operations
 * Handles HTTP requests for category management
 */
export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  /**
   * GET /api/categories
   * List all active categories ordered by display_order
   */
  getAllCategories = asyncHandler(
    async (
      req: GetAllCategoriesRequest,
      res: Response<GetAllCategoriesResponse>
    ): Promise<void> => {
      const categories = await this.categoryService.getAllCategories();

      const categoriesData = categories.map((cat) => ({
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
      }));

      res.status(200).json(
        createApiResponse(true, 'Categories retrieved successfully', {
          categories: categoriesData,
          count: categories.length,
        })
      );
    }
  );

  /**
   * GET /api/categories/:slug
   * Get category details by slug
   */
  getCategoryBySlug = asyncHandler(
    async (
      req: GetCategoryBySlugRequest,
      res: Response<GetCategoryBySlugResponse>
    ): Promise<void> => {
      const { slug } = req.params;

      if (!slug) {
        throw createError('Category slug is required', 400);
      }

      const category = await this.categoryService.getCategoryBySlug(slug);

      if (!category) {
        throw createError('Category not found', 404);
      }

      res.status(200).json(
        createApiResponse(true, 'Category retrieved successfully', {
          category: {
            slug: category.slug,
            name: category.name,
            description: category.description,
            icon: category.icon,
            displayOrder: category.displayOrder,
            isActive: category.isActive,
            createdAt: category.createdAt,
            createdBy: category.createdBy,
          },
        })
      );
    }
  );

  /**
   * GET /api/categories/:slug/products
   * Get products by category slug with pagination and filters
   */
  getProductsByCategory = asyncHandler(
    async (
      req: GetProductsByCategoryRequest,
      res: Response<GetProductsByCategoryResponse>
    ): Promise<void> => {
      const { slug } = req.params;
      const { page = '1', limit = '20', priceMin, priceMax } = req.query;

      if (!slug) {
        throw createError('Category slug is required', 400);
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw createError(
          'Invalid pagination parameters (page >= 1, limit 1-100)',
          400
        );
      }

      const serviceRequest: SearchProductsByCategoryServiceRequest = {
        categorySlug: slug,
        page: pageNum,
        limit: limitNum,
        priceMin: priceMin ? parseFloat(priceMin) : undefined,
        priceMax: priceMax ? parseFloat(priceMax) : undefined,
      };

      const result = await this.categoryService.getProductsByCategory(
        serviceRequest
      );

      res.status(200).json(
        createApiResponse(true, 'Products retrieved successfully', result)
      );
    }
  );

  /**
   * POST /api/categories
   * Create a new category (admin only)
   */
  createCategory = asyncHandler(
    async (
      req: CreateCategoryRequest,
      res: Response<CreateCategoryResponse>
    ): Promise<void> => {
      const createdBy = req.user?.userId;
      if (!createdBy) {
        throw createError('User authentication required', 401);
      }

      const serviceRequest: CreateCategoryServiceRequest = {
        name: req.body.name,
        slug: req.body.slug,
        description: req.body.description,
        icon: req.body.icon,
        displayOrder: req.body.displayOrder,
        isActive: req.body.isActive,
        createdBy,
      };

      const category = await this.categoryService.createCategory(serviceRequest);

      res.status(201).json(
        createApiResponse(true, 'Category created successfully', {
          category: {
            slug: category.slug,
            name: category.name,
            description: category.description,
            icon: category.icon,
            displayOrder: category.displayOrder,
            isActive: category.isActive,
            createdAt: category.createdAt,
            createdBy: category.createdBy,
          },
        })
      );
    }
  );

  /**
   * PATCH /api/categories/:id
   * Update an existing category (admin only)
   */
  updateCategory = asyncHandler(
    async (
      req: UpdateCategoryRequest,
      res: Response<UpdateCategoryResponse>
    ): Promise<void> => {
      const userId = req.user?.userId;
      if (!userId) {
        throw createError('User authentication required', 401);
      }

      const categorySlug = req.params.slug;
      if (!categorySlug) {
        throw createError('Category slug is required', 400);
      }

      const serviceRequest: UpdateCategoryServiceRequest = {
        slug: categorySlug,
        name: req.body.name,
        newSlug: req.body.slug,
        description: req.body.description,
        icon: req.body.icon,
        displayOrder: req.body.displayOrder,
        isActive: req.body.isActive,
      };

      const category = await this.categoryService.updateCategory(serviceRequest);

      res.status(200).json(
        createApiResponse(true, 'Category updated successfully', {
          category: {
            slug: category.slug,
            name: category.name,
            description: category.description,
            icon: category.icon,
            displayOrder: category.displayOrder,
            isActive: category.isActive,
            createdAt: category.createdAt,
            createdBy: category.createdBy,
          },
        })
      );
    }
  );

  /**
   * DELETE /api/categories/:id
   * Soft delete a category (set is_active to 0) (admin only)
   */
  deleteCategory = asyncHandler(
    async (
      req: DeleteCategoryRequest,
      res: Response<DeleteCategoryResponse>
    ): Promise<void> => {
      const deletedBy = req.user?.userId;
      if (!deletedBy) {
        throw createError('User authentication required', 401);
      }

      const categorySlug = req.params.slug;
      if (!categorySlug) {
        throw createError('Category slug is required', 400);
      }

      const serviceRequest: DeleteCategoryServiceRequest = {
        slug: categorySlug,
        deletedBy,
      };

      await this.categoryService.deleteCategory(serviceRequest);

      res.status(200).json(
        createApiResponse(true, 'Category deleted successfully', {})
      );
    }
  );

  /**
   * POST /api/categories/:id/restore
   * Restore a soft-deleted category (set is_active to 1) (admin only)
   */
  restoreCategory = asyncHandler(
    async (
      req: RestoreCategoryRequest,
      res: Response<RestoreCategoryResponse>
    ): Promise<void> => {
      const restoredBy = req.user?.userId;
      if (!restoredBy) {
        throw createError('User authentication required', 401);
      }

      const categorySlug = req.params.slug;
      if (!categorySlug) {
        throw createError('Category slug is required', 400);
      }

      const serviceRequest: RestoreCategoryServiceRequest = {
        slug: categorySlug,
        restoredBy,
      };

      await this.categoryService.restoreCategory(serviceRequest);

      res.status(200).json(
        createApiResponse(true, 'Category restored successfully', {})
      );
    }
  );
}
