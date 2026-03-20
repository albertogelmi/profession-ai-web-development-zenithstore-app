'use client';

import { ProductGrid } from '@/components/products/ProductGrid';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search } from 'lucide-react';

interface SearchResultsProps {
  query: string;
  products: any[];
  total: number;
  isLoading: boolean;
}

export function SearchResults({ query, products, total, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return <ProductGrid products={[]} isLoading={true} />;
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="mb-4 rounded-full bg-muted p-6">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-xl font-semibold">Nessun risultato trovato</h3>
        <p className="mb-6 text-center text-muted-foreground">
          La ricerca per &quot;{highlightText(query)}&quot; non ha prodotto risultati.
        </p>
        <Alert className="max-w-md">
          <AlertDescription>
            <strong>Suggerimenti:</strong>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm">
              <li>Verifica l&apos;ortografia delle parole chiave</li>
              <li>Prova con parole chiave più generiche</li>
              <li>Prova con meno parole chiave</li>
              <li>Esplora le nostre categorie</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Risultati per: <span className="text-primary">&quot;{query}&quot;</span>
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? 'prodotto trovato' : 'prodotti trovati'}
        </p>
      </div>
      <ProductGrid products={products} isLoading={false} />
    </div>
  );
}

function highlightText(text: string): string {
  return text;
}
