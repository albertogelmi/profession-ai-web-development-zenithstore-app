import { createError, AppError } from '../../../src/middleware/errorHandler';

// ---------------------------------------------------------------------------
// createError
// ---------------------------------------------------------------------------
describe('createError', () => {
  it('should create an AppError with the correct message and statusCode', () => {
    const err: AppError = createError('Resource not found', 404);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('Resource not found');
    expect(err.statusCode).toBe(404);
  });

  it('should always mark the error as operational', () => {
    const err = createError('Bad request', 400);
    expect(err.isOperational).toBe(true);
  });

  it('should map well-known status codes to the expected errorName', () => {
    const cases: [number, string][] = [
      [400, 'Bad Request'],
      [401, 'Unauthorized'],
      [403, 'Forbidden'],
      [404, 'Not Found'],
      [409, 'Conflict'],
      [422, 'Unprocessable Entity'],
      [429, 'Too Many Requests'],
      [500, 'Internal Server Error'],
    ];

    for (const [statusCode, expectedName] of cases) {
      const err = createError('test', statusCode);
      expect(err.errorName).toBe(expectedName);
    }
  });

  it('should fall back to "Error" for unmapped status codes', () => {
    const err = createError('Something unusual', 599);
    expect(err.errorName).toBe('Error');
  });
});
