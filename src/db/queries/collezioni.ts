import 'server-only'
import { asc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { collections, products } from '@/db/schema'
import type { Collection } from '@/db/schema'

export type CollezioneConConteggio = Collection & { numeroProdotti: number }

export async function elencoCollezioni(): Promise<CollezioneConConteggio[]> {
  const righe = await db
    .select({
      collezione: collections,
      numeroProdotti: sql<number>`count(${products.id}) filter (where ${products.status} = 'active')::int`,
    })
    .from(collections)
    .leftJoin(products, eq(products.collectionId, collections.id))
    .where(isNull(collections.archivedAt))
    .groupBy(collections.id)
    .orderBy(asc(collections.position), asc(collections.name))

  return righe.map((riga) => ({ ...riga.collezione, numeroProdotti: riga.numeroProdotti }))
}

export async function collezionePerSlug(slug: string): Promise<Collection | null> {
  const [riga] = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1)
  return riga ?? null
}

export async function slugCollezioni(): Promise<string[]> {
  const righe = await db
    .select({ slug: collections.slug })
    .from(collections)
    .where(isNull(collections.archivedAt))
  return righe.map((riga) => riga.slug)
}
