'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { useUIStore } from '@/stores/uiStore';
import { useIsInWishlist, useToggleWishlist } from '@/hooks/useWishlist';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { getProductStock } from '@/lib/product';
import { logger } from '@/lib/logger';

interface ProductCardProps {
  product: Product;
  compact?: boolean;
}

export function ProductCard({ product, compact = false }: ProductCardProps) {
  const { data: session } = useSession();
  const { addItem, hasItem } = useCart();
  const { openCart } = useUIStore();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const isInWishlist = useIsInWishlist(product.code);
  const { toggle: toggleWishlist, isLoading: isTogglingWishlist } = useToggleWishlist();

  const actualStock = getProductStock(product);
  const isInStock = actualStock > 0;
  const isInCart = hasItem(product.code);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isInStock || isInCart) return;
    
    setIsAddingToCart(true);
    try {
      addItem({
        productCode: product.code,
        productName: product.name,
        price: Number(product.price),
        quantity: 1,
        imageUrl: product.imageUrl,
        maxQuantity: actualStock, // availableQuantity - reservedQuantity - safetyStock
      });
      
      // Open cart sidebar
      openCart();
    } finally {
      setTimeout(() => setIsAddingToCart(false), 500);
    }
  };

  const handleAddToWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await toggleWishlist(product.code);
    } catch (error) {
      logger.error('Error toggling wishlist:', error);
    }
  };

  return (
    <Link href={`/products/${product.code}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
        {/* Product Image */}
        <div className={`relative overflow-hidden bg-muted ${compact ? 'aspect-square' : 'aspect-[4/3]'}`}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
            </div>
          )}
          
          {/* Wishlist Button */}
          {session && (
            <button
              onClick={handleAddToWishlist}
              disabled={isTogglingWishlist}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-2 opacity-0 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100 disabled:opacity-50"
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${
                  isInWishlist 
                    ? 'fill-current text-red-500' 
                    : 'hover:fill-current hover:text-red-500'
                }`} 
              />
            </button>
          )}

          {/* Stock Badge */}
          {!isInStock && (
            <Badge
              variant="secondary"
              className="absolute left-2 top-2 bg-background/80 backdrop-blur-sm"
            >
              Esaurito
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <CardHeader className={compact ? 'p-4' : 'p-6'}>
          {product.categoryName && (
            <p className="mb-1 text-xs text-muted-foreground">
              {product.categoryName}
            </p>
          )}
          <h3 className="line-clamp-2 font-semibold group-hover:text-primary">
            {product.name}
          </h3>
          {!compact && product.description && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {product.description}
            </p>
          )}
        </CardHeader>

        {/* Price and Button Section - pushed to bottom */}
        <div className="mt-auto">
          <CardContent className={`flex items-center gap-4 ${compact ? 'px-4 pb-2' : 'px-6 pb-4'}`}>
          {/* Price */}
          <div className="flex-1">
            <p className="text-2xl font-bold">
              €{typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(String(product.price || 0)).toFixed(2)}
            </p>
          </div>

          {/* Rating and Reviews */}
          {product.averageRating !== undefined && product.reviewCount ? (
            <div className="flex items-center gap-1 text-sm">
              <span className="text-yellow-500">★</span>
              <span className="font-medium">{product.averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">({product.reviewCount})</span>
            </div>
          ) : null}

          {/* Stock Badge (alternative position) */}
          {isInStock && (
            <Badge variant="outline" className="border-success text-success">
              Disponibile
            </Badge>
          )}
        </CardContent>

          {/* Add to Cart Button */}
          <CardFooter className={compact ? 'p-4 pt-0' : 'p-6 pt-0'}>
            <Button
              className="w-full gap-2"
              onClick={handleAddToCart}
              disabled={!isInStock || isInCart || isAddingToCart}
              variant={isInCart ? 'secondary' : 'default'}
            >
              <ShoppingCart className="h-4 w-4" />
              {isInCart ? 'Nel Carrello' : isAddingToCart ? 'Aggiunta...' : 'Aggiungi al Carrello'}
            </Button>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}
