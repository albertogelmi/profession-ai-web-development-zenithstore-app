import { CategoryRepository } from '../repositories/mysql/CategoryRepository';
import { ProductRepository } from '../repositories/mysql/ProductRepository';
import { Category } from '../entities/mysql/Category';
import { errorEmitter } from '../utils/errorEmitter';
import { createError } from '../middleware/errorHandler';
import {
  CreateCategoryServiceRequest,
  UpdateCategoryServiceRequest,
  DeleteCategoryServiceRequest,
  RestoreCategoryServiceRequest,
  SearchProductsByCategoryServiceRequest,
} from '../types/services';
import { PaginatedResponse } from '../types/api';
import { ProductWithInventory } from '../types/repositories';

/**
 * Service for managing categories
 * Handles business logic for category operations
 */
export class CategoryService {
  private categoryRepository: CategoryRepository;
  private productRepository: ProductRepository;

  constructor() {
    this.categoryRepository = new CategoryRepository();
    this.productRepository = new ProductRepository();
  }

  /**
   * Get all active categories
   * @returns Array of active categories ordered by display_order
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepository.findAllActive();
      return categories;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CategoryService.getAllCategories',
      });
      throw error;
    }
  }

  /**
   * Get a category by its slug
   * @param slug - Category slug
   * @returns Category object or null if not found
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    try {
      if (!slug || slug.trim() === '') {
        throw createError('Category slug is required', 400);
      }

      const category = await this.categoryRepository.findBySlug(slug);
      return category;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CategoryService.getCategoryBySlug',
      });
      throw error;
    }
  }

  /**
   * Get products by category slug with pagination
   * @param request - Search request with category slug, price filters, and pagination
   * @returns Paginated list of products
   */
  async getProductsByCategory(
    request: SearchProductsByCategoryServiceRequest
  ): Promise<PaginatedResponse<ProductWithInventory>> {
    try {
      // Validate category exists
      const category = await this.categoryRepository.findBySlug(
        request.categorySlug
      );
      if (!category) {
        throw createError('Category not found', 404);
      }

      // Search products with category filter
      const searchRequest = {
        categorySlug: request.categorySlug,
        priceMin: request.priceMin,
        priceMax: request.priceMax,
        page: request.page,
        limit: request.limit,
      };

      const result = await this.productRepository.searchProducts(searchRequest);
      
      // Transform to PaginatedResponse
      const page = request.page || 1;
      const limit = request.limit || 20;
      const totalPages = Math.ceil(result.total / limit);
      
      return {
        items: result.products,
        total: result.total,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CategoryService.getProductsByCategory',
      });
      throw error;
    }
  }

  /**
   * Create a new category
   * @param data - Category creation data
   * @returns Created category
   */
  async createCategory(data: CreateCategoryServiceRequest): Promise<Category> {
    try {
      // Validate input
      this.validateCategoryData(data);

      // Check if name already exists
      const existingName = await this.categoryRepository.findByName(data.name);
      if (existingName) {
        throw createError(
          `Category with name '${data.name}' already exists`,
          409
        );
      }

      // Check if slug already exists
      const existingSlug = await this.categoryRepository.findBySlug(data.slug);
      if (existingSlug) {
        throw createError(
          `Category with slug '${data.slug}' already exists`,
          409
        );
      }

      // Check if displayOrder already exists
      if (data.displayOrder !== undefined) {
        const existingOrder = await this.categoryRepository.findByDisplayOrder(
          data.displayOrder
        );
        if (existingOrder) {
          throw createError(
            `Category with display order '${data.displayOrder}' already exists`,
            409
          );
        }
      }

      // Create category
      const createRequest = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        createdBy: data.createdBy,
      };

      const category = await this.categoryRepository.create(createRequest);
      return category;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CategoryService.createCategory',
      });
      throw error;
    }
  }

  /**
   * Update an existing category
   * @param data - Category update data
   * @returns Updated category
   */
  async updateCategory(data: UpdateCategoryServiceRequest): Promise<Category> {
    try {
      // Validate input
      this.validateUpdateCategoryData(data);

      // Check if category exists
      const existingCategory = await this.categoryRepository.findBySlug(data.slug);
      if (!existingCategory) {
        throw createError('Category not found', 404);
      }

      // If name is being changed, check for conflicts
      if (data.name && data.name !== existingCategory.name) {
        const nameExists = await this.categoryRepository.findByName(data.name);
        if (nameExists) {
          throw createError(
            `Category with name '${data.name}' already exists`,
            409
          );
        }
      }

      // If slug is being changed, check for conflicts
      if (data.newSlug && data.newSlug !== existingCategory.slug) {
        const slugExists = await this.categoryRepository.findBySlug(data.newSlug);
        if (slugExists) {
          throw createError(
            `Category with slug '${data.newSlug}' already exists`,
            409
          );
        }
      }

      // If displayOrder is being changed, check for conflicts
      if (
        data.displayOrder !== undefined &&
        data.displayOrder !== existingCategory.displayOrder
      ) {
        const orderExists = await this.categoryRepository.findByDisplayOrder(
          data.displayOrder
        );
        if (orderExists) {
          throw createError(
            `Category with display order '${data.displayOrder}' already exists`,
            409
          );
        }
      }

      // Update category
      const updateRequest = {
        name: data.name,
        slug: data.newSlug,
        description: data.description,
        icon: data.icon,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      };

      const updatedCategory = await this.categoryRepository.update(
        data.slug,
        updateRequest
      );
      return updatedCategory;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CategoryService.updateCategory',
      });
      throw error;
    }
  }

  /**
   * Soft delete a category (set is_active to 0)
   * @param data - Delete request with category slug
   */
  async deleteCategory(data: DeleteCategoryServiceRequest): Promise<void> {
    try {
      // Check if category exists
      const category = await this.categoryRepository.findBySlug(data.slug);
      if (!category) {
        throw createError('Category not found', 404);
      }

      // Soft delete
      await this.categoryRepository.softDelete(data.slug);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CategoryService.deleteCategory',
      });
      throw error;
    }
  }

  /**
   * Restore a soft-deleted category (set is_active to 1)
   * @param data - Restore request with category slug
   */
  async restoreCategory(data: RestoreCategoryServiceRequest): Promise<void> {
    try {
      // Check if category exists
      const category = await this.categoryRepository.findBySlug(data.slug);
      if (!category) {
        throw createError('Category not found', 404);
      }

      // Restore
      await this.categoryRepository.restore(data.slug);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'CategoryService.restoreCategory',
      });
      throw error;
    }
  }

  /**
   * Validate category creation data
   * @param data - Category data to validate
   */
  private validateCategoryData(data: CreateCategoryServiceRequest): void {
    if (!data.name || data.name.trim() === '') {
      throw createError('Category name is required', 400);
    }

    if (data.name.length > 100) {
      throw createError('Category name must be at most 100 characters', 400);
    }

    if (!data.slug || data.slug.trim() === '') {
      throw createError('Category slug is required', 400);
    }

    if (data.slug.length > 100) {
      throw createError('Category slug must be at most 100 characters', 400);
    }

    // Validate slug format (lowercase, alphanumeric and hyphens only)
    const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugPattern.test(data.slug)) {
      throw createError(
        'Category slug must be lowercase alphanumeric with hyphens only',
        400
      );
    }

    if (data.icon && data.icon.length > 50) {
      throw createError('Category icon must be at most 50 characters', 400);
    }

    if (
      data.displayOrder !== undefined &&
      (data.displayOrder <= 0 || !Number.isInteger(data.displayOrder))
    ) {
      throw createError('Display order must be a positive integer', 400);
    }

    if (data.isActive !== undefined && ![0, 1].includes(data.isActive)) {
      throw createError('Is active must be 0 or 1', 400);
    }
  }

  /**
   * Validate category update data
   * @param data - Category update data to validate
   */
  private validateUpdateCategoryData(data: UpdateCategoryServiceRequest): void {
    if (!data.slug || data.slug.trim() === '') {
      throw createError('Category slug is required', 400);
    }

    if (data.name !== undefined) {
      if (data.name.trim() === '') {
        throw createError('Category name cannot be empty', 400);
      }
      if (data.name.length > 100) {
        throw createError('Category name must be at most 100 characters', 400);
      }
    }

    if (data.newSlug !== undefined) {
      if (data.newSlug.trim() === '') {
        throw createError('Category new slug cannot be empty', 400);
      }
      if (data.newSlug.length > 100) {
        throw createError('Category new slug must be at most 100 characters', 400);
      }

      // Validate slug format
      const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugPattern.test(data.newSlug)) {
        throw createError(
          'Category new slug must be lowercase alphanumeric with hyphens only',
          400
        );
      }
    }

    if (data.icon !== undefined && data.icon.length > 50) {
      throw createError('Category icon must be at most 50 characters', 400);
    }

    if (
      data.displayOrder !== undefined &&
      (data.displayOrder < 0 || !Number.isInteger(data.displayOrder))
    ) {
      throw createError('Display order must be a non-negative integer', 400);
    }

    if (data.isActive !== undefined && ![0, 1].includes(data.isActive)) {
      throw createError('Is active must be 0 or 1', 400);
    }
  }
}
