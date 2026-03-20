'use client';

import { useState } from 'react';
import { useOrders } from '@/hooks/useCheckout';
import { OrderCard } from '@/components/customer/OrderCard';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Package, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function OrdersPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const limit = 10;

  const { data, isLoading, error } = useOrders(currentPage, limit, statusFilter);

  // Reset to page 1 when filter changes
  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
  };

  const orders = data?.data.items || [];
  const totalPages = data?.data.totalPages || 1;

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Errore nel caricamento degli ordini. Riprova più tardi.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">I miei ordini</h1>
        <p className="text-muted-foreground mt-2">
          Visualizza e gestisci i tuoi ordini
        </p>
      </div>

      {/* Filters */}
      {data?.data.items && data.data.items.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Stato:</span>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tutti gli ordini" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli ordini</SelectItem>
                <SelectItem value="NEW">Nuovo</SelectItem>
                <SelectItem value="PROCESSING">In Elaborazione</SelectItem>
                <SelectItem value="SHIPPING">In Spedizione</SelectItem>
                <SelectItem value="SHIPPED">Spedito</SelectItem>
                <SelectItem value="DELIVERED">Consegnato</SelectItem>
                <SelectItem value="CANCELLED">Annullato</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {data.data.total} {data.data.total === 1 ? 'ordine' : 'ordini'}
            {statusFilter !== 'all' && ' con questo stato'}
          </div>
        </div>
      )}

      {/* Orders List or Empty State */}
      {!data?.data.items || data.data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Nessun ordine</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Non hai ancora effettuato ordini. Inizia a fare shopping e trova i
            prodotti perfetti per te!
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Inizia a fare shopping
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/categories">Esplora categorie</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Orders Grid */}
          <div className="grid gap-4">
            {orders.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Nessun ordine trovato con lo stato selezionato.
                </AlertDescription>
              </Alert>
            ) : (
              orders.map((order) => <OrderCard key={order.orderId} order={order} />)
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Precedente
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {currentPage} di {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Successiva
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
