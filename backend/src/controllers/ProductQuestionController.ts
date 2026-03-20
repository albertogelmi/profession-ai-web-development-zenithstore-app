import { Response } from 'express';
import { ProductQuestionService } from '../services/ProductQuestionService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import {
  createApiResponse,
  CreateQuestionRequest,
  GetQuestionsRequest,
  QuestionIdRequest,
  AnswerQuestionRequest,
  GetPendingQuestionsRequest,
  GetMyQuestionsRequest,
} from '../types/api';

export class ProductQuestionController {
  private questionService: ProductQuestionService;

  constructor() {
    this.questionService = new ProductQuestionService();
  }

  /**
   * POST /api/products/:productCode/questions
   * Create a new question on a product
   */
  createQuestion = asyncHandler(async (req: CreateQuestionRequest, res: Response): Promise<void> => {
    const { productCode } = req.params;
    const { question } = req.body;
    const customerId = Number(req.user.userId);

    if (!question || question.trim().length === 0) {
      throw createError('Question text is required', 400);
    }

    if (question.length > 500) {
      throw createError('Question must be less than 500 characters', 400);
    }

    const newQuestion = await this.questionService.createQuestion({
      customerId,
      productCode,
      question,
    });

    res.status(201).json(createApiResponse(
      true,
      'Question created successfully',
      newQuestion
    ));
  });

  /**
   * GET /api/products/:productCode/questions
   * Get all questions for a product
   */
  getProductQuestions = asyncHandler(async (req: GetQuestionsRequest, res: Response): Promise<void> => {
    const { productCode } = req.params;
    const includeHidden = req.query.includeHidden === 'true';

    const questions = await this.questionService.getProductQuestions({
      productCode,
      includeHidden,
    });

    res.status(200).json(createApiResponse(
      true,
      'Questions retrieved successfully',
      questions
    ));
  });

  /**
   * PATCH /api/questions/:id/answer
   * Answer a question (admin/staff only)
   */
  answerQuestion = asyncHandler(async (req: AnswerQuestionRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { answer } = req.body;
    const userId = req.user.userId;

    if (!answer || answer.trim().length === 0) {
      throw createError('Answer text is required', 400);
    }

    if (answer.length > 1000) {
      throw createError('Answer must be less than 1000 characters', 400);
    }

    const question = await this.questionService.answerQuestion({
      questionId: id,
      answer,
      userId: userId.toString(),
    });

    res.status(200).json(createApiResponse(
      true,
      'Answer added successfully',
      question
    ));
  });

  /**
   * PATCH /api/questions/:id/hide
   * Hide a question (admin only)
   */
  hideQuestion = asyncHandler(async (req: QuestionIdRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const moderatorId = req.user.userId.toString();

    const question = await this.questionService.hideQuestion({
      questionId: id,
      moderatorId,
    });

    res.status(200).json(createApiResponse(
      true,
      'Question hidden successfully',
      question
    ));
  });

  /**
   * PATCH /api/questions/:id/helpful
   * Increment helpful counter
   */
  markQuestionHelpful = asyncHandler(async (req: QuestionIdRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const question = await this.questionService.markQuestionHelpful(id);

    res.status(200).json(createApiResponse(
      true,
      'Question marked as helpful',
      question
    ));
  });

  /**
   * DELETE /api/questions/:id
   * Delete a question (customer owner or admin)
   */
  deleteQuestion = asyncHandler(async (req: QuestionIdRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = Number(req.user.userId);
    const userRole = req.user.role;

    await this.questionService.deleteQuestion({
      questionId: id,
      userId,
      userRole,
    });

    res.status(200).json(createApiResponse(
      true,
      'Question deleted successfully',
      null
    ));
  });

  /**
   * GET /api/questions/pending
   * Get all questions awaiting answer (admin only)
   */
  getPendingQuestions = asyncHandler(async (req: GetPendingQuestionsRequest, res: Response): Promise<void> => {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

    const questions = await this.questionService.getPendingQuestions({ limit });

    res.status(200).json(createApiResponse(
      true,
      'Pending questions retrieved successfully',
      questions
    ));
  });

  /**
   * GET /api/customers/me/questions
   * Get all questions of the authenticated customer
   */
  getMyQuestions = asyncHandler(async (req: GetMyQuestionsRequest, res: Response): Promise<void> => {
    const customerId = Number(req.user.userId);
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;

    const questions = await this.questionService.getMyQuestions({ customerId, limit });

    res.status(200).json(createApiResponse(
      true,
      'Your questions retrieved successfully',
      questions
    ));
  });
}
