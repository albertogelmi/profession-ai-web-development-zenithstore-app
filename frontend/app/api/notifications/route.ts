import { auth } from '@/lib/auth';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * Resolve the backendToken for a request.
 * First tries the NextAuth session cookie; if that doesn't carry a token
 * (e.g. due to a cookie timing race at WebSocket connect), falls back to
 * a validated `Authorization: Bearer <token>` header sent by the client.
 */
async function resolveBackendToken(req: NextRequest): Promise<string | null> {
  // 1. Session cookie (preferred)
  const session = await auth();
  if (session?.user?.backendToken) {
    return session.user.backendToken;
  }

  // 2. Explicit Authorization header (sent by useWebSocket on reconnect)
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const bearerToken = authHeader.substring(7);
    try {
      // Verify the token was signed by this server before trusting it
      jwt.verify(bearerToken, JWT_SECRET, {
        issuer: 'zenithstore-api',
        audience: 'zenithstore-users',
      });
      return bearerToken;
    } catch {
      logger.warn('[Notifications API] Invalid bearer token in Authorization header');
    }
  }

  return null;
}

/**
 * GET /api/notifications - Proxy to backend notifications endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const backendToken = await resolveBackendToken(req);

    if (!backendToken) {
      return NextResponse.json(
        { error: 'Non autenticato' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const backendUrl = `${BACKEND_URL}/api/notifications${queryString ? `?${queryString}` : ''}`;
    
    logger.debug('[Notifications API] Forwarding to:', backendUrl);

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${backendToken}`,
      },
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logger.error('[Notifications API] Error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}
