import type { Finitura } from '@/db/schema'

/**
 * Forma "pulita" di una variante per la logica di dominio: numeri veri,
 * non le stringhe che Postgres restituisce per le colonne `numeric`.
 * Le funzioni di dominio lavorano solo su questi tipi, così restano
 * testabili senza database.
 */
export type VarianteDominio = {
  id: string
  sku: string
  altezzaCm: number
  diametroCm: number
  pesoKg: number
  finitura: Finitura
  prezzoCents: number
  giacenza: number
  pesoImballoKg: number
  volumeImballoL: number
  posizione: number
}

export type ProdottoDominio = {
  id: string
  slug: string
  nome: string
  prezzoBaseCents: number
  pezzoUnico: boolean
  suOrdinazione: boolean
  giorniDiAttesa: number
}

export type ScontoDominio = {
  codice: string
  tipo: 'percent' | 'fixed'
  valore: number
  minimoOrdineCents: number
  limiteUtilizzi: number | null
  utilizzi: number
  scadenza: Date | null
  attivo: boolean
}
