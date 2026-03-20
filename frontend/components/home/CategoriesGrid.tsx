'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Laptop, 
  Smartphone, 
  Headphones, 
  Watch, 
  Home as HomeIcon, 
  ShoppingBag,
  ArrowRight
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Icon mapping for categories
const categoryIcons: Record<string, LucideIcon> = {
  electronics: Laptop,
  smartphone: Smartphone,
  audio: Headphones,
  watches: Watch,
  home: HomeIcon,
  fashion: ShoppingBag,
};

function getIconForCategory(name: string): LucideIcon {
  const normalized = name.toLowerCase();
  for (const [key, Icon] of Object.entries(categoryIcons)) {
    if (normalized.includes(key)) {
      return Icon;
    }
  }
  return ShoppingBag; // Default icon
}

function CategorySkeleton() {
  return (
    <Card className="group cursor-pointer transition-all hover:shadow-lg">
      <CardContent className="flex flex-col items-center gap-4 p-6">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-16" />
      </CardContent>
    </Card>
  );
}

export function CategoriesGrid() {
  const { data, isLoading, error } = useCategories();

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-muted-foreground">
              Impossibile caricare le categorie. Riprova più tardi.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const categories = data?.slice(0, 6) || [];

  return (
    <section className="py-16 sm:py-20">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Esplora per Categoria
          </h2>
          <p className="text-lg text-muted-foreground">
            Trova quello che cerchi nelle nostre categorie più popolari
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-6">
          {isLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <CategorySkeleton key={i} />
              ))}
            </>
          ) : (
            categories.map((category) => {
              const Icon = getIconForCategory(category.name);
              return (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="group"
                >
                  <Card className="transition-all hover:shadow-lg hover:border-primary/50">
                    <CardContent className="flex flex-col items-center gap-3 p-6 sm:gap-4">
                      {/* Icon */}
                      <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                        <Icon className="h-8 w-8 text-primary" />
                      </div>
                      
                      {/* Category Name */}
                      <h3 className="text-center text-sm font-semibold sm:text-base">
                        {category.name}
                      </h3>
                      
                      {/* Arrow */}
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })
          )}
        </div>

        {/* View All Link */}
        {!isLoading && categories.length > 0 && (
          <div className="mt-10 text-center">
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Vedi tutte le categorie
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
