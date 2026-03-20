import helmet from 'helmet';
import cors from 'cors';
import { CorsOptions } from 'cors';
import dotenv from 'dotenv';

dotenv.config();

/**
 * CORS configuration based on environment variables
 */
const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

    // No Origin header = direct browser navigation or same-origin request.
    // Browsers always attach Origin on cross-origin XHR/fetch calls, so the
    // absence of Origin guarantees this is NOT a cross-origin scripted request
    // and cannot be exploited as a CORS attack. Blocking it adds no security
    // and breaks legitimate direct navigation in all environments.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS origin not allowed: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

/**
 * Helmet configuration for security
 */
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
};

export const corsMiddleware = cors(corsOptions);
export const helmetMiddleware = helmet(helmetOptions);