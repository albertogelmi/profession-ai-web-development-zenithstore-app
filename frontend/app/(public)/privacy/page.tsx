import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - ZenithStore',
  description: 'Informativa sulla privacy e trattamento dei dati personali di ZenithStore.',
};

export default function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-6 text-4xl font-bold">Privacy Policy</h1>
      <p className="mb-4 text-sm text-muted-foreground">Ultimo aggiornamento: 1 gennaio 2025</p>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">1. Titolare del trattamento</h2>
        <p className="text-muted-foreground">
          Il titolare del trattamento dei dati personali è ZenithStore S.r.l., con sede in
          Via Roma 1, 20100 Milano.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">2. Dati raccolti</h2>
        <p className="text-muted-foreground">
          Raccogliamo dati identificativi (nome, email, indirizzo), dati di navigazione e
          informazioni sugli acquisti al fine di erogare il servizio e migliorare l'esperienza
          utente.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">3. Base giuridica e finalità</h2>
        <p className="text-muted-foreground">
          I dati vengono trattati sulla base del contratto (esecuzione dell'ordine), del consenso
          (newsletter e marketing) e degli obblighi di legge (fatturazione).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-semibold">4. Diritti dell'interessato</h2>
        <p className="text-muted-foreground">
          Hai diritto di accedere ai tuoi dati, rettificarli, cancellarli, limitarne il
          trattamento e opporti al loro utilizzo. Puoi esercitare questi diritti scrivendo a
          privacy@zenithstore.it.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">5. Cookie</h2>
        <p className="text-muted-foreground">
          Utilizziamo cookie tecnici necessari al funzionamento del sito e, previo consenso,
          cookie analitici e di profilazione. Puoi gestire le preferenze dal banner cookie.
        </p>
      </section>
    </main>
  );
}
