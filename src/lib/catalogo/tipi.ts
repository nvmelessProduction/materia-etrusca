import type { Finitura } from '@/db/schema'

/**
 * Tipi e costanti del catalogo condivisi fra server e client.
 * Stanno qui, e non accanto alle query, perché i filtri girano anche nel
 * browser: `src/db/queries/*` è codice che il client non deve mai importare.
 */

export const ORDINAMENTI = [
  'novita',
  'prezzo-asc',
  'prezzo-desc',
  'altezza-asc',
  'altezza-desc',
] as const

export type Ordinamento = (typeof ORDINAMENTI)[number]

export const ETICHETTE_ORDINAMENTO: Record<Ordinamento, string> = {
  novita: 'Novità',
  'prezzo-asc': 'Prezzo crescente',
  'prezzo-desc': 'Prezzo decrescente',
  'altezza-asc': 'Dal più basso',
  'altezza-desc': 'Dal più alto',
}

export const PER_PAGINA_PREDEFINITO = 12

export type FiltriCatalogo = {
  collezioneSlug?: string
  altezzaMinCm?: number
  altezzaMaxCm?: number
  finiture?: Finitura[]
  prezzoMinCents?: number
  prezzoMaxCents?: number
  soloDisponibili?: boolean
  ambiente?: 'interno' | 'esterno'
  ordinamento?: Ordinamento
  pagina?: number
  perPagina?: number
}

export type ImmagineVetrina = { url: string; alt: string }

export type ProdottoVetrina = {
  id: string
  slug: string
  nome: string
  collezione: { slug: string; nome: string } | null
  prezzoMinCents: number
  prezzoMaxCents: number
  altezzaMinCm: number
  altezzaMaxCm: number
  pezzoUnico: boolean
  suOrdinazione: boolean
  giorniDiAttesa: number
  acquistabile: boolean
  interno: boolean
  esterno: boolean
  immagine: ImmagineVetrina | null
  immagineSecondaria: ImmagineVetrina | null
  creatoIl: Date
}

export type EsitoCatalogo = {
  prodotti: ProdottoVetrina[]
  totale: number
  pagina: number
  perPagina: number
  haAltre: boolean
}

export type EstremiCatalogo = {
  altezzaMinCm: number
  altezzaMaxCm: number
  prezzoMinCents: number
  prezzoMaxCents: number
  finiture: Finitura[]
}
