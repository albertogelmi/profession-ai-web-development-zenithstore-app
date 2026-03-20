'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type OrderStatus =
  | 'RESERVED'
  | 'NEW'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

interface OrderStatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }
> = {
  RESERVED: {
    label: 'Riservato',
    variant: 'secondary',
    className: 'bg-gray-500 hover:bg-gray-600',
  },
  NEW: {
    label: 'Nuovo',
    variant: 'default',
    className: 'bg-blue-500 hover:bg-blue-600',
  },
  PROCESSING: {
    label: 'In Elaborazione',
    variant: 'default',
    className: 'bg-yellow-500 hover:bg-yellow-600',
  },
  SHIPPING: {
    label: 'In Spedizione',
    variant: 'default',
    className: 'bg-orange-500 hover:bg-orange-600',
  },
  SHIPPED: {
    label: 'Spedito',
    variant: 'default',
    className: 'bg-purple-500 hover:bg-purple-600',
  },
  DELIVERED: {
    label: 'Consegnato',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-600',
  },
  CANCELLED: {
    label: 'Annullato',
    variant: 'destructive',
    className: 'bg-red-500 hover:bg-red-600',
  },
};

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
  const config = statusConfig[status as OrderStatus] || {
    label: status,
    variant: 'outline' as const,
    className: '',
  };

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, 'text-white', className)}
    >
      {config.label}
    </Badge>
  );
}
