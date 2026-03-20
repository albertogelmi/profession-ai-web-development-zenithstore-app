import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spedizioni - ZenithStore',
  description: 'Informazioni su spedizioni, tempi di consegna e costi di ZenithStore.',
};

export default function ShippingPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-6 text-4xl font-bold">Spedizioni</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Consegniamo in tutta Italia con corrieri affidabili. Scopri le opzioni disponibili
        e i tempi stimati.
      </p>

      <div className="mb-10 overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Opzione</th>
              <th className="px-4 py-3 text-left font-medium">Tempi</th>
              <th className="px-4 py-3 text-left font-medium">Costo</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <tr>
              <td className="px-4 py-3">Standard</td>
              <td className="px-4 py-3">3–5 giorni lavorativi</td>
              <td className="px-4 py-3">€4,90 (gratis sopra €49)</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Express</td>
              <td className="px-4 py-3">1–2 giorni lavorativi</td>
              <td className="px-4 py-3">€9,90</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Same Day</td>
              <td className="px-4 py-3">Stesso giorno (ordine entro le 12:00)</td>
              <td className="px-4 py-3">€14,90</td>
            </tr>
          </tbody>
        </table>
      </div>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Tracciamento</h2>
        <p className="text-muted-foreground">
          Riceverai una email con il numero di tracciamento non appena il tuo ordine
          verrà affidato al corriere. Puoi seguire la spedizione direttamente dalla sezione
          "I miei ordini" del tuo account.
        </p>
      </section>
    </main>
  );
}
