import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Registrati - ZenithStore',
  description: 'Crea un nuovo account ZenithStore',
};

export default function RegisterPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="space-y-1">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <span className="text-2xl font-bold">NC</span>
          </div>
          <CardTitle className="text-center text-2xl">Crea un account</CardTitle>
          <CardDescription className="text-center">
            Inserisci i tuoi dati per registrarti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
