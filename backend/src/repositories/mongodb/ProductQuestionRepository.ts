import { ProductQuestion, IProductQuestion } from '../../entities/mongodb/ProductQuestion';
import { errorEmitter } from '../../utils/errorEmitter';

/**
 * Product Question Repository
 * Handles all database operations for product Q&A system
 */
export class ProductQuestionRepository {
  
  /**
   * Create a new question
   */
  async create(questionData: Partial<IProductQuestion>): Promise<IProductQuestion> {
    try {
      const question = new ProductQuestion({
        status: 'pending',
        helpfulCount: 0,
        createdAt: new Date(),
        ...questionData,
      });
      return await question.save();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductQuestionRepository.create',
      });
      throw error;
    }
  }

  /**
   * Find question by ID
   */
  async findById(id: string): Promise<IProductQuestion | null> {
    try {
      return await ProductQuestion.findById(id).select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductQuestionRepository.findById',
      });
      throw error;
    }
  }

  /**
   * Get all questions for a product
   */
  async getProductQuestions(
    productCode: string,
    includeHidden: boolean = false
  ): Promise<IProductQuestion[]> {
    try {
      const query: any = { productCode };
      
      if (!includeHidden) {
        query.status = { $ne: 'hidden' };
      }

      return await ProductQuestion.find(query)
        .sort({ createdAt: -1 })
        .select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductQuestionRepository.getProductQuestions',
      });
      throw error;
    }
  }

  /**
   * Get pending questions (unanswered)
   */
  async getPendingQuestions(limit: number = 50): Promise<IProductQuestion[]> {
    try {
      return await ProductQuestion.find({ status: 'pending' })
        .sort({ createdAt: 1 })
        .limit(limit)
        .select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductQuestionRepository.getPendingQuestions',
      });
      throw error;
    }
  }

  /**
   * Get questions by customer
   */
  async getCustomerQuestions(
    customerId: number,
    limit: number = 20
  ): Promise<IProductQuestion[]> {
    try {
      return await ProductQuestion.find({ customerId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductQuestionRepository.getCustomerQuestions',
      });
      throw error;
    }
  }

  /**
   * Add answer to a question
   */
  async addAnswer(
    questionId: string,
    answerText: string,
    answeredBy: string,
    answeredById: string
  ): Promise<IProductQuestion | null> {
    try {
      const question = await ProductQuestion.findById(questionId);
      if (!question) {
        return null;
      }

      question.answer = {
        text: answerText,
        answeredBy,
        answeredById,
        answeredAt: new Date(),
      };
      question.status = 'answered';
      
      return await question.save();
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductQuestionRepository.addAnswer',
      });
      throw error;
    }
  }

  /**
   * Hide a question
   */
  async hideQuestion(questionId: string): Promise<IProductQuestion | null> {
    try {
      return await ProductQuestion.findByIdAndUpdate(
        questionId,
        { status: 'hidden' },
        { new: true }
      ).select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductQuestionRepository.hideQuestion',
      });
      throw error;
    }
  }

  /**
   * Increment helpful counter
   */
  async incrementHelpful(questionId: string): Promise<IProductQuestion | null> {
    try {
      return await ProductQuestion.findByIdAndUpdate(
        questionId,
        { $inc: { helpfulCount: 1 } },
        { new: true }
      ).select('-__v');
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductQuestionRepository.incrementHelpful',
      });
      throw error;
    }
  }

  /**
   * Delete question physically from database
   */
  async delete(questionId: string): Promise<boolean> {
    try {
      const result = await ProductQuestion.findByIdAndDelete(questionId);
      return result !== null;
    } catch (error) {
      errorEmitter.emitDatabaseError(error as Error, {
        path: 'ProductQuestionRepository.delete',
      });
      throw error;
    }
  }

}
