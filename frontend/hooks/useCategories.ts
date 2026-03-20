import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface CategoriesResponse {
  categories: Category[];
  total: number;
}

interface BackendResponse {
  success: boolean;
  message: string;
  data: CategoriesResponse;
}

/**
 * Fetch all active categories
 */
async function fetchCategories(): Promise<Category[]> {
  const response = await apiClient.get<BackendResponse>('/categories');
  return response.data?.categories || [];
}

/**
 * Fetch single category by slug
 */
async function fetchCategoryBySlug(slug: string): Promise<Category> {
  const response = await apiClient.get<{ success: boolean; data: { category: Category } }>(`/categories/${slug}`);
  return response.data.category;
}

/**
 * Hook to fetch all categories
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  });
}

/**
 * Hook to fetch single category by slug
 */
export function useCategory(slug: string) {
  return useQuery({
    queryKey: ['category', slug],
    queryFn: () => fetchCategoryBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
