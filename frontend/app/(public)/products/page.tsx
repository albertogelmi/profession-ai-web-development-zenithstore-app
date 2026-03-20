'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductSort } from '@/components/products/ProductSort';
import { Pagination } from '@/components/products/Pagination';
import { SearchResults } from '@/components/search/SearchResults';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useProducts, usePriceRange } from '@/hooks/useProducts';
import { useSearch } from '@/hooks/useSearch';
import { SlidersHorizontal } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse query params
  const searchQuery = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category');
  const priceMinParam = searchParams.get('priceMin');
  const priceMaxParam = searchParams.get('priceMax');
  const sortParam = searchParams.get('sort') || 'createdAt_desc';
  const pageParam = searchParams.get('page') || '1';

  // State
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  
  const categorySlug = categoryParam && isNaN(Number(categoryParam)) ? categoryParam : undefined;
  const selectedCategories = categorySlug ? [categorySlug] : [];

  const currentPage = parseInt(pageParam, 10);
  const sortParts = sortParam.split('_');
  const sortBy = sortParts[0];
  const sortOrder = (sortParts[1]?.toUpperCase() || 'DESC') as 'ASC' | 'DESC';

  // Fetch dynamic price range
  const { data: priceRangeData } = usePriceRange(categorySlug, searchQuery);
  const priceMin = priceRangeData?.min ?? 0;
  const priceMax = priceRangeData?.max ?? 10000;
  
  // Local state for price range (avoids re-renders on slider drag)
  const [priceRange, setPriceRange] = useState<[number, number]>([priceMin, priceMax]);

  // Sync price range with URL params and dynamic min/max
  useEffect(() => {
    setPriceRange([
      priceMinParam ? parseInt(priceMinParam) : priceMin,
      priceMaxParam ? parseInt(priceMaxParam) : priceMax
    ]);
  }, [priceMin, priceMax, priceMinParam, priceMaxParam]);

  // Use search hook if there's a query, otherwise use products hook
  const searchResults = useSearch(
    searchQuery,
    currentPage,
    {
      categorySlug: categorySlug,
      priceMin: priceRange[0] > priceMin ? priceRange[0] : undefined,
      priceMax: priceRange[1] < priceMax ? priceRange[1] : undefined,
      sortBy: sortParam,
    }
  );

  const { data, isLoading, error } = useProducts({
    name: searchQuery || undefined,
    categorySlug: categorySlug,
    priceMin: priceRange[0] > priceMin ? priceRange[0] : undefined,
    priceMax: priceRange[1] < priceMax ? priceRange[1] : undefined,
    sortBy: sortBy as any,
    sortOrder,
    page: currentPage,
    limit: 12,
  });

  // Use search results if there's a query, otherwise use regular products
  const isSearching = !!searchQuery;
  const productsData = isSearching ? searchResults.data : data;
  const isProductsLoading = isSearching ? searchResults.isLoading : isLoading;
  const productsError = isSearching ? searchResults.error : error;

  // Parse category from slug if present
  useEffect(() => {
    if (categoryParam) {
      // In a real app, you'd fetch category by slug to get ID
      // For now, we'll skip this since we need category ID
    }
  }, [categoryParam]);

  // Update URL with current filters
  const updateURL = (updates: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(searchParams);

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleCategoryToggle = (toggledSlug: string) => {
    const isCurrentlySelected = selectedCategories.includes(toggledSlug);
    // Reset only price range when changing category
    setPriceRange([priceMin, priceMax]);
    updateURL({ 
      category: isCurrentlySelected ? undefined : toggledSlug,
      priceMin: undefined,
      priceMax: undefined,
      page: undefined 
    });
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    updateURL({ 
      priceMin: range[0] > priceMin ? range[0] : undefined, 
      priceMax: range[1] < priceMax ? range[1] : undefined, 
      page: undefined 
    });
  };

  const handleSortChange = (value: string) => {
    updateURL({ sort: value, page: undefined });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setPriceRange([priceMin, priceMax]);
    // Reset all filters including search query
    router.push(pathname);
  };

  const products = productsData?.products || [];
  const totalPages = productsData?.totalPages || 1;
  const total = productsData?.total || 0;

  // Check if there are active filters
  const hasActiveFilters = 
    !!searchQuery ||
    selectedCategories.length > 0 || 
    priceRange[0] > priceMin || 
    priceRange[1] < priceMax || 
    sortParam !== 'createdAt_desc';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header - Only show if not searching */}
      {!isSearching && (
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Catalogo Prodotti</h1>
          <p className="text-muted-foreground">
            {total ? `${total} prodotti disponibili` : 'Esplora la nostra selezione'}
          </p>
        </div>
      )}

      <div className="flex gap-8">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <ProductFilters
              selectedCategories={selectedCategories}
              priceMin={priceMin}
              priceMax={priceMax}
              priceRange={priceRange}
              currentSort={sortParam}
              hasActiveFilters={hasActiveFilters}
              onCategoryToggle={handleCategoryToggle}
              onPriceRangeChange={handlePriceRangeChange}
              onReset={handleResetFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Mobile Filters Button */}
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="gap-2 lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtri
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto flex flex-col">
                <SheetHeader className="mb-6">
                  <SheetTitle>Filtri</SheetTitle>
                </SheetHeader>
                
                <div className="flex-1">
                  <ProductFilters
                    selectedCategories={selectedCategories}
                    priceMin={priceMin}
                    priceMax={priceMax}
                    priceRange={priceRange}
                    currentSort={sortParam}
                    hasActiveFilters={hasActiveFilters}
                    onCategoryToggle={handleCategoryToggle}
                    onPriceRangeChange={handlePriceRangeChange}
                    onReset={handleResetFilters}
                    onClose={() => setIsMobileFiltersOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>

            {/* Sort */}
            <ProductSort currentSort={sortParam} onSortChange={handleSortChange} />
          </div>

          {/* Error State */}
          {productsError && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
              <p className="text-destructive">
                Si è verificato un errore durante il caricamento dei prodotti.
              </p>
            </div>
          )}

          {/* Search Results or Products Grid */}
          {isSearching ? (
            <SearchResults
              query={searchQuery}
              products={products}
              total={total}
              isLoading={isProductsLoading}
            />
          ) : (
            <ProductGrid products={products} isLoading={isProductsLoading} />
          )}

          {/* Pagination */}
          {!isProductsLoading && totalPages > 1 && (
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Caricamento...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
