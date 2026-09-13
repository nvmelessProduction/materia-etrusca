import { elencoContenuti } from '@/db/queries/admin'
import { EditorContenuti, type ContenutoEditor } from '@/components/admin/editor-contenuti'
import { TitoloAdmin } from '@/components/admin/guscio'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Testi' }

export default async function PaginaContenuti() {
  const righe = await elencoContenuti()

  const contenuti: ContenutoEditor[] = righe.map((riga) => ({
    id: riga.id,
    chiave: riga.key,
    gruppo: riga.group,
    titolo: riga.title ?? '',
    corpo: riga.body,
    posizione: riga.position,
    pubblicato: riga.published,
  }))

  return (
    <div className="space-y-8">
      <TitoloAdmin
        titolo="Testi del sito"
        sottotitolo="Domande frequenti e pagine fisse, modificabili senza toccare il codice."
      />
      <EditorContenuti contenuti={contenuti} />
    </div>
  )
}
