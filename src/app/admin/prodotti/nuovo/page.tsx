import { elencoCollezioniAdmin } from '@/db/queries/admin'
import { EditorProdotto } from '@/components/admin/editor-prodotto'
import { TitoloAdmin } from '@/components/admin/guscio'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Nuovo pezzo' }

export default async function PaginaNuovoProdotto() {
  const collezioni = await elencoCollezioniAdmin()

  return (
    <div className="space-y-8">
      <TitoloAdmin
        titolo="Nuovo pezzo"
        sottotitolo="Nasce in bozza. Varianti e foto si aggiungono dopo aver salvato."
      />
      <EditorProdotto
        iniziale={{}}
        collezioni={collezioni.map((collezione) => ({ id: collezione.id, nome: collezione.nome }))}
      />
    </div>
  )
}
