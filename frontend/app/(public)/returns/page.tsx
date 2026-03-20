import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resi e Rimborsi - ZenithStore',
  description: 'Scopri la politica di reso e rimborso di ZenithStore.',
};

export default function ReturnsPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-6 text-4xl font-bold">Resi e Rimborsi</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        La tua soddisfazione è la nostra priorità. Se non sei soddisfatto del tuo acquisto,
        puoi restituirlo entro 30 giorni dalla consegna.
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Come effettuare un reso</h2>
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
          <li>Accedi al tuo account e vai nella sezione "I miei ordini".</li>
          <li>Seleziona l'ordine e clicca su "Richiedi reso".</li>
          <li>Scegli i prodotti da restituire e il motivo del reso.</li>
          <li>Stampa l'etichetta di spedizione prepagata e imballa il prodotto.</li>
          <li>Consegna il pacco al corriere entro 5 giorni lavorativi.</li>
        </ol>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">Tempi di rimborso</h2>
        <p className="text-muted-foreground">
          Una volta ricevuto e verificato il reso, il rimborso viene accreditato entro
          5–10 giorni lavorativi sullo stesso metodo di pagamento utilizzato per l'acquisto.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Prodotti non rimborsabili</h2>
        <p className="text-muted-foreground">
          Non è possibile restituire prodotti digitali, prodotti sigillati aperti per motivi
          igienici e articoli personalizzati, salvo vizi di conformità.
        </p>
      </section>
    </main>
  );
}
