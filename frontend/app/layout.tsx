// Root layout for the entire Next.js app
// Sets up global fonts, metadata, viewport, and providers
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

// Load custom Google fonts for the app
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Global metadata for the app (title, description, PWA settings)
export const metadata: Metadata = {
  title: "ZenithStore Online",
  description: "Piattaforma e-commerce moderna con notifiche in tempo reale",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZenithStore",
  },
};

// Viewport settings for responsive design and theming
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#3b82f6",
};

/**
 * RootLayout
 *
 * The main root layout component for the entire Next.js app.
 * Sets up global fonts, metadata, viewport, and wraps all pages with Providers and the service worker registration for PWA support.
 *
 * @prop {React.ReactNode} children - The page or segment content to be rendered inside the layout.
 * @returns The HTML structure with global providers, service worker registration, and children content.
 *
 * @example
 * // Used automatically by Next.js as the root layout for all pages and segments
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {/* Registers the service worker for push notifications and offline support */}
          <ServiceWorkerRegistration />
          {children}
        </Providers>
      </body>
    </html>
  );
}
