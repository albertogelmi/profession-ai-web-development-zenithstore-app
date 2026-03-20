'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Package, ChevronRight, Calendar, Euro } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from './OrderStatusBadge';
import { Order } from '@/hooks/useCheckout';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const itemCount = order.items.length;
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">Ordine #{order.orderNumber}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(order.createdAt), "d MMMM yyyy 'alle' HH:mm", {
                locale: it,
              })}
            </CardDescription>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>
              {itemCount} {itemCount === 1 ? 'prodotto' : 'prodotti'} ({totalItems}{' '}
              {totalItems === 1 ? 'articolo' : 'articoli'})
            </span>
          </div>
          
          {/* First 2-3 products preview */}
          <div className="space-y-1">
            {order.items.slice(0, 3).map((item) => (
              <p key={item.id} className="text-sm truncate">
                {item.quantity}x {item.productName}
              </p>
            ))}
            {order.items.length > 3 && (
              <p className="text-sm text-muted-foreground">
                +{order.items.length - 3} altri prodotti
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Total and Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Totale</p>
              <p className="text-lg font-bold">€{Number(order.totalAmount).toFixed(2)}</p>
            </div>
          </div>
          
          <Button asChild variant="outline" size="sm">
            <Link href={`/orders/${order.orderId}`}>
              Vedi dettaglio
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
