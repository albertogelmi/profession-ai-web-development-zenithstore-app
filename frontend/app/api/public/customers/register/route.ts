import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    logger.error('Registration proxy error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Errore interno del server' 
      },
      { status: 500 }
    );
  }
}
