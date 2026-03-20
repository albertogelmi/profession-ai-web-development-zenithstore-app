'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

interface ProductSortProps {
  currentSort?: string;
  onSortChange: (value: string) => void;
}

export function ProductSort({ currentSort, onSortChange }: ProductSortProps) {
  const sortOptions = [
    { value: 'createdAt_desc', label: 'Più Recenti' },
    { value: 'price_asc', label: 'Prezzo: Basso → Alto' },
    { value: 'price_desc', label: 'Prezzo: Alto → Basso' },
    { value: 'name_asc', label: 'Nome: A → Z' },
    { value: 'name_desc', label: 'Nome: Z → A' },
  ];

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={currentSort || 'createdAt_desc'} onValueChange={onSortChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Ordina per" />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
