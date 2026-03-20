import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ShoppingCart, Sparkles } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 py-20 sm:py-24 lg:py-32">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-4 top-0 h-72 w-72 animate-pulse rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -right-4 top-20 h-96 w-96 animate-pulse rounded-full bg-accent/5 blur-3xl [animation-delay:2s]" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 animate-pulse rounded-full bg-primary/5 blur-3xl [animation-delay:4s]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge variant="secondary" className="mb-6 gap-1 px-4 py-1.5 text-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Benvenuto su ZenithStore
          </Badge>

          {/* Heading */}
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            L&apos;esperienza di shopping{' '}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              che cercavi
            </span>
          </h1>

          {/* Tagline */}
          <p className="mb-8 text-lg text-muted-foreground sm:text-xl md:mb-10 md:text-2xl">
            Scopri migliaia di prodotti di qualità, con spedizioni rapide e notifiche in tempo reale sui tuoi ordini.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="group h-12 gap-2 px-8 text-base" asChild>
              <Link href="/products">
                <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
                Scopri il Catalogo
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
              <Link href="/register">
                Registrati Gratis
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground sm:gap-8 md:mt-16">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Spedizione Rapida</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Pagamenti Sicuri</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Resi Facili</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
