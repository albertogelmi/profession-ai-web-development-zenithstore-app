import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { StockBadge } from './StockBadge';
import { Separator } from '@/components/ui/separator';
import { getProductStock } from '@/lib/product';

interface ProductInfoProps {
  product: {
    productCode?: string;
    code?: string;
    name: string;
    description?: string;
    price: number;
    categoryName?: string;
    categorySlug?: string;
    stockQuantity?: number;
    availableQuantity?: number;
    reservedQuantity?: number;
    safetyStock?: number;
    averageRating?: number;
    reviewCount?: number;
  };
  specifications?: Record<string, string>;
}

export function ProductInfo({ product, specifications }: ProductInfoProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        {product.categoryName && product.categorySlug ? (
          <>
            <Link href={`/products?category=${product.categorySlug}`} className="hover:text-foreground">
              {product.categoryName}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        ) : (
          <>
            <Link href="/products" className="hover:text-foreground">
              Prodotti
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Product Name */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Codice: {product.productCode || product.code}</p>
      </div>

      {/* Rating */}
      {product.averageRating && product.reviewCount ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(product.averageRating!)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium">{product.averageRating.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({product.reviewCount} recensioni)</span>
        </div>
      ) : null}

      <Separator />

      {/* Price and Stock */}
      <div className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold">€{typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(String(product.price || 0)).toFixed(2)}</span>
          <span className="text-sm text-muted-foreground">IVA inclusa</span>
        </div>
        <StockBadge quantity={getProductStock(product)} />
      </div>

      <Separator />

      {/* Description */}
      {product.description && (
        <div>
          <h2 className="mb-2 text-lg font-semibold">Descrizione</h2>
          <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Specifications */}
      {specifications && Object.keys(specifications).length > 0 && (
        <>
          <Separator />
          <div>
            <h2 className="mb-3 text-lg font-semibold">Specifiche Tecniche</h2>
            <dl className="grid gap-2">
              {Object.entries(specifications).map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-2 gap-4 rounded-md bg-muted/50 px-4 py-2 text-sm"
                >
                  <dt className="font-medium">{key}</dt>
                  <dd className="text-muted-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      )}
    </div>
  );
}
