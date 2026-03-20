import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supporto - ZenithStore',
  description: 'Centro assistenza ZenithStore: trova risposte, guide e contatta il supporto.',
};

export default function SupportPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-6 text-4xl font-bold">Centro Supporto</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Come possiamo aiutarti? Sfoglia le categorie qui sotto o contatta direttamente
        il nostro team di assistenza.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: 'Ordini e Spedizioni', desc: 'Traccia il tuo ordine, modifica o annulla un acquisto.' },
          { title: 'Resi e Rimborsi', desc: 'Scopri come restituire un prodotto e ottenere il rimborso.' },
          { title: 'Pagamenti', desc: 'Metodi accettati, fatturazione e problemi di pagamento.' },
          { title: 'Account', desc: 'Gestisci il tuo profilo, password e preferenze.' },
        ].map((item) => (
          <div key={item.title} className="rounded-lg border p-5">
            <h2 className="mb-1 font-semibold">{item.title}</h2>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
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
