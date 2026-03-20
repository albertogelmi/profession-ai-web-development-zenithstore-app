'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const forgotPasswordSchema = z.object({
  email: z.string().email('Inserisci un indirizzo email valido'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate a brief loading period for UX consistency.
      // When a dedicated backend endpoint is available, replace this
      // with an actual API call (e.g. POST /api/customers/forgot-password).
      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSubmitted(true);
    } catch {
      setError('Si è verificato un errore. Riprova più tardi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Email inviata!</p>
          <p className="text-sm text-muted-foreground">
            Se un account è associato a{' '}
            <span className="font-medium text-foreground">{getValues('email')}</span>, riceverai
            un&apos;email con le istruzioni per reimpostare la password.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Non hai ricevuto l&apos;email? Controlla la cartella spam o{' '}
          <button
            type="button"
            onClick={() => setIsSubmitted(false)}
            className="font-medium text-primary hover:underline"
          >
            riprova
          </button>
          .
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Torna al login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Indirizzo email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="nome@esempio.com"
            className="pl-9"
            {...register('email')}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Invio in corso...
          </>
        ) : (
          'Invia istruzioni di recupero'
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ricordi la password?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Accedi
        </Link>
      </p>
    </form>
  );
}
