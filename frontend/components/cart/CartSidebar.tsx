'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCart } from '@/hooks/useCart';
import { useUIStore } from '@/stores/uiStore';
import { useCreateCheckout } from '@/hooks/useCheckout';
import { useCartStockValidation } from '@/hooks/useCartStockValidation';
import { CartItem } from './CartItem';
import Link from 'next/link';
import { AlertCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { logger } from '@/lib/logger';

export function CartSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { items, itemCount, total, isEmpty, updateQuantity, removeItem } = useCart();
  const { isCartOpen, closeCart, openCart } = useUIStore();
  const createCheckoutMutation = useCreateCheckout();
  const { stockUpdates, isValidating } = useCartStockValidation();
  
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [unavailableProducts, setUnavailableProducts] = useState<Array<{
    productCode: string;
    requested: number;
    availableToSell: number;
  }>>([]);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const hasTriggeredAutoCheckout = useRef(false);

  // Perform checkout - create RESERVED order and navigate
  const performCheckout = useCallback(async (shouldCloseCart: boolean = true): Promise<boolean> => {
    setIsCreatingOrder(true);
    setUnavailableProducts([]);

    try {
      const checkoutResponse = await createCheckoutMutation.mutateAsync(items);

      if (!checkoutResponse.data.success) {
        // Handle insufficient stock
        if (checkoutResponse.data.unavailableProducts && checkoutResponse.data.unavailableProducts.length > 0) {
          setUnavailableProducts(checkoutResponse.data.unavailableProducts);
          setShowErrorDialog(true);
        }
        setIsCreatingOrder(false);
        return false;
      }

      // Order created successfully - navigate to checkout with orderId
      const orderId = checkoutResponse.data.orderId;
      setIsCreatingOrder(false);
      if (shouldCloseCart) {
        closeCart();
      }
      router.push(`/checkout?orderId=${orderId}`);
      return true;
    } catch (err: any) {
      logger.error('Checkout error:', err);
      
      // Handle 409 Conflict - Insufficient stock
      if (err.status === 409 && err.data?.data?.unavailableProducts) {
        const unavailable = err.data.data.unavailableProducts;
        setUnavailableProducts(unavailable);
        setShowErrorDialog(true);
      }
      
      setIsCreatingOrder(false);
      return false;
    }
  }, [items, createCheckoutMutation, closeCart, router]);

  // Handle checkout button click - Create RESERVED order before navigation
  const handleCheckout = useCallback(async () => {
    // Check authentication first - redirect to login if not authenticated
    if (!session) {
      closeCart();
      // Redirect to login with callback to current page and autoCheckout flag
      const currentUrl = pathname;
      router.push(`/login?callbackUrl=${encodeURIComponent(currentUrl)}&autoCheckout=true`);
      return;
    }

    await performCheckout(true);
  }, [session, closeCart, pathname, router, performCheckout]);

  // Auto-checkout after login (triggered by URL parameter)
  useEffect(() => {
    const autoCheckout = searchParams.get('autoCheckout');
    
    if (autoCheckout === 'true' && session && !isEmpty && !hasTriggeredAutoCheckout.current) {
      // Mark as triggered to prevent multiple executions
      hasTriggeredAutoCheckout.current = true;
      
      // Remove autoCheckout parameter from URL (clean URL)
      router.replace(pathname);
      
      // Perform checkout directly without opening cart first
      const executeAutoCheckout = async () => {
        const success = await performCheckout(false); // Don't close cart on auto-checkout
        
        // If checkout failed, open cart sidebar to show error modal
        if (!success) {
          openCart();
        }
      };
      
      executeAutoCheckout();
    }
  }, [searchParams, session, isEmpty, pathname, router, openCart, performCheckout]);

  // Handle cart update when products are unavailable
  const handleUpdateCart = () => {
    // Update cart based on unavailable products
    unavailableProducts.forEach((unavailable) => {
      if (unavailable.availableToSell === 0) {
        // Remove item if no stock available
        removeItem(unavailable.productCode);
      } else {
        // Update quantity to available amount
        updateQuantity(unavailable.productCode, unavailable.availableToSell);
      }
    });

    // Close dialog
    setShowErrorDialog(false);
    setUnavailableProducts([]);
  };

  // Get product name from cart by productCode
  const getProductName = (productCode: string) => {
    const item = items.find(i => i.productCode === productCode);
    return item?.productName || productCode;
  };

  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={closeCart}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="mb-6">
          <SheetTitle>
            Carrello ({itemCount})
          </SheetTitle>
          <SheetDescription>
            Gestisci i prodotti nel tuo carrello
          </SheetDescription>
        </SheetHeader>

        {/* Stock Validation Feedback */}
        {isValidating && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-2 text-sm text-blue-800">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Verifica disponibilità prodotti...</span>
          </div>
        )}

        {stockUpdates.length > 0 && (
          <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-amber-900 mb-1">
                  Disponibilità aggiornata
                </p>
                <p className="text-amber-700">
                  {stockUpdates.filter(u => u.quantityAdjusted).length > 0 ? (
                    <>
                      {stockUpdates.filter(u => u.quantityAdjusted).length} {stockUpdates.filter(u => u.quantityAdjusted).length === 1 ? 'prodotto ha' : 'prodotti hanno'} quantità ridotte per disponibilità limitata.
                    </>
                  ) : (
                    <>
                      Disponibilità di {stockUpdates.length} {stockUpdates.length === 1 ? 'prodotto aggiornata' : 'prodotti aggiornata'}.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
              <div className="rounded-full bg-muted p-8">
                <svg
                  className="h-16 w-16 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Il tuo carrello è vuoto
                </h3>
                <p className="text-sm text-muted-foreground">
                  Aggiungi prodotti per procedere con l'ordine
                </p>
              </div>
              <Button asChild onClick={closeCart}>
                <Link href="/products">Scopri i Prodotti</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem key={item.productCode} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {!isEmpty && (
          <div className="border-t pt-6 mt-6">
            <div className="space-y-4">
              {/* Subtotal */}
              <div className="flex items-center justify-between text-base">
                <span className="text-muted-foreground">Subtotale</span>
                <span className="font-medium">€{total.toFixed(2)}</span>
              </div>

              {/* Info */}
              <p className="text-xs text-muted-foreground">
                Spedizione e tasse calcolate al checkout
              </p>

              {/* Checkout Button */}
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
                disabled={isCreatingOrder}
              >
                {isCreatingOrder ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione ordine...
                  </>
                ) : (
                  'Vai al Checkout'
                )}
              </Button>

              {/* Continue Shopping */}
              <Button
                variant="outline"
                className="w-full"
                onClick={closeCart}
                disabled={isCreatingOrder}
              >
                Continua gli Acquisti
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>

      {/* Error Dialog for Unavailable Products */}
      <Dialog open={showErrorDialog} onOpenChange={(open) => {
        // Prevent closing by clicking outside or pressing ESC
        if (!open) return;
        setShowErrorDialog(open);
      }}>
        <DialogContent 
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <DialogTitle>Prodotti non disponibili</DialogTitle>
            </div>
            <DialogDescription>
              I seguenti prodotti non sono disponibili nelle quantità richieste.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <ul className="space-y-2 text-sm">
              {unavailableProducts.map((product) => (
                <li key={product.productCode} className="flex justify-between border-b pb-2">
                  <span className="font-medium">{getProductName(product.productCode)}</span>
                  <span className="text-muted-foreground">
                    Richiesti: <strong>{product.requested}</strong> • 
                    Disponibili: <strong className={product.availableToSell === 0 ? 'text-destructive' : 'text-orange-600'}>
                      {product.availableToSell}
                    </strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <DialogFooter>
            <Button onClick={handleUpdateCart} className="w-full sm:w-auto">
              Aggiorna Carrello
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
