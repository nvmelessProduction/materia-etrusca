'use server'

import { cercaProdotti } from '@/db/queries/prodotti'
import type { ProdottoVetrina } from '@/lib/catalogo/tipi'
import { leggiFiltri, type ParametriGrezzi } from '@/lib/catalogo/parametri'

export type PaginaCatalogo = {
  prodotti: ProdottoVetrina[]
  haAltre: boolean
  pagina: number
}

/**
 * Pagina successiva del catalogo, per il caricamento progressivo.
 * Riceve la query string così com'è e la rivalida qui: quello che arriva
 * dal client è testo, non una promessa.
 */
export async function caricaAltriProdotti(
  queryString: string,
  collezioneSlug: string | null,
  pagina: number,
): Promise<PaginaCatalogo> {
  const parametri: ParametriGrezzi = Object.fromEntries(new URLSearchParams(queryString).entries())
  const filtri = leggiFiltri(parametri, collezioneSlug ?? undefined)
  const paginaRichiesta = Math.max(1, Math.min(500, Math.trunc(pagina)))

  const esito = await cercaProdotti({ ...filtri, pagina: paginaRichiesta })

  return { prodotti: esito.prodotti, haAltre: esito.haAltre, pagina: paginaRichiesta }
}
