import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * NotFound
 *
 * Global 404 page for handling missing routes in the Next.js app.
 * Displays a user-friendly message, error code, helpful links, and navigation actions.
 * Automatically used by Next.js when a route is not found in the app directory.
 *
 * @returns A 404 error page with message, actions, and useful links.
 *
 * @example
 * // Automatically rendered by Next.js when a route is not found
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/not-found
 */
export default function NotFound() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-8">
      <div className="text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-muted p-8">
            <FileQuestion className="h-24 w-24 text-muted-foreground" />
          </div>
        </div>

        {/* Error Code */}
        <h1 className="mb-4 text-8xl font-bold text-primary">404</h1>

        {/* Message */}
        <h2 className="mb-2 text-2xl font-semibold">Pagina non trovata</h2>
        <p className="mb-8 text-muted-foreground">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">Torna alla Home</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/products">Esplora Prodotti</Link>
          </Button>
        </div>

        {/* Helpful Links */}
        <div className="mt-12">
          <p className="mb-4 text-sm text-muted-foreground">Link utili:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/categories" className="text-primary hover:underline">
              Categorie
            </Link>
            <Link href="/support" className="text-primary hover:underline">
              Supporto
            </Link>
            <Link href="/about" className="text-primary hover:underline">
              Chi Siamo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
