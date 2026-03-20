'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { ShippingForm, ShippingFormData } from '@/components/checkout/ShippingForm';
import { PaymentForm, PaymentFormData } from '@/components/checkout/PaymentForm';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';
import { useCart } from '@/hooks/useCart';
import { useAddShippingAddress, useInitiatePayment, usePaymentListener, Order } from '@/hooks/useCheckout';
import { PageLoader } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { logger } from '@/lib/logger';

type CheckoutStep = 'shipping' | 'payment' | 'confirmation';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, isEmpty, clearCart, updateQuantity, removeItem } = useCart();
  const addShippingMutation = useAddShippingAddress();
  const initiatePaymentMutation = useInitiatePayment();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  
  // Get orderId from URL query params (passed from CartSidebar after order creation)
  const orderIdParam = searchParams.get('orderId');
  const orderId = orderIdParam ? parseInt(orderIdParam, 10) : null;

  // Listen for payment completion via WebSocket
  usePaymentListener(
    orderId,
    (data) => {
      logger.debug('Payment completed event received:', data);
      setIsPaymentProcessing(false);
      
      // Create completed order object
      const completedOrderData: Order = {
        orderId: data.orderId,
        orderNumber: `#ZENITH-${data.orderId.toString().padStart(6, '0')}`,
        customerId: data.customerId,
        status: 'NEW',
        totalAmount: data.totalAmount,
        shippingAddress: shippingData ? {
          firstName: shippingData.firstName,
          lastName: shippingData.lastName,
          addressLine: shippingData.addressLine,
          city: shippingData.city,
          postalCode: shippingData.postalCode,
          province: shippingData.province,
        } : undefined,
        paymentMethod: paymentMethod || 'card',
        createdAt: data.paymentDate || new Date().toISOString(),
        items: items.map(item => ({
          id: 0,
          productCode: item.productCode,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })),
      };
      
      setCompletedOrder(completedOrderData);
      setCurrentStep('confirmation');
      clearCart();
    },
    isPaymentProcessing
  );

  // Redirect to cart if no orderId
  useEffect(() => {
    if (!orderId && !completedOrder) {
      router.push('/cart');
    }
  }, [orderId, completedOrder, router]);

  // Show loader if redirecting
  if (!orderId && !completedOrder) {
    return <PageLoader />;
  }

  // Handle shipping form submission
  const handleShippingSubmit = async (data: ShippingFormData) => {
    if (!orderId) {
      logger.error('Errore: orderId mancante');
      setCheckoutError('Ordine non trovato. Ricarica la pagina e riprova.');
      return;
    }

    setCheckoutError(null);

    try {
      // Add shipping address to RESERVED order
      await addShippingMutation.mutateAsync({
        orderId,
        shippingAddress: {
          firstName: data.firstName,
          lastName: data.lastName,
          addressLine: data.addressLine,
          city: data.city,
          postalCode: data.postalCode,
          province: data.province,
        },
      });

      // Save shipping data and proceed to payment
      setShippingData(data);
      setCurrentStep('payment');
    } catch (err: any) {
      logger.error('Shipping address error:', err);
      setCheckoutError('Errore durante il salvataggio dell\'indirizzo. Riprova.');
    }
  };

  // Handle payment form submission
  const handlePaymentSubmit = async (paymentData: PaymentFormData) => {
    if (!orderId) {
      logger.error('Errore: orderId mancante');
      setCheckoutError('Ordine non trovato. Ricarica la pagina e riprova.');
      setShowErrorDialog(true);
      return;
    }

    if (!shippingData) {
      logger.error('Errore: dati di spedizione mancanti');
      setCurrentStep('shipping');
      return;
    }

    setCheckoutError(null);
    setPaymentMethod(paymentData.paymentMethod);
    setIsPaymentProcessing(true);

    try {
      logger.debug('Initiating payment for order:', orderId);
      
      // Call backend API to initiate payment
      const response = await initiatePaymentMutation.mutateAsync({
        orderId,
        paymentMethod: paymentData.paymentMethod,
      });

      logger.debug('Payment initiated successfully:', response);
      logger.debug('Waiting for payment confirmation from gateway...');
      
      // Save transaction ID for test simulation
      if (response.data?.transactionId) {
        setTransactionId(response.data.transactionId);
      }
      
      // The payment processing modal will stay open until:
      // 1. WebSocket receives payment confirmation (handled by usePaymentListener)
      // 2. User cancels or timeout occurs
      
    } catch (err: any) {
      logger.error('Payment initiation error:', err);
      setIsPaymentProcessing(false);
      setCheckoutError(
        err?.response?.data?.message || 
        err?.message || 
        'Errore durante l\'avvio del pagamento. Riprova.'
      );
      setShowErrorDialog(true);
    }
  };

  // Handle back to shipping
  const handleBackToShipping = () => {
    setCurrentStep('shipping');
  };

  // Open test interface to simulate payment completion (for testing only)
  const handleSimulatePayment = () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    window.open(`${backendUrl}/user-interface`, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Checkout</h1>
        {currentStep !== 'confirmation' && (
          <p className="mt-2 text-muted-foreground">
            Completa il tuo ordine in pochi semplici passaggi
          </p>
        )}
      </div>

      {/* Steps Indicator (not shown in confirmation) */}
      {currentStep !== 'confirmation' && (
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {/* Step 1 */}
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  currentStep === 'shipping'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                1
              </div>
              <span className="hidden text-sm font-medium sm:inline">Spedizione</span>
            </div>

            {/* Divider */}
            <div className="h-0.5 w-12 bg-muted" />

            {/* Step 2 */}
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  currentStep === 'payment'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                2
              </div>
              <span className="hidden text-sm font-medium sm:inline">Pagamento</span>
            </div>

            {/* Divider */}
            <div className="h-0.5 w-12 bg-muted" />

            {/* Step 3 */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                3
              </div>
              <span className="hidden text-sm font-medium text-muted-foreground sm:inline">
                Conferma
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {currentStep === 'shipping' && (
            <ShippingForm
              onSubmit={handleShippingSubmit}
              defaultValues={shippingData || undefined}
              isLoading={addShippingMutation.isPending}
            />
          )}

          {currentStep === 'payment' && (
            <PaymentForm
              onSubmit={handlePaymentSubmit}
              onBack={handleBackToShipping}
              isLoading={addShippingMutation.isPending}
            />
          )}

          {currentStep === 'confirmation' && completedOrder && (
            <OrderConfirmation order={completedOrder} />
          )}
        </div>

        {/* Order Summary (hidden in confirmation) */}
        {currentStep !== 'confirmation' && (
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <OrderSummary />
            </div>
          </div>
        )}
      </div>

      {/* Payment Processing Modal */}
      <Dialog open={isPaymentProcessing} onOpenChange={(open) => {
        if (!open) {
          // User wants to cancel - show confirmation
          const confirmed = confirm('Sei sicuro di voler annullare il pagamento?');
          if (confirmed) {
            setIsPaymentProcessing(false);
            setCheckoutError('Pagamento annullato.');
          }
        }
      }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="relative">
                <CreditCard className="h-6 w-6 text-primary" />
                <div className="absolute -right-1 -top-1">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
              <DialogTitle>Elaborazione Pagamento</DialogTitle>
            </div>
            <DialogDescription asChild>
              <div className="pt-4 space-y-2">
                <p>Stiamo processando il tuo pagamento{paymentMethod === 'paypal' ? ' tramite PayPal' : ' con carta di credito'}...</p>
                <p className="text-sm text-muted-foreground">
                  Non chiudere questa finestra. Riceverai una conferma a breve.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground animate-pulse">
                Attendere prego...
              </p>
              {/* Show transaction details in development or when mock payment is enabled */}
              {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_PAYMENT === 'true') && orderId && transactionId && (
                <div className="text-xs text-muted-foreground mt-2 p-3 bg-muted/50 rounded-md">
                  <p><strong>Order ID:</strong> {orderId}</p>
                  <p><strong>Transaction ID:</strong> {transactionId}</p>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-2">
            {/* Test button - visible in development or when mock payment is enabled */}
            {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_MOCK_PAYMENT === 'true') && orderId && transactionId && (
              <Button 
                type="button"
                variant="secondary"
                onClick={handleSimulatePayment}
              >
                🧪 Simula Pagamento
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => {
                const confirmed = confirm('Sei sicuro di voler annullare il pagamento?');
                if (confirmed) {
                  setIsPaymentProcessing(false);
                  setCheckoutError('Pagamento annullato.');
                }
              }}
            >
              Annulla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <DialogTitle>Si è verificato un errore</DialogTitle>
            </div>
            <DialogDescription>
              {checkoutError || 'Non è stato possibile completare l\'operazione. Riprova più tardi.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => {
              setShowErrorDialog(false);
              if (checkoutError?.includes('annullato')) {
                // If cancelled, stay on payment page
                setCheckoutError(null);
              } else {
                // For other errors, go back to cart
                router.push('/cart');
              }
            }}>
              {checkoutError?.includes('annullato') ? 'Chiudi' : 'Torna al Carrello'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
