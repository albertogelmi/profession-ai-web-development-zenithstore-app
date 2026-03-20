'use client';

import { use } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { useOrder } from '@/hooks/useCheckout';
import { OrderStatusBadge } from '@/components/customer/OrderStatusBadge';
import { OrderTimeline } from '@/components/customer/OrderTimeline';
import { OrderItemsList } from '@/components/customer/OrderItemsList';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  MapPin,
  CreditCard,
  Calendar,
  Package,
  Truck,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default function OrderDetailPage({ params }: PageProps) {
  const { orderId } = use(params);
  const { data: order, isLoading, error } = useOrder(orderId);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Torna agli ordini
          </Link>
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            Ordine non trovato o errore nel caricamento.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get shipping address
  const shippingData = order.shippingAddress;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Torna agli ordini
        </Link>
      </Button>

      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Ordine #{order.orderNumber}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground mt-2">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(order.createdAt), "d MMMM yyyy 'alle' HH:mm", {
                locale: it,
              })}
            </span>
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Timeline */}
          <OrderTimeline currentStatus={order.status} createdAt={order.createdAt} />

          {/* Order Items */}
          <OrderItemsList items={order.items} />
        </div>

        {/* Sidebar - Right Column (1/3) */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Riepilogo Ordine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotale</span>
                  <span>
                    €
                    {order.items
                      .reduce((sum, item) => sum + Number(item.totalPrice), 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spedizione</span>
                  <span>Inclusa</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Totale</span>
                  <span className="text-lg">€{Number(order.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Indirizzo di Spedizione
              </CardTitle>
            </CardHeader>
            <CardContent>
              {shippingData ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">
                    {shippingData.firstName} {shippingData.lastName}
                  </p>
                  <p>{shippingData.addressLine}</p>
                  <p>
                    {shippingData.postalCode} {shippingData.city}
                  </p>
                  {shippingData.province && <p>{shippingData.province}</p>}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Indirizzo non disponibile
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Metodo di Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm capitalize">
                {order.paymentMethod.replace('_', ' ')}
              </p>
            </CardContent>
          </Card>

          {/* Tracking Info (if available) */}
          {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Le informazioni di tracking saranno disponibili a breve
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
