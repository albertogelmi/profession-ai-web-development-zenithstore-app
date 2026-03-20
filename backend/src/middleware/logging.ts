import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write stream for log file
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, process.env.ACCESS_LOG_FILE_NAME || 'access.log'),
  { flags: 'a' }
);

// Custom token for user ID from JWT
morgan.token('user-id', (req: Request) => {
  return req.user?.userId?.toString() || 'anonymous';
});

// Custom token for Rome timezone
morgan.token('date-rome', () => {
  return new Date().toLocaleString('it-IT', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
});

// Custom token for request body (only for non-sensitive routes)
morgan.token('req-body', (req: Request) => {
  if (req.path.includes('login') || req.path.includes('password')) {
    return '[HIDDEN]';
  }
  if (!req.body || Object.keys(req.body).length === 0) {
    return '[EMPTY]';
  }
  const bodyStr = JSON.stringify(req.body);
  return bodyStr ? bodyStr.substring(0, 200) : '[EMPTY]'; // Limit body size
});

// Custom token for response body (limited)
morgan.token('res-body', (req: Request, res: Response) => {
  if (req.path.includes('login') || req.path.includes('password')) {
    return '[HIDDEN]';
  }
  if (!res.locals.responseBody) {
    return '[EMPTY]';
  }
  const bodyStr = JSON.stringify(res.locals.responseBody);
  return bodyStr ? bodyStr.substring(0, 200) : '[EMPTY]';
});

const logFormat = `
┌─ Request: :method :url HTTP/:http-version
├─ Client: :remote-addr | User: :user-id 
├─ Status: :status | Size: :res[content-length] | Time: :response-time ms
├─ Time: :date-rome (Rome)
├─ User-Agent: ":user-agent"
├─ Request Body: :req-body
└─ Response Body: :res-body
`;

/**
 * Middleware to log request and response both to console and file
 */
export const accessLogger = morgan(logFormat, {
  stream: {
    write: (message: string) => {
      // Write to file
      accessLogStream.write(message);
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.info(message);
      }
    }
  }
});

/**
 * Middleware to capture the response body for logging
 */
export const captureResponseBody = (req: Request, res: Response, next: Function) => {
  const originalSend = res.send;
  
  res.send = function(body: any) {
    // If there's a JSON object in the body, try to parse it
    let jsonBody;
    try {
      jsonBody = JSON.parse(body);
      // If there's an error stack trace in the body, remove it
      if (jsonBody && jsonBody.stack) {
        delete jsonBody.stack;
      }
      // Save the parsed body in res.locals for logging
      res.locals.responseBody = jsonBody;
    } catch (error) {
      // If parsing fails, log a warning
      console.warn('Failed to parse response body as JSON:', error);
    }
    // Call res.send with modified body (if parsing ok) or original
    return originalSend.call(this, jsonBody ? JSON.stringify(jsonBody) : body);
  };
  
  next();
};