'use client';
// This file defines the Providers component, which wraps the app with global providers for error handling, authentication, and data fetching.

// Provides authentication context for NextAuth
import { SessionProvider } from 'next-auth/react';
// Provides React Query client for server state management
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
// Handles runtime errors and displays a fallback UI
import { ErrorBoundary } from '@/components/ui/error-boundary';
// Cart synchronization across browser tabs
import { useCartSync } from '@/hooks/useCartSync';
// WebSocket connection for real-time notifications
import { useWebSocket } from '@/hooks/useWebSocket';

/**
 * Internal component to activate cart synchronization across tabs
 */
function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}

/**
 * Internal component to manage WebSocket connection
 */
function WebSocketProvider({ children }: { children: React.ReactNode }) {
  useWebSocket();
  return <>{children}</>;
}

/**
 * Providers wraps the app with error boundary, authentication, and React Query context
 * 
 * @example
 * <Providers>
 *   { Your app components }
 * </Providers>
 * 
 * @param children - The child components to be wrapped by the providers
 * @return A component tree wrapped with global providers
*/
export function Providers({ children }: { children: React.ReactNode }) {
  // Create a single instance of QueryClient for React Query
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // Cache queries for 1 minute
            refetchOnWindowFocus: false, // Do not refetch on window focus
          },
        },
      })
  );

  // Compose all global providers
  return (
    <ErrorBoundary> {/* Catch errors in the app */}
      <SessionProvider> {/* Provide authentication context */}
        <QueryClientProvider client={queryClient}> {/* Provide React Query context */}
          <WebSocketProvider> {/* WebSocket for real-time notifications */}
            <CartSyncProvider> {/* Sync cart across browser tabs */}
              {children}
            </CartSyncProvider>
          </WebSocketProvider>
        </QueryClientProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
