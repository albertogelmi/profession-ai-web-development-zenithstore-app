import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ - ZenithStore',
  description: 'Domande frequenti su ZenithStore: ordini, pagamenti, spedizioni e molto altro.',
};

const faqs = [
  {
    q: 'Come posso tracciare il mio ordine?',
    a: 'Accedi al tuo account, vai in "I miei ordini" e clicca sull\'ordine per vedere lo stato e il link di tracciamento del corriere.',
  },
  {
    q: 'Posso modificare o annullare un ordine?',
    a: 'È possibile modificare o annullare un ordine entro 1 ora dall\'acquisto. Accedi alla sezione "I miei ordini" e usa l\'opzione corrispondente.',
  },
  {
    q: 'Quali metodi di pagamento accettate?',
    a: 'Accettiamo carte di credito/debito (Visa, Mastercard), PayPal, bonifico bancario e pagamento alla consegna (per importi fino a €100).',
  },
  {
    q: 'La spedizione è gratuita?',
    a: 'Sì, la spedizione standard è gratuita per ordini superiori a €49. Per importi inferiori il costo è di €4,90.',
  },
  {
    q: 'Quanto tempo ho per restituire un prodotto?',
    a: 'Hai 30 giorni dalla data di consegna per effettuare un reso, a condizione che il prodotto sia integro e nella confezione originale.',
  },
  {
    q: 'I prodotti hanno la garanzia?',
    a: 'Sì, tutti i prodotti sono coperti dalla garanzia legale di 2 anni prevista dalla normativa europea, oltre alle eventuali garanzie commerciali del produttore.',
  },
];

export default function FaqPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-6 text-4xl font-bold">Domande Frequenti</h1>
      <p className="mb-10 text-lg text-muted-foreground">
        Trova rapidamente risposta alle domande più comuni su ZenithStore.
      </p>
      <div className="space-y-6">
        {faqs.map((item) => (
          <div key={item.q} className="rounded-lg border p-5">
            <h2 className="mb-2 font-semibold">{item.q}</h2>
            <p className="text-sm text-muted-foreground">{item.a}</p>
          </div>
        ))}
      </div>
      <p className="mt-10 text-sm text-muted-foreground">
        Non hai trovato risposta?{' '}
        <a href="/contact" className="underline hover:text-foreground">
          Contattaci
        </a>
        .
      </p>
    </main>
  );
}
