import { Metadata } from 'next';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Password Dimenticata - ZenithStore',
  description: 'Recupera l\'accesso al tuo account ZenithStore',
};

export default function ForgotPasswordPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-2xl font-bold">NC</span>
          </div>
          <CardTitle className="text-center text-2xl">Password dimenticata</CardTitle>
          <CardDescription className="text-center">
            Inserisci la tua email per ricevere le istruzioni di recupero
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Caricamento...</div>}>
            <ForgotPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
