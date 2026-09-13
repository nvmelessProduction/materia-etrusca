import { db } from '@/db'
import { asc, eq, sql } from 'drizzle-orm'
import { collections, products } from '@/db/schema'
import { EditorCollezioni, type CollezioneEditor } from '@/components/admin/editor-collezioni'
import { TitoloAdmin } from '@/components/admin/guscio'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Collezioni' }

export default async function PaginaCollezioni() {
  const righe = await db
    .select({
      id: collections.id,
      nome: collections.name,
      slug: collections.slug,
      descrizione: collections.description,
      heroImageUrl: collections.heroImageUrl,
      posizione: collections.position,
      archiviataIl: collections.archivedAt,
      seoTitle: collections.seoTitle,
      seoDescription: collections.seoDescription,
      prodotti: sql<number>`count(${products.id})::int`,
    })
    .from(collections)
    .leftJoin(products, eq(products.collectionId, collections.id))
    .groupBy(collections.id)
    .orderBy(asc(collections.position), asc(collections.name))

  const collezioni: CollezioneEditor[] = righe.map((riga) => ({
    id: riga.id,
    nome: riga.nome,
    slug: riga.slug,
    descrizione: riga.descrizione ?? '',
    heroImageUrl: riga.heroImageUrl ?? '',
    posizione: riga.posizione,
    prodotti: riga.prodotti,
    archiviata: riga.archiviataIl !== null,
    seoTitle: riga.seoTitle ?? '',
    seoDescription: riga.seoDescription ?? '',
  }))

  return (
    <div className="space-y-8">
      <TitoloAdmin
        titolo="Collezioni"
        sottotitolo="L’ordine qui è l’ordine con cui compaiono in vetrina."
      />
      <EditorCollezioni collezioni={collezioni} />
    </div>
  )
}
