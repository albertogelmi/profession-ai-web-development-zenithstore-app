import { HeroSection } from '@/components/home/HeroSection';
import { CategoriesGrid } from '@/components/home/CategoriesGrid';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { TrendingUp, Clock, Shield, ShoppingCart } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZenithStore - Il tuo E-commerce di Fiducia',
  description: 'Scopri migliaia di prodotti di qualità su ZenithStore. Spedizioni rapide, pagamenti sicuri e notifiche in tempo reale sui tuoi ordini.',
  keywords: ['e-commerce', 'shopping online', 'prodotti', 'elettronica', 'moda', 'casa'],
  openGraph: {
    title: 'ZenithStore - Il tuo E-commerce di Fiducia',
    description: 'Scopri migliaia di prodotti di qualità su ZenithStore. Spedizioni rapide, pagamenti sicuri e notifiche in tempo reale.',
    type: 'website',
    locale: 'it_IT',
  },
};

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection />

      {/* Categories Grid */}
      <CategoriesGrid />

      {/* Features Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Perché Scegliere ZenithStore?</h2>
            <p className="text-lg text-muted-foreground">
              Un&apos;esperienza di shopping superiore con servizi all&apos;avanguardia
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 transition-colors hover:border-primary/50">
              <CardHeader>
                <TrendingUp className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Prezzi Competitivi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Offerte vantaggiose su tutti i prodotti con sconti e promozioni regolari.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 transition-colors hover:border-primary/50">
              <CardHeader>
                <Clock className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Consegne Rapide</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Spedizioni veloci con tracking in tempo reale e notifiche sullo stato dell&apos;ordine.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 transition-colors hover:border-primary/50">
              <CardHeader>
                <Shield className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Pagamenti Sicuri</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Molteplici metodi di pagamento sicuri per la tua tranquillità.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 transition-colors hover:border-primary/50">
              <CardHeader>
                <ShoppingCart className="mb-2 h-10 w-10 text-primary" />
                <CardTitle>Resi Facili</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Resi senza problemi entro 30 giorni dall&apos;acquisto.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl">
            <CardHeader className="pb-4 text-center">
              <CardTitle className="mb-4 text-3xl font-bold sm:text-4xl">
                Pronto a Iniziare?
              </CardTitle>
              <CardDescription className="text-lg text-primary-foreground/90">
                Registrati oggi e ottieni accesso esclusivo a offerte e sconti
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-col gap-4 pb-8 sm:flex-row sm:justify-center">
              <Button size="lg" variant="secondary" className="w-full gap-2 sm:w-auto" asChild>
                <Link href="/register">
                  <ShoppingCart className="h-5 w-5" />
                  Registrati Gratis
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full border-2 border-primary-foreground bg-transparent text-primary-foreground hover:bg-primary-foreground/10 sm:w-auto" 
                asChild
              >
                <Link href="/products">
                  Esplora i Prodotti
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
}
