'use client';

import Link from 'next/link';
import { Home, ShoppingBag, Heart, Bell, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useSession } from 'next-auth/react';
import { logout } from '@/lib/logout';
import { useCategories } from '@/hooks/useCategories';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const { data: session } = useSession();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetDescription>Naviga tra le categorie e gestisci il tuo account</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Categorie</h3>
            <nav className="space-y-2">
              {categoriesLoading ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">Caricamento...</p>
              ) : categories && categories.length > 0 ? (
                categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.slug}
                    href={`/categories/${category.slug}`}
                    onClick={onClose}
                    className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                  >
                    {category.name}
                  </Link>
                ))
              ) : (
                <p className="px-3 py-2 text-sm text-muted-foreground">Nessuna categoria disponibile</p>
              )}
            </nav>
          </div>

          {/* User Links */}
          {session ? (
            <div>
              <h3 className="mb-3 text-sm font-semibold">Il Mio Account</h3>
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <User className="h-4 w-4" />
                  Il mio profilo
                </Link>
                <Link
                  href="/orders"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <ShoppingBag className="h-4 w-4" />
                  I miei ordini
                </Link>
                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Heart className="h-4 w-4" />
                  Wishlist
                </Link>
                <Link
                  href="/notifications"
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <Bell className="h-4 w-4" />
                  Notifiche
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive transition-colors hover:bg-accent"
                >
                  <LogOut className="h-4 w-4" />
                  Esci
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/login" onClick={onClose}>
                  Login
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/register" onClick={onClose}>
                  Registrati
                </Link>
              </Button>
            </div>
          )}

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Link Rapidi</h3>
            <nav className="space-y-2">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link
                href="/about"
                onClick={onClose}
                className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                Chi Siamo
              </Link>
              <Link
                href="/contact"
                onClick={onClose}
                className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                Contatti
              </Link>
              <Link
                href="/support"
                onClick={onClose}
                className="block rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                Supporto
              </Link>
            </nav>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
