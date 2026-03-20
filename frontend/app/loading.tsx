import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading
 *
 * Global loading page for displaying skeletons and a spinner while content is being fetched or rendered.
 * Automatically used by Next.js during route or segment loading in the app directory.
 *
 * @returns A loading UI with skeleton placeholders and a centered spinner.
 *
 * @example
 * // Automatically rendered by Next.js during page or segment loading
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/loading-ui
 */
export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header Skeleton */}
      <div className="mb-8">
        <Skeleton className="mb-2 h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Centered Loading Indicator */}
      <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    </div>
  );
}
