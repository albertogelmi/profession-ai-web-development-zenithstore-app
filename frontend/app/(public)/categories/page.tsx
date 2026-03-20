import { Metadata } from 'next';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Suspense } from 'react';
import { logger } from '@/lib/logger';

export const metadata: Metadata = {
  title: 'Categorie Prodotti - ZenithStore',
  description: 'Esplora tutte le categorie di prodotti disponibili su ZenithStore',
  openGraph: {
    title: 'Categorie Prodotti - ZenithStore',
    description: 'Esplora tutte le categorie di prodotti disponibili su ZenithStore',
    type: 'website',
  },
};

async function getCategories() {
  try {
    const baseUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/categories`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }

    const data = await response.json();
    return data.categories || data.data?.categories || [];
  } catch (error) {
    logger.error('Error fetching categories:', error);
    return [];
  }
}

async function CategoriesContent() {
  const categories = await getCategories();

  if (categories.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <p className="text-lg text-muted-foreground">
          Nessuna categoria disponibile al momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {categories.map((category: any) => (
        <CategoryCard key={category.slug} category={category} />
      ))}
    </div>
  );
}

function CategoriesLoading() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-64 w-full" />
      ))}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Categorie Prodotti</h1>
        <p className="mt-2 text-muted-foreground">
          Esplora i nostri prodotti organizzati per categoria
        </p>
      </div>

      {/* Categories Grid */}
      <Suspense fallback={<CategoriesLoading />}>
        <CategoriesContent />
      </Suspense>
    </div>
  );
}
