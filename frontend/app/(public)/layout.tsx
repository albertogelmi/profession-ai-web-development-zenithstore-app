'use client';

// Layout for all public (unauthenticated) pages
// Handles navigation, cart sidebar, and notification features for guests


// Import UI and logic components for layout, navigation, and notifications
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { useState } from 'react';
import { Toaster } from 'sonner';
import { NotificationModal } from '@/components/notifications/NotificationModal';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // State for mobile navigation menu
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Main public layout with navigation, cart sidebar, and notifications
  return (
    <>
      {/* Toast notifications and modal for real-time alerts */}
      <Toaster position="bottom-right" richColors closeButton />
      <NotificationModal />
      <div className="flex min-h-screen flex-col">
        {/* Top navigation and mobile menu */}
        <Header onMobileMenuToggle={() => setMobileNavOpen(true)} />
        <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <CartSidebar />
        {/* Main content area for public pages */}
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </>
  );
}
