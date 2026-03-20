import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chi Siamo - ZenithStore',
  description: 'Scopri la storia e i valori di ZenithStore, il tuo e-commerce di fiducia.',
};

export default function AboutPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-6 text-4xl font-bold">Chi Siamo</h1>
      <p className="mb-4 text-lg text-muted-foreground">
        ZenithStore è il tuo e-commerce di fiducia, nato con la missione di offrire
        prodotti di qualità a prezzi competitivi, con un'esperienza di acquisto semplice
        e sicura.
      </p>
      <p className="mb-4 text-muted-foreground">
        Dal nostro lancio ci siamo impegnati a costruire una piattaforma in cui i clienti
        possano trovare tutto ciò di cui hanno bisogno: dall'elettronica alla moda, dalla
        casa al tempo libero. La nostra squadra lavora ogni giorno per garantire spedizioni
        rapide, pagamenti sicuri e un'assistenza clienti sempre disponibile.
      </p>
      <p className="text-muted-foreground">
        La nostra visione è diventare il punto di riferimento per lo shopping online in
        Italia, mettendo sempre al primo posto la soddisfazione del cliente.
      </p>
    </main>
  );
}
