'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { ProfileInfo } from '@/components/customer/ProfileInfo';
import { ProfileEditForm } from '@/components/customer/ProfileEditForm';
import { ChangePasswordForm } from '@/components/customer/ChangePasswordForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchCustomerProfile();
  }, []);

  const fetchCustomerProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/backend/customers/profile');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento del profilo');
      }

      const data = await response.json();

      if (data.success && data.data?.customer) {
        setCustomer(data.data.customer);
      } else {
        setCustomer(data.data || data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSuccess = (data: { firstName: string; lastName: string; phone?: string }) => {
    if (customer) {
      setCustomer({
        ...customer,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !customer) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {error || 'Impossibile caricare il profilo'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Il mio profilo</h1>
        <p className="text-muted-foreground mt-2">
          Gestisci le tue informazioni personali e la sicurezza dell'account
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="info">Informazioni</TabsTrigger>
          <TabsTrigger value="security">Sicurezza</TabsTrigger>
        </TabsList>

        {/* Profile Info Tab */}
        <TabsContent value="info" className="space-y-4">
          {isEditing ? (
            <ProfileEditForm
              customer={customer}
              onCancel={() => setIsEditing(false)}
              onSuccess={handleEditSuccess}
            />
          ) : (
            <ProfileInfo
              customer={customer}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <ChangePasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
