import Link from 'next/link';
import { FacebookLogo, InstagramLogo, EnvelopeSimple, TwitterLogo } from 'phosphor-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-lg font-bold">NC</span>
              </div>
              <span className="font-bold">ZenithStore</span>
            </div>
            <p className="text-sm text-muted-foreground">
              La tua piattaforma e-commerce di fiducia per prodotti di qualità e un'esperienza di acquisto senza problemi.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  Chi Siamo
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Contatti
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-foreground">
                  Domande Frequenti
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-muted-foreground hover:text-foreground">
                  Informazioni Spedizione
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Customer Service</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/returns" className="text-muted-foreground hover:text-foreground">
                  Resi e Rimborsi
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Termini di Servizio
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-foreground">
                  Supporto
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="mb-3 text-sm font-semibold">Connect With Us</h3>
            <div className="flex space-x-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Facebook"
              >
                <FacebookLogo size={20} weight="fill" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Instagram"
              >
                <InstagramLogo size={20} weight="fill" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label="X"
              >
                <TwitterLogo size={20} weight="fill" />
              </a>
              <a
                href="mailto:info@zenithstore.com"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Email"
              >
                <EnvelopeSimple size={20} weight="fill" />
              </a>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Email: info@zenithstore.com<br />
              Tel: +39 02 1234 5678
            </p>
          </div>
        </div>

        <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} ZenithStore. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
}
