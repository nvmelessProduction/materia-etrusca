import { elencoSconti } from '@/db/queries/admin'
import { EditorSconti, type ScontoEditor } from '@/components/admin/editor-sconti'
import { TitoloAdmin } from '@/components/admin/guscio'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sconti' }

export default async function PaginaSconti() {
  const righe = await elencoSconti()

  const sconti: ScontoEditor[] = righe.map((riga) => ({
    id: riga.id,
    codice: riga.code,
    tipo: riga.type,
    valore: riga.value,
    minimoOrdineCents: riga.minOrderCents,
    limiteUtilizzi: riga.usageLimit,
    utilizzi: riga.usedCount,
    scadenza: riga.expiresAt ? riga.expiresAt.toISOString() : null,
    attivo: riga.active,
  }))

  return (
    <div className="space-y-8">
      <TitoloAdmin
        titolo="Codici sconto"
        sottotitolo="Lo sconto si applica alla merce, mai alla spedizione."
      />
      <EditorSconti sconti={sconti} />
    </div>
  )
}
