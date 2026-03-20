'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductSort } from '@/components/products/ProductSort';
import { Pagination } from '@/components/products/Pagination';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useProducts, usePriceRange } from '@/hooks/useProducts';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface CategoryPageContentProps {
  category: Category;
}

export function CategoryPageContent({ category }: CategoryPageContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch dynamic price range for this category
  const { data: priceRangeData } = usePriceRange(category.slug);
  const priceMin = priceRangeData?.min ?? 0;
  const priceMax = priceRangeData?.max ?? 10000;

  // Filter state
  const [priceRange, setPriceRange] = useState<[number, number]>([priceMin, priceMax]);

  // Get filters from URL
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const sortParam = searchParams.get('sort') || 'createdAt_desc';
  const sortParts = sortParam.split('_');
  const sortBy = sortParts[0];
  const sortOrder = (sortParts[1]?.toUpperCase() || 'DESC') as 'ASC' | 'DESC';
  const urlPriceMin = searchParams.get('priceMin');
  const urlPriceMax = searchParams.get('priceMax');

  // Sync price range with URL params and dynamic min/max
  useEffect(() => {
    setPriceRange([
      urlPriceMin ? parseInt(urlPriceMin, 10) : priceMin,
      urlPriceMax ? parseInt(urlPriceMax, 10) : priceMax,
    ]);
  }, [priceMin, priceMax, urlPriceMin, urlPriceMax]);

  const { data, isLoading } = useProducts({
    categorySlug: category.slug,
    priceMin: priceRange[0] > priceMin ? priceRange[0] : undefined,
    priceMax: priceRange[1] < priceMax ? priceRange[1] : undefined,
    sortBy: sortBy as any,
    sortOrder,
    page: currentPage,
    limit: 12,
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  // Check if filters are active
  const hasActiveFilters = 
    priceRange[0] !== priceMin || 
    priceRange[1] !== priceMax ||
    sortParam !== 'createdAt_desc';

  // Handlers
  const handleSortChange = (value: string) => {
    updateURL({ sort: value, page: '1' });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page: page.toString() });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    updateURL({ priceMin: range[0] > priceMin ? range[0].toString() : undefined, priceMax: range[1] < priceMax ? range[1].toString() : undefined, page: '1' });
  };

  const handleReset = () => {
    setPriceRange([priceMin, priceMax]);
    router.push(`/categories/${category.slug}`);
  };

  const updateURL = (newParams: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    router.push(`/categories/${category.slug}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/categories" className="hover:text-foreground transition-colors">
          Categorie
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{category.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-muted-foreground">{category.description}</p>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Filters Sidebar - Desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            {/* Sort */}
            <ProductSort currentSort={sortParam} onSortChange={handleSortChange} />
            
            {/* Filters */}
            <ProductFilters
              selectedCategories={[]}
              priceMin={priceMin}
              priceMax={priceMax}
              priceRange={priceRange}
              currentSort={sortParam}
              onCategoryToggle={() => {}}
              onPriceRangeChange={handlePriceRangeChange}
              onReset={handleReset}
              hideCategories
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between">
            {/* Mobile Filters */}
            <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filtri
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto flex flex-col">
                <SheetHeader className="mb-6">
                  <SheetTitle>Filtri</SheetTitle>
                  <SheetDescription>Filtra e ordina i prodotti per trovare quello che cerchi</SheetDescription>
                </SheetHeader>
                
                <div className="space-y-4 flex-1">
                  {/* Sort */}
                  <ProductSort currentSort={sortParam} onSortChange={handleSortChange} />
                  
                  {/* Filters */}
                  <ProductFilters
                    selectedCategories={[]}
                    priceMin={priceMin}
                    priceMax={priceMax}
                    priceRange={priceRange}
                    currentSort={sortParam}
                    onCategoryToggle={() => {}}
                    onPriceRangeChange={handlePriceRangeChange}
                    onReset={handleReset}
                    onClose={() => setIsFiltersOpen(false)}
                    hideCategories
                  />
                </div>
              </SheetContent>
            </Sheet>
            
            <p className="hidden lg:block text-sm text-muted-foreground ml-auto">
              {total} {total === 1 ? 'prodotto trovato' : 'prodotti trovati'}
            </p>
          </div>

          {/* Products Grid */}
          <ProductGrid products={products} isLoading={isLoading} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
