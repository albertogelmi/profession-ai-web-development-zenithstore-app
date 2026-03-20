'use client';

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/hooks/useCart';

export function OrderSummary() {
  const { items, total, itemCount } = useCart();

  const shippingCost = total > 50 ? 0 : 5.99;
  const taxRate = 0.22; // 22% IVA
  const taxAmount = total * taxRate;
  const grandTotal = total + shippingCost + taxAmount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riepilogo Ordine</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items List */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.productCode} className="flex gap-3">
              {/* Product Image */}
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded border">
                <Image
                  src={item.imageUrl || '/placeholder-product.svg'}
                  alt={item.productName}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>

              {/* Product Info */}
              <div className="flex flex-1 gap-3">
                <div className="flex-1 flex flex-col justify-between md:justify-center lg:justify-between">
                  <p className="text-sm font-medium line-clamp-3 md:line-clamp-1 lg:line-clamp-3 mb-1">
                    {item.productName}
                  </p>
                  <div className="flex flex-col lg:flex-col">
                    <p className="text-xs text-muted-foreground mb-1 lg:mb-1">
                      Quantità: {item.quantity}
                    </p>
                    <p className="text-sm font-semibold md:hidden lg:block text-right">
                      €{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex lg:hidden items-center">
                  <p className="text-sm font-semibold">
                    €{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Pricing Breakdown */}
        <div className="space-y-2">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Subtotale ({itemCount} {itemCount === 1 ? 'articolo' : 'articoli'})
            </span>
            <span className="font-medium">€{total.toFixed(2)}</span>
          </div>

          {/* Shipping */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Spedizione</span>
            <span className="font-medium">
              {shippingCost === 0 ? (
                <span className="text-green-600">GRATIS</span>
              ) : (
                `€${shippingCost.toFixed(2)}`
              )}
            </span>
          </div>

          {/* Free shipping notice */}
          {shippingCost > 0 && (
            <p className="text-xs text-muted-foreground">
              Spedizione gratuita per ordini superiori a €50
            </p>
          )}

          {/* Tax */}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA (22%)</span>
            <span className="font-medium">€{taxAmount.toFixed(2)}</span>
          </div>
        </div>

        <Separator />

        {/* Grand Total */}
        <div className="flex justify-between">
          <span className="text-base font-semibold">Totale</span>
          <span className="text-lg font-bold">€{grandTotal.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
