import { Router } from 'express';
import { ProductQuestionController } from '../controllers/ProductQuestionController';
import { corsMiddleware } from '../middleware/security';
import { domainRestriction } from '../middleware/domainRestriction';
import { authenticateToken, authenticateTokenUser, authenticateTokenCustomer } from '../middleware/auth';

/**
 * Factory to create product question routes
 * @returns Configured Express Router
 */
export function createQuestionRoutes(): Router {
  const router = Router();
  
  // Controller instantiation
  const questionController = new ProductQuestionController();

  /**
   * @route POST /api/products/:productCode/questions
   * @desc Create a new question about a product
   * @access Customer only
   */
  router.post('/products/:productCode/questions', authenticateTokenCustomer, questionController.createQuestion);

  /**
   * @route GET /api/products/:productCode/questions
   * @desc Get all questions for a product
   * @access Public
   */
  router.get('/products/:productCode/questions', questionController.getProductQuestions);

  /**
   * @route PATCH /api/questions/:id/answer
   * @desc Answer a question
   * @access Admin only (localhost)
   */
  router.patch('/questions/:id/answer', corsMiddleware, domainRestriction, authenticateTokenUser, questionController.answerQuestion);

  /**
   * @route PATCH /api/questions/:id/hide
   * @desc Hide a question
   * @access Admin only (localhost)
   */
  router.patch('/questions/:id/hide', corsMiddleware, domainRestriction, authenticateTokenUser, questionController.hideQuestion);

  /**
   * @route PATCH /api/questions/:id/helpful
   * @desc Mark a question as helpful
   * @access Public
   */
  router.patch('/questions/:id/helpful', questionController.markQuestionHelpful);

  /**
   * @route DELETE /api/questions/:id
   * @desc Delete a question (customer owner or admin)
   * @access Customer (own) or Admin
   */
  router.delete('/questions/:id', authenticateToken, questionController.deleteQuestion);

  /**
   * @route GET /api/questions/pending
   * @desc Get all questions awaiting answer
   * @access Admin only (localhost)
   */
  router.get('/questions/pending', corsMiddleware, domainRestriction, authenticateTokenUser, questionController.getPendingQuestions);

  /**
   * @route GET /api/customers/me/questions
   * @desc Get all questions of the authenticated customer
   * @access Customer only
   */
  router.get('/customers/me/questions', authenticateTokenCustomer, questionController.getMyQuestions);

  return router;
}

export default createQuestionRoutes;
