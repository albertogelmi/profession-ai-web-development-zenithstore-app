import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import type { Product } from './useProducts';

interface SearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SearchSuggestionsResponse {
  suggestions: Product[];
}

interface BackendProductsResponse {
  success: boolean;
  message: string;
  data: {
    items: any[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export function useSearchSuggestions(query: string) {
  return useQuery<SearchSuggestionsResponse>({
    queryKey: ['search-suggestions', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { suggestions: [] };
      }

      const response = await apiClient.get<BackendProductsResponse>('/products/search', {
        params: { name: query, limit: 5 },
      });

      const items = response.data?.items || [];
      const suggestions = items.map((item: any) => ({
        code: item.productCode || item.code,
        name: item.name,
        description: item.description,
        price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0)),
        imageUrl: item.imageUrl,
        categoryName: item.categoryName,
        categorySlug: item.categorySlug,
        averageRating: item.averageRating,
        reviewCount: item.reviewCount,
        availableQuantity: item.availableQuantity,
        stockQuantity: item.stockQuantity,
        reservedQuantity: item.reservedQuantity,
        safetyStock: item.safetyStock,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.lastUpdate || item.updatedAt,
      }));
      return { suggestions };
    },
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useSearch(query: string, page: number = 1, filters?: any) {
  return useQuery<SearchResponse>({
    queryKey: ['search', query, page, filters],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { products: [], total: 0, page: 1, limit: 12, totalPages: 0 };
      }

      // Parse sortBy (e.g., "price_asc" -> { sortBy: 'price', sortOrder: 'ASC' })
      let sortBy = 'createdAt';
      let sortOrder = 'DESC';
      if (filters?.sortBy) {
        const parts = filters.sortBy.split('_');
        sortBy = parts[0];
        sortOrder = (parts[1]?.toUpperCase() || 'DESC');
      }

      // Map frontend params to backend params
      const backendParams = {
        name: query,
        page,
        limit: 12,
        categorySlug: filters?.categorySlug,
        priceMin: filters?.priceMin,
        priceMax: filters?.priceMax,
        sortBy,
        sortOrder,
      };

      const response = await apiClient.get<BackendProductsResponse>('/products/search', {
        params: backendParams,
      });

      const items = response.data?.items || [];
      const products = items.map((item: any) => ({
        code: item.productCode || item.code,
        name: item.name,
        description: item.description,
        price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price || 0)),
        imageUrl: item.imageUrl,
        categoryName: item.categoryName,
        categorySlug: item.categorySlug,
        averageRating: item.averageRating,
        reviewCount: item.reviewCount,
        availableQuantity: item.availableQuantity,
        stockQuantity: item.stockQuantity,
        reservedQuantity: item.reservedQuantity,
        safetyStock: item.safetyStock,
        isActive: item.isActive,
        createdAt: item.createdAt,
        updatedAt: item.lastUpdate || item.updatedAt,
      }));
      return {
        products,
        total: response.data?.total || 0,
        page: response.data?.page || 1,
        limit: 12,
        totalPages: response.data?.totalPages || 0,
      };
    },
    enabled: query.trim().length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}
