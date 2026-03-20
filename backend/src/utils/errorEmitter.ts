import { EventEmitter } from 'events';
import { AppError } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';

export interface ErrorEvent {
  error: Error;
  context?: {
    userId?: string;
    path?: string;
    method?: string;
    ip?: string;
    userAgent?: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

class ErrorEventEmitter extends EventEmitter {
  private errorLogPath: string;

  constructor() {
    super();
    this.errorLogPath = path.join(process.cwd(), 'logs', process.env.ERROR_LOG_FILE_NAME || 'errors.log');
    this.setupListeners();
  }

  private setupListeners() {
    // Listener for error logging
    this.on('error', this.logError.bind(this));
    
    // Listener for critical errors
    this.on('critical-error', this.handleCriticalError.bind(this));
    
    // Listener for database errors
    this.on('database-error', this.handleDatabaseError.bind(this));

    // Listener for business logic errors
    this.on('business-error', this.handleBusinessError.bind(this));
  }

  // Method for error logging
  private logError(errorEvent: ErrorEvent) {
    const timestamp = errorEvent.context?.timestamp || new Date();
    const severity = errorEvent.context?.severity || 'medium';
    const appError = errorEvent.error as AppError;
    const statusCode = appError.statusCode || 500;
    const errorName = appError.errorName || 'Internal Server Error';
    
    const logEntry = [
      '',
      '╔═══════════════════════════════════════════════════════════════════',
      `║ 🚨 ERROR LOG - ${timestamp.toISOString()}`,
      `║ 📊 Severity: ${severity.toUpperCase()}`,
      '╠═══════════════════════════════════════════════════════════════════',
      `║ 🔢 Status: ${statusCode} (${errorName})`,
      `║ 🔥 ${errorEvent.error.name}: ${errorEvent.error.message}`,
      '║',
      `║ 📍 Location: ${errorEvent.context?.method || 'unknown'} ${errorEvent.context?.path || 'unknown'}`,
      `║ 👤 User: ${errorEvent.context?.userId || 'anonymous'}`,
      `║ 🌐 IP: ${errorEvent.context?.ip || 'unknown'}`,
      `║ 📱 User-Agent: ${errorEvent.context?.userAgent || 'unknown'}`,
      // Show stack trace only if it's NOT an operational (controlled) error
      ...(!appError.isOperational ? [
        '║',
        '║ 📚 Stack Trace:',
        ...(errorEvent.error.stack ? errorEvent.error.stack.split('\n').map(line => `║   ${line}`) : ['║   No stack trace available']),
        '║',
      ] : []),
      '╚═══════════════════════════════════════════════════════════════════',
      ''
    ].join('\n');
    
    // Log to file
    fs.appendFileSync(this.errorLogPath, logEntry + '\n');
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`${logEntry}`);
    }
  }

  // Specific handling for critical errors
  private handleCriticalError(errorEvent: ErrorEvent) {
    const timestamp = errorEvent.context?.timestamp || new Date();

    const criticalLog = [
      '',
      '╔═══════════════════════════════════════════════════════════════════',
      '║                    CRITICAL ERROR DETECTED',
      '╠═══════════════════════════════════════════════════════════════════',
      `║ 🕒 Time: ${timestamp.toISOString()}`,
      `║ 🚨 Error: ${errorEvent.error.message}`,
      `║ 📍 Location: ${errorEvent.context?.method || 'unknown'} - ${errorEvent.context?.path || 'unknown'}`,
      '╚═══════════════════════════════════════════════════════════════════',
      ''
    ].join('\n');
    
    console.error(criticalLog);
    fs.appendFileSync(this.errorLogPath, criticalLog + '\n');
    
    // Here notifications, emails, etc. could be sent
  }

  // Specific handling for database errors
  private handleDatabaseError(errorEvent: ErrorEvent) {
    const timestamp = errorEvent.context?.timestamp || new Date();

    const dbErrorLog = [
      '',
      '╔═══════════════════════════════════════════════════════════════════',
      '║                    DATABASE ERROR DETECTED',
      '╠═══════════════════════════════════════════════════════════════════',
      `║ 🕒 Time: ${timestamp.toISOString()}`,
      `║ 🚨 Error: ${errorEvent.error.message}`,
      `║ 📍 Location: ${errorEvent.context?.path || 'unknown'}`,
      '╚═══════════════════════════════════════════════════════════════════',
      ''
    ].join('\n');
    
    console.error(dbErrorLog);
    fs.appendFileSync(this.errorLogPath, dbErrorLog + '\n');

    // Here retry logic, fallback, etc. could be implemented
  }

  // Specific handling for business errors
  private handleBusinessError(errorEvent: ErrorEvent) {
    const timestamp = errorEvent.context?.timestamp || new Date();

    const businessLog = [
      '',
      '╔═══════════════════════════════════════════════════════════════════',
      '║                    BUSINESS ERROR DETECTED',
      '╠═══════════════════════════════════════════════════════════════════',
      `║ 🕒 Time: ${timestamp.toISOString()}`,
      `║ 🚨 Error: ${errorEvent.error.message}`,
      `║ 📍 Location: ${errorEvent.context?.path || 'unknown'}`,
      '╚═══════════════════════════════════════════════════════════════════',
      ''
    ].join('\n');
    
    console.error(businessLog);
    fs.appendFileSync(this.errorLogPath, businessLog + '\n');
  }

  /**
   * Emit a generic error
   */
  emitError(error: Error, context?: Partial<ErrorEvent['context']>) {
    this.emit('error', {
      error,
      context: {
        ...context,
        timestamp: new Date(),
        severity: context?.severity || 'medium'
      }
    });
  }

  /**
   * Emit a critical error
   */
  emitCriticalError(error: Error, context?: Partial<ErrorEvent['context']>) {
    this.emit('critical-error', {
      error,
      context: {
        ...context,
        timestamp: new Date()
      }
    });
  }

  /**
   * Emit a database error
   */
  emitDatabaseError(error: Error, context?: Partial<ErrorEvent['context']>) {
    this.emit('database-error', {
      error,
      context: {
        ...context,
        timestamp: new Date()
      }
    });
  }

  /**
   * Emit a business logic error
   */
  emitBusinessError(error: Error, context?: Partial<ErrorEvent['context']>) {
    this.emit('business-error', {
      error,
      context: {
        ...context,
        timestamp: new Date()
      }
    });
  }
}

// Singleton instance
export const errorEmitter = new ErrorEventEmitter();