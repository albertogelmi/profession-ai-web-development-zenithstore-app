import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CategoryPageContent } from '@/components/categories/CategoryPageContent';
import { logger } from '@/lib/logger';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    page?: string;
    priceMin?: string;
    priceMax?: string;
    sort?: string;
  }>;
}

async function getCategory(slug: string) {
  try {
    const baseUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/categories/${slug}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.category || data.data?.category || null;
  } catch (error) {
    logger.error('Error fetching category:', error);
    return null;
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);

  if (!category) {
    return {
      title: 'Categoria non trovata - ZenithStore',
    };
  }

  return {
    title: `${category.name} - ZenithStore`,
    description: category.description || `Scopri tutti i prodotti della categoria ${category.name}`,
    openGraph: {
      title: `${category.name} - ZenithStore`,
      description: category.description || `Scopri tutti i prodotti della categoria ${category.name}`,
      type: 'website',
    },
  };
}

async function CategoryContent({ slug }: { slug: string }) {
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  return <CategoryPageContent category={category} />;
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Caricamento...</div>}>
        <CategoryContent slug={slug} />
      </Suspense>
    </div>
  );
}
