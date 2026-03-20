'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useUIStore } from '@/stores/uiStore';
import { SearchBar } from '@/components/search/SearchBar';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from 'next-auth/react';
import { logout } from '@/lib/logout';
import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const { itemCount } = useCart();
  const { openCart } = useUIStore();
  const { data: categories } = useCategories();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-lg font-bold">NC</span>
            </div>
            <span className="hidden font-bold sm:inline-block">ZenithStore</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden flex-1 px-4 md:block lg:px-8">
            <div className="max-w-md mx-auto">
              <SearchBar />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search */}
            <Dialog open={isMobileSearchOpen} onOpenChange={setIsMobileSearchOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Search className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="top-0 max-w-full translate-y-0 sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Cerca prodotti</DialogTitle>
                  <DialogDescription>Trova i prodotti che stai cercando</DialogDescription>
                </DialogHeader>
                <SearchBar autoFocus onClose={() => setIsMobileSearchOpen(false)} />
              </DialogContent>
            </Dialog>
            {/* Cart */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                >
                  {itemCount > 99 ? '99+' : itemCount}
                </Badge>
              )}
            </Button>

            {/* Notifications (only when logged in) */}
            {status === 'authenticated' && <NotificationBell />}

            {/* User Menu */}
            {status === 'loading' ? (
              <Button variant="ghost" size="icon" disabled>
                <User className="h-5 w-5" />
              </Button>
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Il mio profilo</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders">I miei ordini</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist">Wishlist</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    Esci
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>

        {/* Categories Navigation - Desktop */}
        <nav className="hidden border-t md:block">
          <div className="flex h-10 items-center space-x-4 text-sm">
            {categories?.slice(0, 6).map((category) => (
              <Link
                key={category.slug}
                href={`/categories/${category.slug}`}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
