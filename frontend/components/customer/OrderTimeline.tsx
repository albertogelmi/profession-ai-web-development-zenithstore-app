'use client';

import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Check, Circle, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type OrderStatus =
  | 'RESERVED'
  | 'NEW'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

interface TimelineStep {
  status: OrderStatus;
  label: string;
  description: string;
}

interface OrderTimelineProps {
  currentStatus: string;
  createdAt: string;
  statusHistory?: Array<{ status: string; timestamp: string }>;
}

const timelineSteps: TimelineStep[] = [
  {
    status: 'NEW',
    label: 'Ordine Ricevuto',
    description: 'Il tuo ordine è stato confermato',
  },
  {
    status: 'PROCESSING',
    label: 'In Elaborazione',
    description: 'Stiamo preparando il tuo ordine',
  },
  {
    status: 'SHIPPING',
    label: 'In Spedizione',
    description: 'Il tuo ordine è in transito',
  },
  {
    status: 'SHIPPED',
    label: 'Spedito',
    description: 'Il corriere ha preso in carico il pacco',
  },
  {
    status: 'DELIVERED',
    label: 'Consegnato',
    description: 'Il tuo ordine è stato consegnato',
  },
];

const statusOrder: Record<OrderStatus, number> = {
  RESERVED: 0,
  NEW: 1,
  PROCESSING: 2,
  SHIPPING: 3,
  SHIPPED: 4,
  DELIVERED: 5,
  CANCELLED: -1,
};

export function OrderTimeline({
  currentStatus,
  createdAt,
  statusHistory = [],
}: OrderTimelineProps) {
  const currentStatusIndex = statusOrder[currentStatus as OrderStatus] || 0;
  const isCancelled = currentStatus === 'CANCELLED';

  const getStepStatus = (stepIndex: number) => {
    if (isCancelled && stepIndex > 0) return 'cancelled';
    if (stepIndex < currentStatusIndex) return 'completed';
    if (stepIndex === currentStatusIndex) return 'current';
    return 'pending';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stato dell'Ordine</CardTitle>
        <CardDescription>
          Traccia lo stato di avanzamento del tuo ordine
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCancelled ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="font-medium text-destructive">Ordine Annullato</p>
            <p className="text-sm text-muted-foreground mt-1">
              Questo ordine è stato annullato
            </p>
          </div>
        ) : (
          <div className="relative space-y-8 before:absolute before:left-4 before:top-2 before:h-[calc(100%-3rem)] before:w-0.5 before:bg-border">
            {timelineSteps.map((step, index) => {
              const status = getStepStatus(index + 1);
              const isCompleted = status === 'completed';
              const isCurrent = status === 'current';
              const isPending = status === 'pending';

              return (
                <div key={step.status} className="relative flex gap-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2',
                      isCompleted &&
                        'border-primary bg-primary text-primary-foreground',
                      isCurrent &&
                        'border-primary bg-background text-primary',
                      isPending && 'border-muted bg-background text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <h4
                      className={cn(
                        'font-medium',
                        (isCompleted || isCurrent) && 'text-foreground',
                        isPending && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.description}
                    </p>
                    {(isCompleted || isCurrent) && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(createdAt), "d MMMM yyyy 'alle' HH:mm", {
                          locale: it,
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
