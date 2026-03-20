import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

async function proxyToBackend(
  req: NextRequest,
  method: string,
  path: string
): Promise<NextResponse> {
  logger.debug('[Proxy] Called! Path:', path, 'Method:', method);
  
  try {
    const session = await auth();

    logger.debug('[Proxy] Session:', {
      exists: !!session,
      hasUser: !!session?.user,
      hasToken: !!session?.user?.backendToken,
      email: session?.user?.email,
    });

    // Get query parameters from original request
    const searchParams = req.nextUrl.searchParams;
    const queryString = searchParams.toString();
    
    const backendUrl = `${BACKEND_URL}/api/${path}${queryString ? `?${queryString}` : ''}`;
    
    logger.debug('[Proxy] Forwarding to:', backendUrl);
    logger.debug(
      '[Proxy] Token:',
      session?.user?.backendToken
        ? session.user.backendToken.slice(0, 20) + '...'
        : 'No Token'
    );

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(session?.user?.backendToken
        ? { Authorization: `Bearer ${session.user.backendToken}` }
        : {}),
    };

    // Prepare request body for methods that support it
    let body: string | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      try {
        const jsonBody = await req.json();
        body = JSON.stringify(jsonBody);
      } catch {
        // Body might be empty or invalid JSON
        body = undefined;
      }
    }

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    });

    // Get response data
    const data = await response.json();

    // Handle 401 Unauthorized - JWT expired or invalid
    if (response.status === 401) {
      logger.warn('[Proxy] Backend returned 401 - JWT invalid/expired. Session should be invalidated.');
      
      // The 401 response will be passed to the client
      // The client should handle it by calling logout
      return NextResponse.json(
        { 
          error: data.message || 'Sessione scaduta. Effettua nuovamente il login.',
          code: 'SESSION_EXPIRED',
          ...data 
        }, 
        { status: 401 }
      );
    }

    // Return the backend response with the same status code
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logger.error('[Proxy] Proxy error:', error);
    return NextResponse.json(
      { error: 'Errore interno del server' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  return proxyToBackend(req, 'GET', path);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  return proxyToBackend(req, 'POST', path);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  return proxyToBackend(req, 'PUT', path);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  return proxyToBackend(req, 'PATCH', path);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  return proxyToBackend(req, 'DELETE', path);
}
