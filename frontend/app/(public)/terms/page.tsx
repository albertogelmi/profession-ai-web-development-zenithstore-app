import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termini e Condizioni - ZenithStore',
  description: 'Leggi i termini e le condizioni di utilizzo di ZenithStore.',
};

export default function TermsPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-6 text-4xl font-bold">Termini e Condizioni</h1>
      <p className="mb-4 text-sm text-muted-foreground">Ultimo aggiornamento: 1 gennaio 2025</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">1. Accettazione dei termini</h2>
        <p className="text-muted-foreground">
          Utilizzando il sito ZenithStore accetti integralmente i presenti Termini e Condizioni.
          Se non sei d'accordo con una qualsiasi parte di essi, ti invitiamo a non utilizzare il
          servizio.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">2. Utilizzo del servizio</h2>
        <p className="text-muted-foreground">
          Il servizio è destinato esclusivamente a utenti maggiorenni. È vietato l'uso del sito
          per scopi illeciti o in violazione di normative vigenti.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">3. Ordini e pagamenti</h2>
        <p className="text-muted-foreground">
          Tutti gli ordini sono soggetti a disponibilità. ZenithStore si riserva il diritto di
          annullare ordini in caso di errori di prezzo o indisponibilità del prodotto.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">4. Limitazione di responsabilità</h2>
        <p className="text-muted-foreground">
          ZenithStore non è responsabile per danni indiretti derivanti dall'utilizzo del sito o
          dei prodotti acquistati, nei limiti consentiti dalla legge applicabile.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">5. Legge applicabile</h2>
        <p className="text-muted-foreground">
          I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia sarà
          competente il Foro di Milano.
        </p>
      </section>
    </main>
  );
}
