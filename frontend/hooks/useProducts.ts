import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Product {
  code: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryName?: string;
  categorySlug?: string;
  averageRating?: number;
  reviewCount?: number;
  stockQuantity?: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  safetyStock?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVersion {
  id: number;
  productCode: string;
  versionName: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductsSearchParams {
  name?: string;
  categorySlug?: string;
  priceMin?: number;
  priceMax?: number;
  limit?: number;
  page?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ProductDetailResponse {
  product: Product;
  versions?: ProductVersion[];
  inventory?: {
    quantity: number;
    reserved: number;
    available: number;
  };
}

interface BackendProductsResponse {
  success: boolean;
  message: string;
  data: {
    items: Product[];
    total: number;
    page: number;
    totalPages: number;
  };
}

/**
 * Search/filter products
 */
async function searchProducts(params?: ProductsSearchParams): Promise<ProductsResponse> {
  const response = await apiClient.get<BackendProductsResponse>('/products/search', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
  
  // Map backend response to frontend format
  const mappedProducts = (response.data?.items || []).map((item: any) => ({
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
    products: mappedProducts,
    total: response.data?.total || 0,
    page: response.data?.page || 1,
    limit: params?.limit || 10,
    totalPages: response.data?.totalPages || 0,
  };
}

/**
 * Fetch single product by code
 */
async function fetchProductByCode(code: string): Promise<ProductDetailResponse> {
  const response = await apiClient.get<{ success: boolean; data: ProductDetailResponse }>(`/products/${code}`);
  return response.data;
}

/**
 * Hook to search products with filters
 */
export function useProducts(params?: ProductsSearchParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => searchProducts(params),
    staleTime: 60 * 1000, // 1 minute
    enabled: true,
  });
}

/**
 * Hook to fetch single product detail
 */
export function useProductDetail(code: string) {
  return useQuery({
    queryKey: ['product', code],
    queryFn: () => fetchProductByCode(code),
    enabled: !!code,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook for infinite scroll products
 */
export function useInfiniteProducts(params?: Omit<ProductsSearchParams, 'page'>) {
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', params],
    queryFn: ({ pageParam = 1 }) =>
      searchProducts({ ...params, page: pageParam }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch products by category
 */
export function useProductsByCategory(categorySlug: string, params?: ProductsSearchParams) {
  return useQuery({
    queryKey: ['products', 'category', categorySlug, params],
    queryFn: () => searchProducts({ ...params, categorySlug }),
    enabled: !!categorySlug,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch price range from all products
 */
export function usePriceRange(categorySlug?: string, searchQuery?: string) {
  return useQuery({
    queryKey: ['products', 'priceRange', categorySlug, searchQuery],
    queryFn: async () => {
      const response = await searchProducts({ 
        name: searchQuery,
        categorySlug, 
        limit: 1000,
        sortBy: 'price',
        sortOrder: 'ASC'
      });
      
      const prices = response.products.map(p => p.price);
      return {
        min: prices.length > 0 ? Math.floor(Math.min(...prices)) : 0,
        max: prices.length > 0 ? Math.ceil(Math.max(...prices)) : 10000
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
