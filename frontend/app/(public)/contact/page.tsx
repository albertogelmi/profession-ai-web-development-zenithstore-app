import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contattaci - ZenithStore',
  description: 'Hai bisogno di aiuto? Contatta il team di ZenithStore.',
};

export default function ContactPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-6 text-4xl font-bold">Contattaci</h1>
      <p className="mb-8 text-lg text-muted-foreground">
        Siamo qui per aiutarti. Scegli il canale più comodo per metterti in contatto
        con il nostro team.
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-lg font-semibold">Email</h2>
          <p className="text-muted-foreground">support@zenithstore.it</p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-lg font-semibold">Telefono</h2>
          <p className="text-muted-foreground">+39 02 1234 5678</p>
          <p className="mt-1 text-sm text-muted-foreground">Lun–Ven, 9:00–18:00</p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-lg font-semibold">Chat Live</h2>
          <p className="text-muted-foreground">Disponibile sul sito nelle ore lavorative.</p>
        </div>
        <div className="rounded-lg border p-6">
          <h2 className="mb-2 text-lg font-semibold">Sede</h2>
          <p className="text-muted-foreground">Via Roma 1, 20100 Milano (MI)</p>
        </div>
      </div>
    </main>
  );
}
