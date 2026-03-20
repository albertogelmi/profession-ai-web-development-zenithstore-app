'use client';

// Layout for all customer-protected pages (e.g., profile, orders)
// Handles authentication, navigation, and real-time features for logged-in users


// Import UI and logic components for layout, navigation, and notifications
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileNav } from '@/components/layout/MobileNav';
import { CartSidebar } from '@/components/cart/CartSidebar';
import { CustomerSidebar } from '@/components/customer/CustomerSidebar';
import { MobileCustomerNav } from '@/components/customer/MobileCustomerNav';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PageLoader } from '@/components/ui/loading-spinner';
import { useWishlist } from '@/hooks/useWishlist';
import { Toaster } from 'sonner';
import { NotificationModal } from '@/components/notifications/NotificationModal';

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get authentication status and session
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  
  // Preload wishlist to sync with store (for customer features)
  useWishlist();

  // Redirect unauthenticated users to login page
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/profile');
    }
  }, [status, router]);

  // Show loading spinner while checking authentication
  if (status === 'loading') {
    return <PageLoader />;
  }

  // Prevent rendering if not authenticated
  if (!session) {
    return null;
  }

  // Main customer layout with navigation, sidebars, and notifications
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
      
      {/* Customer Area Layout */}
      <div className="flex-1">
        {/* Mobile Customer Nav */}
        <div className="lg:hidden pt-4 px-6 pb-4">
          <MobileCustomerNav />
        </div>

        <div className="flex">
          {/* Desktop Sidebar for customer navigation */}
          <div className="hidden lg:block">
            <CustomerSidebar />
          </div>

          {/* Main Content Area */}
          <main className="flex-1 p-6 lg:p-8 pt-0 lg:pt-8">
            <div className="max-w-4xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
      
        <Footer />
      </div>
    </>
  );
}
