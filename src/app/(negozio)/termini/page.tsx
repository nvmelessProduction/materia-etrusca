import type { Metadata } from 'next'
import Link from 'next/link'
import { PaginaTesto } from '@/components/editoriale/pagina-testo'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Termini e condizioni',
  description:
    'Condizioni generali di vendita di Materia Etrusca: ordini, prezzi, consegne, recesso e garanzie.',
  alternates: { canonical: '/termini' },
}

export default function PaginaTermini() {
  return (
    <PaginaTesto
      occhiello="Legale"
      titolo="Termini e condizioni di vendita"
      introduzione="Scritti in italiano comprensibile. Se qualcosa non ti torna, scrivimi prima di ordinare."
      aggiornata="settembre 2026"
    >
      <h2>1. Chi vende</h2>
      <p>
        {site.legal.companyName}, con sede in {site.laboratory.street}, {site.laboratory.postalCode}{' '}
        {site.laboratory.city} ({site.laboratory.province}), partita IVA {site.legal.vatNumber}, REA{' '}
        {site.legal.reaNumber}. Email: {site.artisan.email}.
      </p>

      <h2>2. Cosa vendo</h2>
      <p>
        Vasi e complementi in cemento colato e rifinito a mano. Ogni pezzo è realizzato
        artigianalmente: colore, porosità e finitura variano leggermente da un esemplare all’altro,
        e le misure possono differire di mezzo centimetro. Non sono difetti di conformità: sono la
        conseguenza del metodo, ed è la ragione per cui il prodotto costa quello che costa.
      </p>
      <p>
        Le fotografie sono indicative. La resa del colore dipende dallo schermo con cui le guardi.
      </p>

      <h2>3. Come si conclude l’ordine</h2>
      <p>
        Il contratto si conclude quando ricevi da me l’email di conferma dell’ordine. Fino a quel
        momento posso rifiutare un ordine, per esempio se il pezzo si è esaurito nel frattempo o se
        i dati di consegna sono incompleti. In caso di rifiuto, qualunque somma versata ti viene
        restituita per intero.
      </p>
      <p>
        Non è necessario registrarsi per acquistare. L’account è facoltativo e serve solo a rivedere
        i tuoi ordini.
      </p>

      <h2>4. Prezzi</h2>
      <p>
        I prezzi sono in euro e comprendono l’IVA. Le spese di spedizione sono indicate prima del
        pagamento e calcolate sul peso a imballo e sulla destinazione. Oltre i 70 kg complessivi la
        spedizione è quotata caso per caso: te la comunico per iscritto prima di qualunque addebito.
      </p>

      <h2>5. Pagamento</h2>
      <p>
        Si paga con carta (tramite Stripe, che tratta i dati della carta: io non li vedo mai), con
        PayPal o con bonifico bancario. Con il bonifico l’ordine resta in attesa e il pezzo viene
        messo da parte fino a quando ricevo l’accredito; se non arriva entro sette giorni l’ordine
        viene annullato e il pezzo torna disponibile.
      </p>
      <p>
        La fattura viene emessa su richiesta, indicando partita IVA e codice destinatario SDI al
        momento dell’ordine.
      </p>

      <h2>6. Consegna</h2>
      <p>
        Spedisco in Italia e, su richiesta, all’estero. I pezzi a magazzino partono entro due giorni
        lavorativi; quelli su ordinazione hanno il tempo di lavorazione indicato sulla scheda. Il
        corriere consegna al piano strada e contatta telefonicamente prima della consegna: per
        questo il numero di telefono è obbligatorio.
      </p>
      <p>
        Al ricevimento controlla l’imballo. Se è visibilmente danneggiato, accetta la merce con
        riserva scritta sulla bolla del corriere: senza quella riserva il trasportatore non risponde
        del danno.
      </p>

      <h2>7. Diritto di recesso</h2>
      <p>
        Se acquisti come consumatore hai quattordici giorni dal ricevimento per recedere, senza
        doverne spiegare il motivo. Basta scrivermi a {site.artisan.email}.
      </p>
      <p>
        Il pezzo va restituito integro e nel suo imballo originale entro quattordici giorni dalla
        comunicazione. Le spese di restituzione sono a tuo carico: su pezzi pesanti possono essere
        rilevanti, quindi valutale prima di ordinare. Ti rimborso entro quattordici giorni dal
        ricevimento del reso, con lo stesso mezzo di pagamento che hai usato.
      </p>
      <p>
        Il recesso non si applica ai pezzi realizzati su misura o personalizzati su tua richiesta.
      </p>

      <h2>8. Garanzia</h2>
      <p>
        Vale la garanzia legale di conformità di due anni. Se il pezzo arriva rotto o presenta un
        difetto reale, mandami due fotografie entro tre giorni dalla consegna: lo sostituisco o lo
        rifaccio a mie spese. Le variazioni di colore, le bolle d’aria e le piccole irregolarità
        superficiali, essendo caratteristiche del prodotto artigianale, non costituiscono difetto.
      </p>
      <p>
        La garanzia non copre i danni da gelo quando il pezzo è stato lasciato con acqua stagnante
        sotto il fondo, né le rotture da caduta o urto.
      </p>

      <h2>9. Reclami e controversie</h2>
      <p>
        Scrivimi: risolvere direttamente conviene a entrambi. Se proprio non ci si riesce, puoi
        usare la piattaforma europea di risoluzione delle controversie online. Per le controversie
        con i consumatori è competente il foro del luogo di residenza o domicilio del consumatore.
      </p>

      <h2>10. Legge applicabile</h2>
      <p>
        Si applica la legge italiana, con il Codice del Consumo per gli acquisti dei consumatori.
      </p>

      <p className="mt-10">
        Vedi anche:{' '}
        <Link href="/spedizioni-e-resi" className="underline underline-offset-4">
          spedizioni e resi
        </Link>{' '}
        e{' '}
        <Link href="/privacy" className="underline underline-offset-4">
          privacy
        </Link>
        .
      </p>
    </PaginaTesto>
  )
}
