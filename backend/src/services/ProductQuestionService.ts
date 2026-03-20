import { ProductQuestionRepository } from '../repositories/mongodb/ProductQuestionRepository';
import { CustomerRepository } from '../repositories/mysql/CustomerRepository';
import { errorEmitter } from '../utils/errorEmitter';
import { createError } from '../middleware/errorHandler';
import { IProductQuestion } from '../entities/mongodb/ProductQuestion';
import {
  CreateQuestionServiceRequest,
  CreateQuestionServiceResponse,
  GetProductQuestionsServiceRequest,
  AnswerQuestionServiceRequest,
  HideQuestionServiceRequest,
  DeleteQuestionServiceRequest,
  GetPendingQuestionsServiceRequest,
  GetMyQuestionsServiceRequest,
} from '../types/services';

export class ProductQuestionService {
  private questionRepository: ProductQuestionRepository;
  private customerRepository: CustomerRepository;

  constructor() {
    this.questionRepository = new ProductQuestionRepository();
    this.customerRepository = new CustomerRepository();
  }

  /**
   * Create a new product question
   */
  async createQuestion(
    request: CreateQuestionServiceRequest
  ): Promise<CreateQuestionServiceResponse> {
    try {
      const { customerId, productCode, question } = request;

      // Get customer name
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw createError('Customer not found', 404);
      }

      const newQuestion = await this.questionRepository.create({
        customerId,
        customerName: `${customer.firstName} ${customer.lastName}`,
        productCode: productCode.toUpperCase(),
        question: question.trim(),
        status: 'pending',
        helpfulCount: 0,
      });

      return {
        questionId: newQuestion._id.toString(),
        customerId: newQuestion.customerId,
        productCode: newQuestion.productCode,
        question: newQuestion.question,
        status: newQuestion.status,
        createdAt: newQuestion.createdAt,
      };
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductQuestionService.createQuestion',
      });
      throw error;
    }
  }

  /**
   * Get all questions for a product
   */
  async getProductQuestions(
    request: GetProductQuestionsServiceRequest
  ): Promise<IProductQuestion[]> {
    try {
      const { productCode, includeHidden = false } = request;

      return await this.questionRepository.getProductQuestions(
        productCode.toUpperCase(),
        includeHidden
      );
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductQuestionService.getProductQuestions',
      });
      throw error;
    }
  }

  /**
   * Answer a question (admin/staff only)
   * Business rules:
   * - Only authenticated admin users can answer
   * - Answer is attributed to "Staff"
   */
  async answerQuestion(
    request: AnswerQuestionServiceRequest
  ): Promise<IProductQuestion> {
    try {
      const { questionId, answer, userId } = request;

      const question = await this.questionRepository.addAnswer(
        questionId,
        answer.trim(),
        'Staff',
        userId
      );

      if (!question) {
        throw createError('Question not found', 404);
      }

      return question;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductQuestionService.answerQuestion',
      });
      throw error;
    }
  }

  /**
   * Hide a question (moderator action)
   */
  async hideQuestion(
    request: HideQuestionServiceRequest
  ): Promise<IProductQuestion> {
    try {
      const { questionId, moderatorId } = request;

      const question = await this.questionRepository.hideQuestion(questionId);

      if (!question) {
        throw createError('Question not found', 404);
      }

      return question;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductQuestionService.hideQuestion',
      });
      throw error;
    }
  }

  /**
   * Mark a question as helpful (increment counter)
   */
  async markQuestionHelpful(questionId: string): Promise<IProductQuestion> {
    try {
      const question = await this.questionRepository.incrementHelpful(questionId);

      if (!question) {
        throw createError('Question not found', 404);
      }

      return question;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductQuestionService.markQuestionHelpful',
      });
      throw error;
    }
  }

  /**
   * Delete a question
   * Business rules:
   * - Admin (user role) can delete any question
   * - Customer can only delete their own questions
   */
  async deleteQuestion(request: DeleteQuestionServiceRequest): Promise<boolean> {
    try {
      const { questionId, userId, userRole } = request;

      // If not admin, verify ownership
      if (userRole !== 'user') {
        const question = await this.questionRepository.findById(questionId);

        if (!question) {
          throw createError('Question not found', 404);
        }

        if (question.customerId !== userId) {
          throw createError('You can only delete your own questions', 403);
        }
      }

      const deleted = await this.questionRepository.delete(questionId);

      if (!deleted) {
        throw createError('Question not found', 404);
      }

      return true;
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductQuestionService.deleteQuestion',
      });
      throw error;
    }
  }

  /**
   * Get pending questions (unanswered)
   */
  async getPendingQuestions(
    request: GetPendingQuestionsServiceRequest
  ): Promise<IProductQuestion[]> {
    try {
      const { limit = 50 } = request;

      return await this.questionRepository.getPendingQuestions(limit);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductQuestionService.getPendingQuestions',
      });
      throw error;
    }
  }

  /**
   * Get all questions by a specific customer
   */
  async getMyQuestions(
    request: GetMyQuestionsServiceRequest
  ): Promise<IProductQuestion[]> {
    try {
      const { customerId, limit = 20 } = request;

      return await this.questionRepository.getCustomerQuestions(customerId, limit);
    } catch (error) {
      errorEmitter.emitBusinessError(error as Error, {
        path: 'ProductQuestionService.getMyQuestions',
      });
      throw error;
    }
  }
}
