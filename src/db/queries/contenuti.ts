import 'server-only'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { contentBlocks } from '@/db/schema'

export type Contenuto = { chiave: string; titolo: string; corpo: string }

/** I testi modificabili dal pannello. Se non ci sono, le pagine usano i loro. */
export async function contenutiDelGruppo(gruppo: string): Promise<Contenuto[]> {
  const righe = await db
    .select()
    .from(contentBlocks)
    .where(and(eq(contentBlocks.group, gruppo), eq(contentBlocks.published, true)))
    .orderBy(asc(contentBlocks.position))

  return righe.map((riga) => ({
    chiave: riga.key,
    titolo: riga.title ?? '',
    corpo: riga.body,
  }))
}

export async function contenuto(chiave: string): Promise<Contenuto | null> {
  const [riga] = await db
    .select()
    .from(contentBlocks)
    .where(and(eq(contentBlocks.key, chiave), eq(contentBlocks.published, true)))
    .limit(1)

  if (!riga) return null
  return { chiave: riga.key, titolo: riga.title ?? '', corpo: riga.body }
}

export type EsempioPrimaDopo = {
  chiave: string
  titolo: string
  prima: string
  dopo: string
  didascalia: string
}

/**
 * Gli esempi "prima e dopo" della home. Ogni blocco del gruppo `vetrina`
 * contiene tre righe: foto di partenza, foto finale, didascalia.
 * Così l'artigiano li cambia dal pannello senza toccare il codice.
 */
export async function esempiPrimaDopo(): Promise<EsempioPrimaDopo[]> {
  const blocchi = await contenutiDelGruppo('vetrina')

  return blocchi.flatMap((blocco) => {
    const righe = blocco.corpo
      .split('\n')
      .map((riga) => riga.trim())
      .filter(Boolean)

    const [prima, dopo, ...resto] = righe
    if (!prima || !dopo) return []

    return [
      {
        chiave: blocco.chiave,
        titolo: blocco.titolo,
        prima,
        dopo,
        didascalia: resto.join(' '),
      },
    ]
  })
}
