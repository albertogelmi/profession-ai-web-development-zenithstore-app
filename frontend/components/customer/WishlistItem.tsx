'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { WishlistItem as WishlistItemType } from '@/stores/wishlistStore';
import { useCart } from '@/hooks/useCart';
import { useRemoveFromWishlist } from '@/hooks/useWishlist';
import { useUIStore } from '@/stores/uiStore';
import { useState } from 'react';
import { getProductStock } from '@/lib/product';

interface WishlistItemProps {
  item: WishlistItemType;
  compact?: boolean;
}

export function WishlistItem({ item, compact = false }: WishlistItemProps) {
  const { product } = item;
  const { addItem, hasItem } = useCart();
  const { openCart } = useUIStore();
  const removeFromWishlist = useRemoveFromWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const actualStock = getProductStock(product);
  const isInStock = actualStock > 0;
  const isInCart = hasItem(product.productCode);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isInStock || isInCart) return;
    
    setIsAddingToCart(true);
    try {
      addItem({
        productCode: product.productCode,
        productName: product.name,
        price: Number(product.price),
        quantity: 1,
        imageUrl: product.imageUrl,
        maxQuantity: actualStock, // availableQuantity - reservedQuantity - safetyStock
      });
      
      openCart();
    } finally {
      setTimeout(() => setIsAddingToCart(false), 500);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    await removeFromWishlist.mutateAsync(product.productCode);
  };

  return (
    <Link href={`/products/${product.productCode}`} className="group block h-full">
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
          
          {/* Remove Button */}
          <button
            onClick={handleRemove}
            disabled={removeFromWishlist.isPending}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-2 opacity-0 backdrop-blur-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 disabled:opacity-50"
            aria-label="Remove from wishlist"
          >
            <Heart className="h-4 w-4 fill-current text-red-500" />
          </button>

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
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {product.description}
            </p>
          )}
        </CardHeader>

        {/* Price and Button Section */}
        <div className="mt-auto">
          <CardContent className={`flex items-center gap-4 ${compact ? 'px-4 pb-2' : 'px-6 pb-4'}`}>
            {/* Price */}
            <div className="flex-1">
              <p className="text-2xl font-bold">
                €{product.price.toFixed(2)}
              </p>
            </div>

            {/* Stock Badge */}
            {isInStock && (
              <Badge variant="outline" className="border-success text-success">
                Disponibile
              </Badge>
            )}
          </CardContent>

          {/* Action Buttons */}
          <CardFooter className={`flex gap-2 ${compact ? 'p-4 pt-0' : 'p-6 pt-0'}`}>
            <Button
              className="flex-1 gap-2"
              onClick={handleAddToCart}
              disabled={!isInStock || isInCart || isAddingToCart}
              variant={isInCart ? 'secondary' : 'default'}
            >
              <ShoppingCart className="h-4 w-4" />
              {isInCart ? 'Nel Carrello' : isAddingToCart ? 'Aggiunta...' : 'Aggiungi'}
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleRemove}
              disabled={removeFromWishlist.isPending}
              className="hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Remove from wishlist"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardFooter>
        </div>
      </Card>
    </Link>
  );
}
