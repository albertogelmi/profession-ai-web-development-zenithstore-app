'use client';

import Image from 'next/image';
import { Package } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface OrderItem {
  id: number;
  productCode: string;
  productName: string;
  productImage?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface OrderItemsListProps {
  items: OrderItem[];
}

export function OrderItemsList({ items }: OrderItemsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Prodotti Ordinati
        </CardTitle>
        <CardDescription>{items.length} articoli</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex gap-4">
                {/* Product Image */}
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h4 className="font-medium leading-tight">{item.productName}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Codice: {item.productCode}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Quantità: {item.quantity}
                    </span>
                    <span className="text-muted-foreground">
                      €{Number(item.unitPrice).toFixed(2)} cad.
                    </span>
                  </div>
                </div>

                {/* Total Price */}
                <div className="shrink-0 text-right">
                  <p className="font-semibold">€{Number(item.totalPrice).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
