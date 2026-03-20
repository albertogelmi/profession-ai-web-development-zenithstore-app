'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const shippingSchema = z.object({
  firstName: z.string()
    .min(2, 'Nome deve contenere almeno 2 caratteri')
    .regex(/^[A-ZÀ-ÿ\s]+$/i, 'Nome deve contenere solo caratteri alfabetici'),
  lastName: z.string()
    .min(2, 'Cognome deve contenere almeno 2 caratteri')
    .regex(/^[A-ZÀ-ÿ\s]+$/i, 'Cognome deve contenere solo caratteri alfabetici'),
  addressLine: z.string()
    .min(5, 'Indirizzo deve contenere almeno 5 caratteri')
    .regex(/^[A-Z0-9À-ÿ\s,.\/-]+$/i, 'Indirizzo contiene caratteri non validi'),
  city: z.string()
    .min(2, 'Città deve contenere almeno 2 caratteri')
    .regex(/^[A-ZÀ-ÿ\s]+$/i, 'Città deve contenere solo caratteri alfabetici'),
  postalCode: z.string().regex(/^\d{5}$/, 'CAP deve essere di 5 cifre'),
  province: z.string()
    .length(2, 'Provincia deve essere di 2 lettere')
    .regex(/^[A-Z]{2}$/i, 'Provincia deve contenere solo lettere'),
  country: z.string().min(2, 'Paese richiesto'),
  phone: z.string().regex(/^\+?\d{10,15}$/, 'Numero di telefono non valido'),
});

export type ShippingFormData = z.infer<typeof shippingSchema>;

interface ShippingFormProps {
  onSubmit: (data: ShippingFormData) => void;
  defaultValues?: Partial<ShippingFormData>;
  isLoading?: boolean;
}

export function ShippingForm({ onSubmit, defaultValues, isLoading }: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      country: 'Italia',
      ...defaultValues,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indirizzo di Spedizione</CardTitle>
        <CardDescription>
          Inserisci l'indirizzo dove desideri ricevere il tuo ordine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* First Name & Last Name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome *</Label>
              <Input
                id="firstName"
                {...register('firstName', {
                  onChange: (e) => {
                    // Allow only alphabetic characters and spaces, convert to uppercase
                    let value = e.target.value.replace(/[^A-ZÀ-ÿ\s]/gi, '');
                    e.target.value = value.toUpperCase();
                  },
                })}
                placeholder="MARIO"
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-destructive">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Cognome *</Label>
              <Input
                id="lastName"
                {...register('lastName', {
                  onChange: (e) => {
                    // Allow only alphabetic characters and spaces, convert to uppercase
                    let value = e.target.value.replace(/[^A-ZÀ-ÿ\s]/gi, '');
                    e.target.value = value.toUpperCase();
                  },
                })}
                placeholder="ROSSI"
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="addressLine">Indirizzo *</Label>
            <Input
              id="addressLine"
              {...register('addressLine', {
                onChange: (e) => {
                  // Allow alphanumeric, spaces, comma, period, slash, hyphen
                  let value = e.target.value.replace(/[^A-Z0-9À-ÿ\s,.\/-]/gi, '');
                  e.target.value = value.toUpperCase();
                },
              })}
              placeholder="VIA ROMA, 123"
              disabled={isLoading}
            />
            {errors.addressLine && (
              <p className="text-sm text-destructive">{errors.addressLine.message}</p>
            )}
          </div>

          {/* City & Postal Code */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">Città *</Label>
              <Input
                id="city"
                {...register('city', {
                  onChange: (e) => {
                    // Allow only alphabetic characters and spaces, convert to uppercase
                    let value = e.target.value.replace(/[^A-ZÀ-ÿ\s]/gi, '');
                    e.target.value = value.toUpperCase();
                  },
                })}
                placeholder="MILANO"
                disabled={isLoading}
              />
              {errors.city && (
                <p className="text-sm text-destructive">{errors.city.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">CAP *</Label>
              <Input
                id="postalCode"
                {...register('postalCode', {
                  onChange: (e) => {
                    // Allow only digits, max 5
                    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
                  },
                })}
                placeholder="20100"
                maxLength={5}
                disabled={isLoading}
              />
              {errors.postalCode && (
                <p className="text-sm text-destructive">{errors.postalCode.message}</p>
              )}
            </div>
          </div>

          {/* Province & Country */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="province">Provincia *</Label>
              <Input
                id="province"
                {...register('province', {
                  onChange: (e) => {
                    // Allow only letters, max 2, convert to uppercase
                    let value = e.target.value.replace(/[^A-Z]/gi, '').slice(0, 2);
                    e.target.value = value.toUpperCase();
                  },
                })}
                placeholder="MI"
                maxLength={2}
                disabled={isLoading}
              />
              {errors.province && (
                <p className="text-sm text-destructive">{errors.province.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Paese *</Label>
              <Input
                id="country"
                {...register('country')}
                placeholder="Italia"
                disabled={isLoading}
                readOnly
              />
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono *</Label>
            <Input
              id="phone"
              {...register('phone', {
                onChange: (e) => {
                  // Allow only digits and + (for international prefix)
                  let value = e.target.value.replace(/[^\d+]/g, '');
                  // Ensure + is only at the beginning
                  if (value.includes('+')) {
                    const parts = value.split('+');
                    value = '+' + parts.join('').replace(/\+/g, '');
                  }
                  // Limit to max 16 characters (+ plus 15 digits)
                  e.target.value = value.slice(0, 16);
                },
              })}
              type="tel"
              placeholder="+39 3331234567"
              maxLength={16}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Elaborazione...' : 'Continua al Pagamento'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
