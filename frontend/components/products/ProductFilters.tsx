'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductFiltersProps {
  selectedCategories: string[];
  priceMin: number;
  priceMax: number;
  priceRange: [number, number];
  currentSort?: string;
  hideCategories?: boolean;
  hasActiveFilters?: boolean;
  onCategoryToggle: (categorySlug: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onReset: () => void;
  onClose?: () => void;
}

export function ProductFilters({
  selectedCategories,
  priceMin,
  priceMax,
  priceRange,
  currentSort,
  hideCategories = false,
  hasActiveFilters: hasActiveFiltersProp,
  onCategoryToggle,
  onPriceRangeChange,
  onReset,
  onClose,
}: ProductFiltersProps) {
  const { data: categories, isLoading } = useCategories();

  const hasActiveFilters = hasActiveFiltersProp ?? (
    selectedCategories.length > 0 || 
    priceRange[0] !== priceMin || 
    priceRange[1] !== priceMax ||
    (currentSort && currentSort !== 'createdAt_desc')
  );

  return (
    <div className="space-y-6">
      {/* Categories Filter */}
      {!hideCategories && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </>
            ) : categories && categories.length > 0 ? (
              categories.map((category) => (
                <div key={category.slug} className="flex items-center space-x-2">
                  <Checkbox
                    id={`category-${category.slug}`}
                    checked={selectedCategories.includes(category.slug)}
                    onCheckedChange={() => onCategoryToggle(category.slug)}
                  />
                  <Label
                    htmlFor={`category-${category.slug}`}
                    className="cursor-pointer text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {category.name}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nessuna categoria disponibile</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Price Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fascia di Prezzo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Slider
              min={priceMin}
              max={priceMax}
              step={1}
              value={priceRange}
              onValueChange={(value) => onPriceRangeChange(value as [number, number])}
              className="w-full"
            />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>€{priceRange[0]}</span>
              <span>€{priceRange[1]}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reset Button */}
      {hasActiveFilters && (
        <Button variant="outline" className="w-full" onClick={onReset}>
          Reset Filtri
        </Button>
      )}
    </div>
  );
}
