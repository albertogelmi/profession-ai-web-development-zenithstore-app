'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Menu, User, Package, Heart, Bell, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useUnreadCount } from '@/hooks/useNotifications';

const menuItems = [
  {
    label: 'Il mio profilo',
    href: '/profile',
    icon: User,
  },
  {
    label: 'I miei ordini',
    href: '/orders',
    icon: Package,
  },
  {
    label: 'Wishlist',
    href: '/wishlist',
    icon: Heart,
    showBadge: 'wishlist',
  },
  {
    label: 'Notifiche',
    href: '/notifications',
    icon: Bell,
    showBadge: 'notifications',
  },
];

export function MobileCustomerNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const { data: unreadCount } = useUnreadCount(status === 'authenticated');

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Apri menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>Menu Customer</SheetTitle>
          <SheetDescription>Accedi al tuo profilo, ordini e impostazioni</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate">
                {session?.user?.name || 'Customer'}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {session?.user?.email}
              </p>
            </div>
          </div>

          <Separator />

          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.showBadge === 'wishlist' && wishlistCount > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {wishlistCount}
                    </Badge>
                  )}
                  {item.showBadge === 'notifications' && unreadCount !== undefined && unreadCount > 0 && (
                    <Badge variant="default" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* Logout */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span>Esci</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
