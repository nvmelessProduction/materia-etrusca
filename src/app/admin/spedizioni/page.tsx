import { elencoFasce } from '@/db/queries/admin'
import { numero } from '@/db/queries/mappatori'
import { EditorSpedizioni, type FasciaEditor } from '@/components/admin/editor-spedizioni'
import { TitoloAdmin } from '@/components/admin/guscio'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Spedizioni' }

export default async function PaginaSpedizioni() {
  const righe = await elencoFasce()

  const fasce: FasciaEditor[] = righe.map((riga) => ({
    id: riga.id,
    minPesoKg: numero(riga.minWeightKg),
    maxPesoKg: numero(riga.maxWeightKg),
    metodo: riga.method,
    prezzoCents: riga.priceCents,
    zona: riga.zone,
    etaGiorni: riga.etaDays,
    attiva: riga.active,
  }))

  return (
    <div className="space-y-8">
      <TitoloAdmin
        titolo="Spedizioni"
        sottotitolo="Le fasce di peso su cui il sito calcola il prezzo. Quando il corriere aggiorna il listino, si cambiano qui."
      />
      <EditorSpedizioni fasce={fasce} />
    </div>
  )
}
