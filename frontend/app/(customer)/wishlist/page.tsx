'use client';

import { useWishlist } from '@/hooks/useWishlist';
import { WishlistItem } from '@/components/customer/WishlistItem';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function WishlistPage() {
  const { data: wishlistItems, isLoading, error } = useWishlist();

  if (isLoading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Errore nel caricamento della wishlist. Riprova più tardi.
        </AlertDescription>
      </Alert>
    );
  }

  const hasItems = wishlistItems && wishlistItems.length > 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">La mia wishlist</h1>
        <p className="text-muted-foreground mt-2">
          {hasItems
            ? `${wishlistItems.length} ${wishlistItems.length === 1 ? 'prodotto salvato' : 'prodotti salvati'}`
            : 'Salva i prodotti che ti interessano'}
        </p>
      </div>

      {/* Wishlist Grid or Empty State */}
      {hasItems ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistItems.map((item) => (
            <WishlistItem key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Heart className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">La tua wishlist è vuota</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Aggiungi i prodotti che ti interessano alla wishlist per ritrovarli
            facilmente in seguito. Sarai anche notificato quando andranno in offerta!
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/products">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Scopri i prodotti
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/categories">Esplora categorie</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
