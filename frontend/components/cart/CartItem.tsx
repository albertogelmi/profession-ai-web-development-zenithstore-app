'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { CartItem as CartItemType } from '@/stores/cartStore';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { incrementQuantity, decrementQuantity, removeItem } = useCart();

  const subtotal = item.price * item.quantity;

  return (
    <div className="flex gap-4">
      {/* Product Image */}
      <Link
        href={`/products/${item.productCode}`}
        className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border"
      >
        <Image
          src={item.imageUrl || '/placeholder-product.svg'}
          alt={item.productName}
          fill
          className="object-cover"
          sizes="96px"
        />
      </Link>

      {/* Product Info */}
      <div className="flex flex-1 flex-col">
        {/* Name and Remove */}
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.productCode}`}
            className="text-sm font-medium line-clamp-2 hover:underline"
          >
            {item.productName}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => removeItem(item.productCode)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>

        {/* Price */}
        <p className="mt-1 text-sm text-muted-foreground">
          €{item.price.toFixed(2)}
        </p>

        {/* Quantity Controls and Subtotal */}
        <div className="mt-auto flex items-center justify-between">
          {/* Quantity Selector */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => decrementQuantity(item.productCode)}
              disabled={item.quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-8 text-center text-sm font-medium">
              {item.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => incrementQuantity(item.productCode)}
              disabled={item.quantity >= (item.maxQuantity ?? 999)}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Subtotal */}
          <p className="text-sm font-semibold">€{subtotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
