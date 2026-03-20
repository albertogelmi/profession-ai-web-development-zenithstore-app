import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface Question {
  id: number;
  productCode: string;
  customerId: number;
  customerName?: string;
  questionText: string;
  answerText?: string;
  answeredBy?: number;
  answeredByName?: string;
  createdAt: string;
  answeredAt?: string;
}

interface QuestionsResponse {
  questions: Question[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface BackendQuestionsResponse {
  success: boolean;
  message: string;
  data: QuestionsResponse;
}

interface CreateQuestionData {
  questionText: string;
}

/**
 * Fetch questions for a product
 */
async function fetchQuestions(
  productCode: string,
  page: number = 1,
  limit: number = 10
): Promise<QuestionsResponse> {
  const response = await apiClient.get<BackendQuestionsResponse>(
    `/products/${productCode}/questions`,
    {
      params: { page, limit } as any,
    }
  );
  return response.data || { questions: [], total: 0, page: 1, limit: 10, totalPages: 0 };
}

/**
 * Create a new question
 */
async function createQuestion(
  productCode: string,
  data: CreateQuestionData
): Promise<Question> {
  const response = await apiClient.post<{ success: boolean; data: { question: Question } }>(
    `/products/${productCode}/questions`,
    data
  );
  return response.data.question;
}

/**
 * Hook to fetch questions for a product
 */
export function useQuestions(
  productCode: string,
  page: number = 1,
  limit: number = 10
) {
  return useQuery({
    queryKey: ['questions', productCode, page, limit],
    queryFn: () => fetchQuestions(productCode, page, limit),
    enabled: !!productCode,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to create a question
 */
export function useCreateQuestion(productCode: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateQuestionData) => createQuestion(productCode, data),
    onSuccess: () => {
      // Invalidate all question queries for this product
      queryClient.invalidateQueries({ queryKey: ['questions', productCode] });
    },
  });
}
