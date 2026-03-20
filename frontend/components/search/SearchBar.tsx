'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSearchSuggestions } from '@/hooks/useSearch';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  className?: string;
  onClose?: () => void;
  autoFocus?: boolean;
}

export function SearchBar({ className, onClose, autoFocus = false }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useSearchSuggestions(debouncedQuery);
  const suggestions = data?.suggestions || [];

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Sync query with URL parameter
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== query) {
      setQuery(urlQuery);
      setDebouncedQuery(urlQuery);
    }
  }, [searchParams]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      router.push(`/products?q=${encodeURIComponent(query)}`);
      setIsOpen(false);
      onClose?.();
    }
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
    
    // If on products page with search query, clear it from URL
    if (pathname === '/products' && searchParams.get('q')) {
      const params = new URLSearchParams(searchParams);
      params.delete('q');
      const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.push(newUrl);
    }
  };

  const handleSuggestionClick = (productCode: string) => {
    router.push(`/products/${productCode}`);
    setIsOpen(false);
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && suggestions.length > 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex === -1) {
          handleSubmit(e);
        } else if (selectedIndex === suggestions.length) {
          // "Vedi tutti i risultati" option
          handleSubmit(e);
        } else if (suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex].code);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const showDropdown = isOpen && query.trim().length >= 2 && (isLoading || suggestions.length > 0);

  return (
    <div className={cn('relative', className)}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Cerca prodotti..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button type="submit" size="sm" className="h-7" disabled={query.trim().length < 2}>
            Cerca
          </Button>
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <Card
          ref={dropdownRef}
          className="absolute top-full z-50 mt-2 w-full overflow-hidden shadow-lg"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Ricerca in corso...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <>
              <div className="max-h-[400px] overflow-y-auto">
                {suggestions.map((product, index) => (
                  <button
                    key={product.code}
                    onClick={() => handleSuggestionClick(product.code)}
                    className={cn(
                      'flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-accent',
                      selectedIndex === index && 'bg-accent'
                    )}
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded border bg-muted">
                      <Image
                        src={product.imageUrl || '/placeholder-product.svg'}
                        alt={product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">{product.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-primary">
                          €{product.price.toFixed(2)}
                        </p>
                        {product.categoryName && (
                          <span className="text-xs text-muted-foreground">
                            {product.categoryName}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <Link
                href={`/products?q=${encodeURIComponent(query)}`}
                onClick={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                className={cn(
                  'flex items-center justify-center border-t p-3 text-sm font-medium transition-colors hover:bg-accent',
                  selectedIndex === suggestions.length && 'bg-accent'
                )}
              >
                Vedi tutti i risultati per &quot;{query}&quot;
              </Link>
            </>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nessun risultato trovato
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
