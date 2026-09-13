import type { Metadata } from 'next'
import Link from 'next/link'
import { PaginaTesto } from '@/components/editoriale/pagina-testo'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'Quali dati raccolgo, perché, per quanto tempo li tengo e come cancellarli. Comprese le foto che mi mandi per il progetto.',
  alternates: { canonical: '/privacy' },
}

export default function PaginaPrivacy() {
  return (
    <PaginaTesto
      occhiello="Legale"
      titolo="Privacy"
      introduzione="Qui non c’è un reparto marketing. I tuoi dati li vedo io, e li uso solo per fare quello che mi hai chiesto."
      aggiornata="settembre 2026"
    >
      <h2>Chi tratta i dati</h2>
      <p>
        Il titolare del trattamento è {site.legal.companyName}, {site.laboratory.street},{' '}
        {site.laboratory.postalCode} {site.laboratory.city} ({site.laboratory.province}), partita
        IVA {site.legal.vatNumber}. Per qualunque cosa: {site.artisan.email}.
      </p>

      <h2>Cosa raccolgo, e perché</h2>

      <h3>Se compri</h3>
      <p>
        Nome, email, telefono, indirizzo di consegna, eventuali note, e — se chiedi la fattura —
        partita IVA e codice SDI. Mi servono per eseguire il contratto: preparare il pezzo,
        spedirlo, emettere il documento fiscale. Il telefono lo do al corriere, che senza non
        consegna.
      </p>
      <p>
        <strong>Per quanto:</strong> dieci anni, perché è il termine di conservazione dei documenti
        contabili.
      </p>

      <h3>Se mi mandi le foto del tuo spazio</h3>
      <p>
        Le fotografie che carichi, le misure, l’esposizione, le note e i tuoi contatti. Li uso
        soltanto per prepararti la proposta. Le foto non finiscono sui social, non le mostro ad
        altri clienti e non le do a nessuno.
      </p>
      <p>
        <strong>Per quanto:</strong> le foto vengono cancellate automaticamente dopo dodici mesi,
        dall’archivio e dal database. Se me lo chiedi prima, le cancello subito.
      </p>

      <h3>Se ti iscrivi alle novità</h3>
      <p>
        Solo l’email. Il consenso è separato da quello dell’ordine: comprare non ti iscrive a
        niente. Ti cancelli dal link in fondo a ogni messaggio, o scrivendomi.
      </p>

      <h3>Se crei un account</h3>
      <p>
        Email e storico degli ordini. L’accesso funziona con un link temporaneo: non conservo
        password, perché non ne creo.
      </p>

      <h2>A chi passano i dati</h2>
      <p>Solo a chi serve per farti arrivare il pezzo, e ognuno vede solo la sua parte:</p>
      <ul>
        <li>
          <strong>Stripe</strong> e <strong>PayPal</strong> per i pagamenti. I dati della carta li
          gestiscono loro: io non li ricevo mai.
        </li>
        <li>
          <strong>Il corriere</strong> per la consegna: nome, indirizzo, telefono, note.
        </li>
        <li>
          <strong>Resend</strong> per l’invio delle email transazionali.
        </li>
        <li>
          <strong>Uploadthing</strong> per conservare le foto che carichi.
        </li>
        <li>
          <strong>Vercel</strong> per l’infrastruttura del sito, e il fornitore del database.
        </li>
        <li>Il mio commercialista, per gli obblighi fiscali.</li>
      </ul>
      <p>
        Alcuni di questi fornitori possono trattare dati fuori dall’Unione Europea: in quel caso il
        trasferimento avviene sulla base delle clausole contrattuali standard approvate dalla
        Commissione Europea.
      </p>

      <h2>Cookie</h2>
      <p>
        Uso solo i cookie tecnici necessari a far funzionare il carrello e l’accesso. Non ho
        strumenti di profilazione né pubblicità. I dettagli sono nella{' '}
        <Link href="/cookie" className="underline underline-offset-4">
          pagina sui cookie
        </Link>
        .
      </p>

      <h2>I tuoi diritti</h2>
      <p>
        Puoi chiedermi di vedere i tuoi dati, correggerli, cancellarli, limitarne l’uso, riceverli
        in un formato leggibile da una macchina o oppormi al trattamento. Scrivi a{' '}
        <a href={`mailto:${site.artisan.email}`} className="underline underline-offset-4">
          {site.artisan.email}
        </a>
        : ti rispondo entro trenta giorni.
      </p>

      <h3>Come faccio a farmi cancellare</h3>
      <p>
        Mandami una email con scritto «cancellami» dall’indirizzo che hai usato. Cancello subito
        foto, note e contatti. Restano solo i dati delle fatture già emesse, che per legge devo
        conservare dieci anni: quelli non posso toccarli, e nessuno li usa per scriverti.
      </p>

      <p>
        Se ritieni che stia trattando i tuoi dati in modo scorretto, puoi rivolgerti al Garante per
        la protezione dei dati personali (garanteprivacy.it).
      </p>
    </PaginaTesto>
  )
}
