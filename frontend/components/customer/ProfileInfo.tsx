'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Edit, User, Mail, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ProfileInfoProps {
  customer: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    createdAt: string;
  };
  onEdit: () => void;
}

export function ProfileInfo({ customer, onEdit }: ProfileInfoProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Informazioni Personali</CardTitle>
            <CardDescription>I tuoi dati personali</CardDescription>
          </div>
          <Button onClick={onEdit} size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Modifica
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Name */}
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Nome completo</p>
            <p className="font-medium">
              {customer.firstName} {customer.lastName}
            </p>
          </div>
        </div>

        <Separator />

        {/* Email */}
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium truncate">{customer.email}</p>
          </div>
        </div>

        <Separator />

        {/* Phone */}
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Telefono</p>
            <p className="font-medium">
              {customer.phone || 'Non specificato'}
            </p>
          </div>
        </div>

        <Separator />

        {/* Registration Date */}
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">Iscritto dal</p>
            <p className="font-medium">
              {customer.createdAt
                ? format(new Date(customer.createdAt), 'dd MMMM yyyy', {
                    locale: it,
                  })
                : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
