'use client';
// ErrorBoundary: catches JavaScript errors in child components and displays a fallback UI.

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary catches JavaScript errors in its child component tree,
 * logs them, and displays a fallback UI instead of the crashed subtree.
 * 
 * @example
 * <ErrorBoundary>
 *  { Your components here }
 * </ErrorBoundary>
 * 
 * @see https://reactjs.org/docs/error-boundaries.html
 *
 * @prop {React.ReactNode} children - Components to protect with the error boundary.
 * @state {boolean} hasError - True if an error was caught.
 * @state {Error} [error] - The error object, if available.
 * @returns A component that either renders its children or a fallback UI on error.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  // Update state when an error is thrown
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  // Log error details for debugging
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    // If an error occurred, show fallback UI with error details
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="max-w-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. Please try refreshing the page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {this.state.error && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-muted-foreground">
                    Error details
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-md bg-muted p-2 text-xs">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                Refresh Page
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
