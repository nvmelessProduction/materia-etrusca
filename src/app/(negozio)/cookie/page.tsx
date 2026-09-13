import type { Metadata } from 'next'
import Link from 'next/link'
import { PaginaTesto } from '@/components/editoriale/pagina-testo'
import { PreferenzeCookie } from '@/components/conformita/preferenze-cookie'

export const metadata: Metadata = {
  title: 'Cookie',
  description:
    'Quali cookie usa questo sito: solo quelli tecnici del carrello e dell’accesso. Nessuna profilazione, nessuna pubblicità.',
  alternates: { canonical: '/cookie' },
}

export default function PaginaCookie() {
  return (
    <PaginaTesto
      occhiello="Legale"
      titolo="Cookie"
      introduzione="Pochi, tecnici, e nessuno che ti segua in giro per internet."
      aggiornata="settembre 2026"
    >
      <h2>Cookie necessari</h2>
      <p>
        Questi non si possono disattivare: senza, il sito non funziona. Non richiedono il tuo
        consenso perché servono solo a fare quello che gli hai chiesto.
      </p>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-md border-collapse text-sm">
          <thead>
            <tr className="border-bordo border-b text-left">
              <th scope="col" className="py-2 pr-4 font-medium">
                Nome
              </th>
              <th scope="col" className="py-2 pr-4 font-medium">
                A cosa serve
              </th>
              <th scope="col" className="py-2 font-medium">
                Durata
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-bordo/60 border-b">
              <td className="py-2.5 pr-4 font-mono text-xs">me_carrello</td>
              <td className="py-2.5 pr-4">Tiene il tuo carrello anche se non hai un account.</td>
              <td className="py-2.5">1 anno</td>
            </tr>
            <tr className="border-bordo/60 border-b">
              <td className="py-2.5 pr-4 font-mono text-xs">authjs.session-token</td>
              <td className="py-2.5 pr-4">Ti tiene collegato, se hai fatto l’accesso.</td>
              <td className="py-2.5">90 giorni</td>
            </tr>
            <tr className="border-bordo/60 border-b">
              <td className="py-2.5 pr-4 font-mono text-xs">me_consenso</td>
              <td className="py-2.5 pr-4">
                Ricorda la scelta che hai fatto sul banner, per non richiedertela.
              </td>
              <td className="py-2.5">6 mesi</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Cookie di misurazione</h2>
      <p>
        Sono spenti finché non li accetti tu. Se li accetti, conto quante persone visitano le
        pagine, in forma aggregata: mi serve a capire se la pagina del progetto funziona o no.
        Nessun profilo, nessuna pubblicità, nessun dato venduto a nessuno.
      </p>
      <p>
        Finché non dai il consenso, nessuno script di misurazione viene caricato: non è che viene
        caricato e poi ignorato — proprio non parte.
      </p>

      <h2>Cambia idea quando vuoi</h2>
      <PreferenzeCookie />

      <p className="mt-10">
        Per il resto, vedi la{' '}
        <Link href="/privacy" className="underline underline-offset-4">
          privacy
        </Link>
        .
      </p>
    </PaginaTesto>
  )
}
