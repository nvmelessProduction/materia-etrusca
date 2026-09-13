import type { Metadata } from 'next'
import Link from 'next/link'
import { PaginaTesto } from '@/components/editoriale/pagina-testo'
import { fasceSpedizione } from '@/db/queries/spedizioni'
import { ETICHETTE_ZONA } from '@/lib/spedizioni/zone'
import { SOGLIA_PREVENTIVO_KG } from '@/lib/spedizioni/motore'
import { formatNumber, formatPrice } from '@/lib/utils'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Spedizioni e resi',
  description:
    'Quanto costa spedire un vaso in cemento, quanto ci mette, chi lo porta su e cosa succede se arriva rotto o non ti piace.',
  alternates: { canonical: '/spedizioni-e-resi' },
}

export default async function PaginaSpedizioni() {
  const fasce = await fasceSpedizione()
  const corriere = fasce
    .filter((fascia) => fascia.metodo === 'courier')
    .sort((a, b) => a.minPesoKg - b.minPesoKg)

  const zone = ['italia', 'isole', 'estero'] as const

  return (
    <PaginaTesto
      occhiello="Come arriva"
      titolo="Pesa. Parliamone prima."
      introduzione="Un vaso da sessanta centimetri pesa quanto un sacco di cemento. Il trasporto non è un dettaglio in fondo al carrello: è metà della decisione, e preferisco dirtelo all’inizio."
    >
      <h2>Quanto costa</h2>
      <p>
        Il prezzo si calcola sul peso a imballo, che è quello del pezzo più la cassa. Lo vedi già
        sulla scheda prodotto: scrivi il CAP e ti dico la cifra esatta, senza aspettare il
        pagamento.
      </p>

      {zone.map((zona) => {
        const righe = corriere.filter((fascia) => fascia.zona === zona)
        if (righe.length === 0) return null
        return (
          <div key={zona} className="mt-6">
            <h3>{ETICHETTE_ZONA[zona]}</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-sm border-collapse text-sm">
                <thead>
                  <tr className="border-bordo border-b text-left">
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Peso
                    </th>
                    <th scope="col" className="py-2 pr-4 font-medium">
                      Prezzo
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      Consegna
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {righe.map((fascia) => (
                    <tr key={fascia.id} className="border-bordo/60 border-b">
                      <td className="py-2.5 pr-4 tabular-nums">
                        fino a {formatNumber(fascia.maxPesoKg, 0)} kg
                      </td>
                      <td className="py-2.5 pr-4 tabular-nums">
                        {formatPrice(fascia.prezzoCents)}
                      </td>
                      <td className="py-2.5 tabular-nums">{fascia.etaGiorni} giorni</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      <h2>Sopra i {SOGLIA_PREVENTIVO_KG} kg</h2>
      <p>
        Non faccio prezzo automatico. Si va su pallet, e il pallet si quota caso per caso: chiedo io
        al trasportatore e ti scrivo la cifra prima che tu paghi qualcosa. Di solito ci vogliono un
        paio di giorni per avere la risposta.
      </p>

      <h2>Chi lo porta su</h2>
      <p>
        Il corriere consegna al piano strada e chiama prima di arrivare: per questo il numero di
        telefono è obbligatorio al momento dell’ordine. Se il pezzo supera i trenta chili puoi
        aggiungere la consegna al piano, e te lo portano su in due fin dentro casa.
      </p>
      <p>
        Se abiti in una zona a traffico limitato, o al quarto piano senza ascensore, scrivilo nelle
        note di consegna. Il corriere lo legge, e chi non lo scrive è chi poi non trova nessuno.
      </p>

      <h2>Ritiro in laboratorio</h2>
      <p>
        A {site.laboratory.city} si ritira gratis. Ti scrivo io quando il pezzo è pronto e ci
        mettiamo d’accordo sull’orario: se passi, te lo carico in macchina io.
      </p>

      <h2>Imballo</h2>
      <p>
        Ogni pezzo parte su misura: angolari, pluriball, cassa di cartone doppia onda e, sopra i
        cinquanta chili, bancale. Apri con calma e controlla i bordi prima di buttare l’imballo.
      </p>

      <h2>Se arriva rotto</h2>
      <p>
        Mandami due foto entro tre giorni — il pezzo e l’imballo — e lo rifaccio io, senza discutere
        e senza costi per te. Non devo capire di chi è la colpa: mi interessa che tu abbia il vaso.
      </p>

      <h2>Se non ti piace</h2>
      <p>
        Hai quattordici giorni dalla consegna per ripensarci. Il pezzo deve tornare integro e nel
        suo imballo originale, e le spese di rientro sono a tuo carico: su un pezzo pesante non sono
        poche, quindi se hai un dubbio scrivimi <em>prima</em> di ordinare — o mandami la foto dello
        spazio e ti dico io se è il pezzo giusto.
      </p>
      <p>
        Il rimborso arriva entro quattordici giorni da quando ricevo il reso. I pezzi fatti su
        misura, per legge e per buon senso, non si possono rendere.
      </p>

      <p className="mt-10">
        <Link href="/progetto" className="hover:text-terracotta underline underline-offset-4">
          Non sei sicuro delle misure? Mandami la foto.
        </Link>
      </p>
    </PaginaTesto>
  )
}
