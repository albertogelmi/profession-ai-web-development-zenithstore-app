'use client';

import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Product } from '@/hooks/useProducts';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
}

function ProductSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[4/3] w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[...Array(12)].map((_, i) => (
          <ProductSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">
            Nessun prodotto trovato
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Prova a modificare i filtri di ricerca
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.code} product={product} />
      ))}
    </div>
  );
}
