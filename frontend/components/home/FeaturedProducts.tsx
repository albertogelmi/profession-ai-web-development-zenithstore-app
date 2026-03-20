'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/products/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight } from 'lucide-react';

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

export function FeaturedProducts() {
  const { data, isLoading, error } = useProducts({ 
    limit: 8,
    sortBy: 'createdAt',
    sortOrder: 'DESC'
  });

  if (error) {
    return (
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              Impossibile caricare i prodotti. Riprova più tardi.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const products = data?.products || [];

  return (
    <section className="bg-muted/50 py-16 sm:py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h2 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Prodotti in Evidenza
            </h2>
            <p className="text-lg text-muted-foreground">
              Scopri i nostri prodotti più popolari
            </p>
          </div>
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/products">
              Vedi Tutti
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : products.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.code} product={product} />
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <Button size="lg" variant="default" className="gap-2" asChild>
                <Link href="/products">
                  Esplora il Catalogo Completo
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">
              Nessun prodotto disponibile al momento.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
