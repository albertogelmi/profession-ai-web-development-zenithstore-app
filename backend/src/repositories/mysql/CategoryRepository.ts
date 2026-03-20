import { Repository } from 'typeorm';
import { AppDataSource } from '../../config/database';
import { Category } from '../../entities/mysql/Category';
import { errorEmitter } from '../../utils/errorEmitter';
import { createError } from '../../middleware/errorHandler';
import {
  CreateCategoryRepositoryRequest,
  UpdateCategoryRepositoryRequest,
} from '../../types/repositories';

/**
 * Repository for managing Category entities
 * Handles database operations for category management
 */
export class CategoryRepository {
  private categoryRepo: Repository<Category>;

  constructor() {
    this.categoryRepo = AppDataSource.getRepository(Category);
  }

  /**
   * Find all active categories ordered by display_order
   * @returns Array of active categories
   */
  async findAllActive(): Promise<Category[]> {
    try {
      const categories = await this.categoryRepo.find({
        where: { isActive: 1 },
        order: { displayOrder: 'ASC', name: 'ASC' },
      });
      return categories;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CategoryRepository.findAllActive',
      });
      throw createError('Error retrieving active categories', 500);
    }
  }

  /**
   * Find a category by its slug
   * @param slug - Category slug
   * @returns Category or null if not found
   */
  async findBySlug(slug: string): Promise<Category | null> {
    try {
      const category = await this.categoryRepo.findOne({
        where: { slug },
        relations: ['creator'],
      });
      return category;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CategoryRepository.findBySlug',
      });
      throw createError('Error retrieving category by slug', 500);
    }
  }

  /**
   * Find a category by its name
   * @param name - Category name
   * @returns Category or null if not found
   */
  async findByName(name: string): Promise<Category | null> {
    try {
      const category = await this.categoryRepo.findOne({
        where: { name },
      });
      return category;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CategoryRepository.findByName',
      });
      throw createError('Error retrieving category by name', 500);
    }
  }

  /**
   * Find a category by its display order
   * @param displayOrder - Category display order
   * @returns Category or null if not found
   */
  async findByDisplayOrder(displayOrder: number): Promise<Category | null> {
    try {
      const category = await this.categoryRepo.findOne({
        where: { displayOrder },
      });
      return category;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CategoryRepository.findByDisplayOrder',
      });
      throw createError('Error retrieving category by display order', 500);
    }
  }

  /**
   * Create a new category
   * @param data - Category creation data
   * @returns Created category
   */
  async create(data: CreateCategoryRepositoryRequest): Promise<Category> {
    try {
      const category = this.categoryRepo.create({
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        displayOrder: data.displayOrder ?? 999,
        isActive: data.isActive ?? 1,
        createdBy: data.createdBy,
      });

      const savedCategory = await this.categoryRepo.save(category);
      return savedCategory;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CategoryRepository.create',
      });
      throw createError('Error creating category', 500);
    }
  }

  /**
   * Update an existing category
   * @param slug - Category slug
   * @param data - Category update data
   * @returns Updated category
   */
  async update(
    slug: string,
    data: UpdateCategoryRepositoryRequest
  ): Promise<Category> {
    try {
      const category = await this.findBySlug(slug);
      if (!category) {
        throw createError('Category not found', 404);
      }

      // Update only provided fields
      if (data.name !== undefined) category.name = data.name;
      if (data.slug !== undefined) category.slug = data.slug;
      if (data.description !== undefined) category.description = data.description;
      if (data.icon !== undefined) category.icon = data.icon;
      if (data.displayOrder !== undefined) category.displayOrder = data.displayOrder;
      if (data.isActive !== undefined) category.isActive = data.isActive;

      const updatedCategory = await this.categoryRepo.save(category);
      return updatedCategory;
    } catch (error) {
      if ((error as any).statusCode === 404) {
        throw error;
      }
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CategoryRepository.update',
      });
      throw createError('Error updating category', 500);
    }
  }

  /**
   * Soft delete a category (set is_active to 0)
   * @param slug - Category slug
   */
  async softDelete(slug: string): Promise<void> {
    try {
      const category = await this.findBySlug(slug);
      if (!category) {
        throw createError('Category not found', 404);
      }

      category.isActive = 0;
      await this.categoryRepo.save(category);
    } catch (error) {
      if ((error as any).statusCode === 404) {
        throw error;
      }
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CategoryRepository.softDelete',
      });
      throw createError('Error deleting category', 500);
    }
  }

  /**
   * Restore a soft-deleted category (set is_active to 1)
   * @param slug - Category slug
   */
  async restore(slug: string): Promise<void> {
    try {
      const category = await this.findBySlug(slug);
      if (!category) {
        throw createError('Category not found', 404);
      }

      category.isActive = 1;
      await this.categoryRepo.save(category);
    } catch (error) {
      if ((error as any).statusCode === 404) {
        throw error;
      }
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'CategoryRepository.restore',
      });
      throw createError('Error restoring category', 500);
    }
  }
}
