import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Review {
  id: number;
  productCode: string;
  customerId: number;
  customerName?: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  averageRating: number;
}

interface BackendReviewsResponse {
  success: boolean;
  message: string;
  data: ReviewsResponse;
}

interface CreateReviewData {
  rating: number;
  title: string;
  comment: string;
}

/**
 * Fetch reviews for a product
 */
async function fetchReviews(
  productCode: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'recent' | 'rating_high' | 'rating_low' = 'recent'
): Promise<ReviewsResponse> {
  const sortParams: Record<string, { sortBy: string; sortOrder: string }> = {
    recent: { sortBy: 'createdAt', sortOrder: 'DESC' },
    rating_high: { sortBy: 'rating', sortOrder: 'DESC' },
    rating_low: { sortBy: 'rating', sortOrder: 'ASC' },
  };

  const { sortBy: sort, sortOrder } = sortParams[sortBy];

  const response = await apiClient.get<BackendReviewsResponse>(
    `/products/${productCode}/reviews`,
    {
      params: { page, limit, sortBy: sort, sortOrder } as any,
    }
  );
  return response.data || { reviews: [], total: 0, page: 1, limit: 10, totalPages: 0, averageRating: 0 };
}

/**
 * Create a new review
 */
async function createReview(
  productCode: string,
  data: CreateReviewData
): Promise<Review> {
  const response = await apiClient.post<{ success: boolean; data: { review: Review } }>(
    `/products/${productCode}/reviews`,
    data
  );
  return response.data.review;
}

/**
 * Hook to fetch reviews for a product
 */
export function useReviews(
  productCode: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'recent' | 'rating_high' | 'rating_low' = 'recent'
) {
  return useQuery({
    queryKey: ['reviews', productCode, page, limit, sortBy],
    queryFn: () => fetchReviews(productCode, page, limit, sortBy),
    enabled: !!productCode,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create a review
 */
export function useCreateReview(productCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewData) => createReview(productCode, data),
    onSuccess: () => {
      // Invalidate all review queries for this product
      queryClient.invalidateQueries({ queryKey: ['reviews', productCode] });
      // Also invalidate product detail to update rating
      queryClient.invalidateQueries({ queryKey: ['product', productCode] });
    },
  });
}

/**
 * Hook to check if user has already reviewed a product
 */
export function useHasReviewed(productCode: string) {
  return useQuery({
    queryKey: ['hasReviewed', productCode],
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: { hasReviewed: boolean } }>(
          `/products/${productCode}/reviews/check`
        );
        return response.data.hasReviewed;
      } catch (error) {
        return false;
      }
    },
    enabled: !!productCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
