'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';

interface CategoryCardProps {
  category: {
    id: number;
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    productCount?: number;
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const iconName = category.icon as keyof typeof Icons;
  let IconComponent: LucideIcon = Icons.Package;
  
  if (iconName && typeof Icons[iconName] === 'function') {
    IconComponent = Icons[iconName] as LucideIcon;
  }

  return (
    <Link href={`/categories/${category.slug}`}>
      <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <IconComponent className="h-6 w-6" />
            </div>
            {category.productCount !== undefined && (
              <Badge variant="secondary">
                {category.productCount} {category.productCount === 1 ? 'prodotto' : 'prodotti'}
              </Badge>
            )}
          </div>
          <CardTitle className="mt-4 group-hover:text-primary transition-colors">
            {category.name}
          </CardTitle>
          {category.description && (
            <CardDescription className="line-clamp-2">
              {category.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            Esplora
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
