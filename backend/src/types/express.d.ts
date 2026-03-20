// types/express.d.ts - TypeScript extensions for Express

import { JwtPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      token?: string;
    }
  }
}

// Extend the express module to include custom types
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
    token?: string;
  }
}