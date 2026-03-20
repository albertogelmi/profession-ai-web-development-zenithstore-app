'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/useCart';
import { useUIStore } from '@/stores/uiStore';
import { ShoppingCart, Heart, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getProductStock } from '@/lib/product';
import { useIsInWishlist, useToggleWishlist } from '@/hooks/useWishlist';
import { logger } from '@/lib/logger';

interface ProductActionsProps {
  product: {
    productCode?: string;
    code?: string;
    name: string;
    price: number;
    imageUrl?: string;
    stockQuantity?: number;
    availableQuantity?: number;
    reservedQuantity?: number;
    safetyStock?: number;
  };
}

export function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { addItem, hasItem, getItem } = useCart();
  const { openCart } = useUIStore();
  
  const actualStock = getProductStock(product);
  const productCode = product.productCode || product.code || '';
  const isInStock = actualStock > 0;
  
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  // Prevent hydration mismatch for cart state (uses localStorage via Zustand persist)
  const [isMounted, setIsMounted] = useState(false);
  const isInCartRaw = hasItem(productCode);
  const cartItemRaw = getItem(productCode);
  // Only show cart state after component is mounted
  const isInCart = isMounted ? isInCartRaw : false;
  const cartItem = isMounted ? cartItemRaw : undefined;
  
  // Prevent hydration mismatch for wishlist state (uses localStorage)
  const isInWishlistRaw = useIsInWishlist(productCode);
  // Only show wishlist state if user is logged in AND component is mounted
  const isInWishlist = session && isMounted ? isInWishlistRaw : false;
  const { toggle: toggleWishlist, isLoading: isTogglingWishlist } = useToggleWishlist();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleQuantityChange = (value: string) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0 && num <= actualStock) {
      setQuantity(num);
    }
  };

  const handleIncrement = () => {
    if (quantity < actualStock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (!isInStock) return;

    setIsAddingToCart(true);
    try {
      addItem({
        productCode: productCode,
        productName: product.name,
        price: Number(product.price),
        quantity: quantity,
        imageUrl: product.imageUrl,
        maxQuantity: actualStock, // availableQuantity - reservedQuantity - safetyStock
      });

      // Open cart sidebar to show added item
      openCart();

      // Show success feedback
      setTimeout(() => {
        setIsAddingToCart(false);
      }, 500);
    } catch (error) {
      logger.error('Failed to add to cart:', error);
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    // Require authentication for wishlist
    if (!session) {
      router.push('/login?redirect=/products/' + productCode);
      return;
    }

    await toggleWishlist(productCode);
  };

  return (
    <div className="space-y-6">
      {/* Quantity Selector */}
      {isInStock && (
        <div className="space-y-2">
          <Label htmlFor="quantity">Quantità</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              aria-label="Diminuisci quantità"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={actualStock}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-20 text-center"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleIncrement}
              disabled={quantity >= actualStock}
              aria-label="Aumenta quantità"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {actualStock} disponibili
            </span>
          </div>
        </div>
      )}

      {/* Add to Cart Button */}
      <Button
        size="lg"
        className="w-full gap-2"
        onClick={handleAddToCart}
        disabled={!isInStock || isAddingToCart}
      >
        <ShoppingCart className="h-5 w-5" />
        {!isInStock
          ? 'Non Disponibile'
          : isAddingToCart
          ? 'Aggiunta...'
          : isInCart
          ? `Aggiungi Altri (${cartItem?.quantity} nel carrello)`
          : 'Aggiungi al Carrello'}
      </Button>

      {/* Add to Wishlist Button */}
      <Button
        size="lg"
        variant="outline"
        className="w-full gap-2"
        onClick={handleAddToWishlist}
        disabled={isTogglingWishlist}
      >
        <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-current text-red-500' : ''}`} />
        {isTogglingWishlist
          ? 'Attendere...'
          : isInWishlist
          ? 'Rimuovi dalla Lista Desideri'
          : 'Aggiungi alla Lista Desideri'}
      </Button>

      {/* Product Info */}
      <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Spedizione:</span>
          <span className="font-medium">Gratuita sopra €50</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Consegna stimata:</span>
          <span className="font-medium">2-3 giorni lavorativi</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Resi:</span>
          <span className="font-medium">30 giorni</span>
        </div>
      </div>
    </div>
  );
}
