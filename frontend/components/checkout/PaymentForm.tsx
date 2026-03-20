'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, DollarSign } from 'lucide-react';

/**
 * Luhn algorithm for credit card validation
 */
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\s/g, '').split('').map(Number);
  let sum = 0;
  let isEven = false;
  
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
}

/**
 * Validate expiry date (must be MM/YY format and not expired)
 */
function validateExpiryDate(expiryDate: string): boolean {
  if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
    return false;
  }
  
  const [month, year] = expiryDate.split('/').map(Number);
  
  // Validate month
  if (month < 1 || month > 12) {
    return false;
  }
  
  // Check if not expired
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Get last 2 digits
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false;
  }
  
  return true;
}

const paymentSchema = z.object({
  paymentMethod: z.enum(['card', 'paypal']),
  cardNumber: z.string().optional(),
  cardHolderName: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
}).superRefine((data, ctx) => {
  // If payment method is card, validate card fields
  if (data.paymentMethod === 'card') {
    // Validate card number
    if (!data.cardNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Il numero della carta è obbligatorio',
        path: ['cardNumber'],
      });
    } else {
      const cardNumberClean = data.cardNumber.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(cardNumberClean)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Il numero della carta deve contenere 13-19 cifre',
          path: ['cardNumber'],
        });
      } else if (!luhnCheck(cardNumberClean)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Numero della carta non valido',
          path: ['cardNumber'],
        });
      }
    }

    // Validate card holder name
    if (!data.cardHolderName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Il nome del titolare è obbligatorio',
        path: ['cardHolderName'],
      });
    } else if (data.cardHolderName.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Il nome del titolare deve contenere almeno 3 caratteri',
        path: ['cardHolderName'],
      });
    }

    // Validate expiry date
    if (!data.expiryDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La data di scadenza è obbligatoria',
        path: ['expiryDate'],
      });
    } else if (!/^\d{2}\/\d{2}$/.test(data.expiryDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Formato non valido (usa MM/YY)',
        path: ['expiryDate'],
      });
    } else if (!validateExpiryDate(data.expiryDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La carta è scaduta o la data non è valida',
        path: ['expiryDate'],
      });
    }

    // Validate CVV
    if (!data.cvv) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Il CVV è obbligatorio',
        path: ['cvv'],
      });
    } else if (!/^\d{3}$/.test(data.cvv)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Il CVV deve contenere esattamente 3 cifre',
        path: ['cvv'],
      });
    }
  }
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function PaymentForm({ onSubmit, onBack, isLoading }: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [expiryValue, setExpiryValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    trigger,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentMethod: 'card',
    },
    mode: 'onChange',
  });

  const handlePaymentMethodChange = (value: string) => {
    const method = value as 'card' | 'paypal';
    setPaymentMethod(method);
    setValue('paymentMethod', method);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metodo di Pagamento</CardTitle>
        <CardDescription>
          Seleziona il tuo metodo di pagamento preferito (Simulazione, non processa pagamenti reali)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Payment Method Selection */}
          <RadioGroup
            value={paymentMethod}
            onValueChange={handlePaymentMethodChange}
            className="space-y-3"
          >
            {/* Credit Card */}
            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex flex-1 cursor-pointer items-center gap-3">
                <CreditCard className="h-5 w-5" />
                <div>
                  <p className="font-medium">Carta di Credito/Debito</p>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, American Express</p>
                </div>
              </Label>
            </div>

            {/* PayPal */}
            <div className="flex items-center space-x-3 rounded-lg border p-4">
              <RadioGroupItem value="paypal" id="paypal" />
              <Label htmlFor="paypal" className="flex flex-1 cursor-pointer items-center gap-3">
                <DollarSign className="h-5 w-5" />
                <div>
                  <p className="font-medium">PayPal</p>
                  <p className="text-sm text-muted-foreground">Paga con il tuo account PayPal</p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Card Details (only if card is selected) */}
          {paymentMethod === 'card' && (
            <div className="space-y-4 rounded-lg border p-4">
              <p className="text-sm font-medium">Dettagli Carta</p>

              {/* Card Number */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Numero Carta *</Label>
                <Input
                  id="cardNumber"
                  {...register('cardNumber', {
                    onChange: (e) => {
                      // Format card number with spaces (4 digits groups)
                      let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                      if (value.length > 0) {
                        value = value.match(/.{1,4}/g)?.join(' ') || value;
                      }
                      e.target.value = value;
                    },
                  })}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  disabled={isLoading}
                />
                {errors.cardNumber && (
                  <p className="text-sm text-destructive">{errors.cardNumber.message}</p>
                )}
              </div>

              {/* Card Holder Name */}
              <div className="space-y-2">
                <Label htmlFor="cardHolderName">Nome Titolare *</Label>
                <Input
                  id="cardHolderName"
                  {...register('cardHolderName', {
                    onChange: (e) => {
                      // Allow only alphabetic characters and spaces, convert to uppercase
                      let value = e.target.value.replace(/[^A-ZÀ-ÿ\s]/gi, '');
                      e.target.value = value.toUpperCase();
                    },
                  })}
                  placeholder="MARIO ROSSI"
                  disabled={isLoading}
                />
                {errors.cardHolderName && (
                  <p className="text-sm text-destructive">{errors.cardHolderName.message}</p>
                )}
              </div>

              {/* Expiry Date & CVV */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Scadenza *</Label>
                  <Input
                    id="expiryDate"
                    value={expiryValue}
                    onKeyDown={async (e) => {
                      if (e.key === 'Backspace') {
                        e.preventDefault();
                        // If last character is /, remove both / and the digit before it
                        const charsToRemove = expiryValue.endsWith('/') ? 2 : 1;
                        const newValue = expiryValue.slice(0, -charsToRemove);
                        setExpiryValue(newValue);
                        setValue('expiryDate', newValue);
                        await trigger('expiryDate');
                      }
                    }}
                    onChange={(e) => {
                      let value = e.target.value;
                      
                      // Only process if value increased (not backspace)
                      if (value.length > expiryValue.length) {
                        // Remove non-digits
                        value = value.replace(/\D/g, '');
                        
                        // Validate month as user types (MM must be 01-12)
                        if (value.length >= 1) {
                          const firstDigit = parseInt(value[0]);
                          // If first digit > 1, it must be 01-09
                          if (firstDigit > 1) {
                            value = '0' + firstDigit + value.slice(1);
                          }
                        }
                        
                        if (value.length >= 2) {
                          const month = parseInt(value.slice(0, 2));
                          // Month must be between 01 and 12
                          if (month > 12) {
                            value = '12' + value.slice(2);
                          } else if (month === 0) {
                            value = '01' + value.slice(2);
                          }
                          
                          // Auto-add slash after month
                          if (value.length >= 2) {
                            value = value.slice(0, 2) + '/' + value.slice(2, 4);
                          }
                        }
                        
                        // Limit to MM/YY format
                        value = value.slice(0, 5);
                        setExpiryValue(value);
                        setValue('expiryDate', value);
                        trigger('expiryDate');
                      }
                    }}
                    placeholder="MM/YY"
                    maxLength={5}
                    disabled={isLoading}
                  />
                  {errors.expiryDate && (
                    <p className="text-sm text-destructive">{errors.expiryDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    {...register('cvv', {
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 3);
                      },
                    })}
                    placeholder="123"
                    maxLength={3}
                    type="password"
                    disabled={isLoading}
                  />
                  {errors.cvv && (
                    <p className="text-sm text-destructive">{errors.cvv.message}</p>
                  )}
                </div>
              </div>

              {/* Mock Notice */}
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-900">
                  Numeri carta di credito fittizi per i test:
                  <br />
                  <li className="ml-4">Visa: 4111 1111 1111 1111</li>
                  <li className="ml-4">Mastercard: 5555 5555 5555 4444</li>
                  <li className="ml-4">Amex: 3782 822463 10005</li>
                </p>
              </div>
            </div>
          )}

          {/* PayPal Notice */}
          {paymentMethod === 'paypal' && (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  Verrai reindirizzato a PayPal per completare il pagamento
                </p>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="flex-1"
            >
              Indietro
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1" size="lg">
              {isLoading ? 'Elaborazione...' : 'Conferma Ordine'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
