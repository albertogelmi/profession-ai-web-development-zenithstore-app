'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Order } from '@/hooks/useCheckout';

interface OrderConfirmationProps {
  order: Order;
}

export function OrderConfirmation({ order }: OrderConfirmationProps) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Success Icon */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold">Ordine Confermato!</h2>
          <p className="text-muted-foreground">
            Grazie per il tuo acquisto. Il tuo ordine è stato registrato con successo.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Details */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Numero Ordine</span>
                <span className="font-mono font-semibold">{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data</span>
                <span className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Totale</span>
                <span className="text-lg font-bold">€{Number(order.totalAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Metodo Pagamento</span>
                <span className="font-medium capitalize">
                  {order.paymentMethod === 'card'
                    ? 'Carta di Credito'
                    : 'PayPal'}
                </span>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-2">
            <h3 className="font-semibold">Cosa succede ora?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>Riceverai un'email di conferma con i dettagli del tuo ordine</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>Il tuo ordine verrà processato entro 24 ore</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>Riceverai una notifica quando il pacco verrà spedito</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">✓</span>
                <span>Potrai tracciare la spedizione dalla sezione "I miei ordini"</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button asChild className="flex-1" size="lg">
              <Link href={`/orders/${order.orderId}`}>Visualizza Ordine</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1" size="lg">
              <Link href="/products">Continua gli Acquisti</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Hai bisogno di aiuto?{' '}
            <Link href="/support" className="font-medium text-primary hover:underline">
              Contatta il nostro supporto
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
