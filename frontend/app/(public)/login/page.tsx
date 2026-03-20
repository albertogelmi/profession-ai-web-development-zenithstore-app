import { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login - ZenithStore',
  description: 'Accedi al tuo account ZenithStore',
};

export default function LoginPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-2xl font-bold">NC</span>
          </div>
          <CardTitle className="text-center text-2xl">Benvenuto</CardTitle>
          <CardDescription className="text-center">
            Accedi al tuo account ZenithStore
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Caricamento...</div>}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
