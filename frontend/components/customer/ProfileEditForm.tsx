'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Nome deve essere almeno 2 caratteri'),
  lastName: z.string().min(2, 'Cognome deve essere almeno 2 caratteri'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  onCancel: () => void;
  onSuccess: (data: ProfileFormData) => void;
}

export function ProfileEditForm({
  customer,
  onCancel,
  onSuccess,
}: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/backend/customers/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore durante aggiornamento profilo');
      }

      const result = await response.json();
      onSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante aggiornamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Modifica Profilo</CardTitle>
        <CardDescription>Aggiorna le tue informazioni personali</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* First Name */}
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input
              id="firstName"
              type="text"
              {...register('firstName')}
              disabled={isLoading}
            />
            {errors.firstName && (
              <p className="text-sm text-destructive">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <Label htmlFor="lastName">Cognome</Label>
            <Input
              id="lastName"
              type="text"
              {...register('lastName')}
              disabled={isLoading}
            />
            {errors.lastName && (
              <p className="text-sm text-destructive">{errors.lastName.message}</p>
            )}
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={customer.email}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              L'email non può essere modificata
            </p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">Telefono (opzionale)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+39 123 456 7890"
              {...register('phone')}
              disabled={isLoading}
            />
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Annulla
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salva modifiche
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
