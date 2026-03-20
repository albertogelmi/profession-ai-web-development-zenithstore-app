'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logger } from '@/lib/logger';

/**
 * Error
 *
 * Global error page for handling runtime errors in the Next.js app.
 * Displays an error message, technical details in development, retry and home actions, and a support link.
 * Automatically used by Next.js as an error boundary for routes/pages in the app directory.
 *
 * @prop {Error & { digest?: string }} error - The error object captured by the framework.
 * @prop {() => void} reset - Function to reset the error state and retry rendering.
 * @returns A user-friendly error page with code, message, technical details (in development), and user actions.
 *
 * @example
 * // Automatically rendered by Next.js on runtime error in a route/app
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    logger.error('Application error:', error);
  }, [error]);

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-8">
            <AlertCircle className="h-24 w-24 text-destructive" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="mb-4 text-6xl font-bold text-destructive">500</h1>

        {/* Message */}
        <h2 className="mb-2 text-2xl font-semibold">Qualcosa è andato storto</h2>
        <p className="mb-8 text-muted-foreground">
          Si è verificato un errore imprevisto. Ti preghiamo di riprovare.
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Alert variant="destructive" className="mb-8 text-left">
            <AlertTitle>Dettagli errore (solo sviluppo):</AlertTitle>
            <AlertDescription>
              <code className="block overflow-x-auto whitespace-pre-wrap break-all text-xs">
                {error.message}
              </code>
              {error.digest && (
                <p className="mt-2 text-xs">
                  <strong>Digest:</strong> {error.digest}
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button onClick={reset} size="lg">
            Riprova
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline" size="lg">
            Torna alla Home
          </Button>
        </div>

        {/* Support */}
        <div className="mt-12">
          <p className="text-sm text-muted-foreground">
            Se il problema persiste, contatta il nostro{' '}
            <Link href="/support" className="font-medium text-primary hover:underline">
              supporto clienti
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
