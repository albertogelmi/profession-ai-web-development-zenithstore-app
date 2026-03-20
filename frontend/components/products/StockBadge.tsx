import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface StockBadgeProps {
  quantity: number;
  lowStockThreshold?: number;
  className?: string;
}

export function StockBadge({ quantity, lowStockThreshold = 5, className }: StockBadgeProps) {
  if (quantity === 0) {
    return (
      <Badge variant="destructive" className={className}>
        <AlertCircle className="mr-1 h-3 w-3" />
        Esaurito
      </Badge>
    );
  }

  if (quantity <= lowStockThreshold) {
    return (
      <Badge variant="outline" className={`border-warning text-warning ${className}`}>
        <Clock className="mr-1 h-3 w-3" />
        Scorte Limitate ({quantity} disponibili)
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`border-success text-success ${className}`}>
      <CheckCircle className="mr-1 h-3 w-3" />
      Disponibile
    </Badge>
  );
}
