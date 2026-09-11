/**
 * Forma del carrello così come viaggia verso il client.
 * I prezzi li calcola sempre il server: qui sono solo di lettura.
 */
export type RigaCarrello = {
  variantId: string
  productId: string
  slug: string
  nomeProdotto: string
  finitura: string
  altezzaCm: number
  diametroCm: number
  pesoKg: number
  pesoImballoKg: number
  immagineUrl: string | null
  immagineAlt: string
  prezzoUnitarioCents: number
  quantita: number
  /** Quante unità sono effettivamente disponibili adesso. */
  disponibili: number
  isUnique: boolean
  isMadeToOrder: boolean
  leadTimeDays: number
  totaleCents: number
}

export type CarrelloPubblico = {
  righe: RigaCarrello[]
  subtotaleCents: number
  pesoTotaleKg: number
  /** Impostato dall'utente per stimare la spedizione prima del checkout. */
  cap: string | null
  codiceSconto: string | null
  scontoCents: number
}

export const carrelloVuoto: CarrelloPubblico = {
  righe: [],
  subtotaleCents: 0,
  pesoTotaleKg: 0,
  cap: null,
  codiceSconto: null,
  scontoCents: 0,
}
