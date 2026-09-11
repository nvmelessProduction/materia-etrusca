import type { ZonaSpedizione } from '@/db/schema'

/**
 * I corrieri italiani fanno tre prezzi: penisola, isole, estero.
 * Il CAP basta a distinguerli, purché si tengano presenti anche le isole
 * minori: lì il supplemento c'è comunque, anche se il CAP è "continentale".
 */

/** CAP delle isole minori, dove il corriere applica il supplemento isole. */
const CAP_ISOLE_MINORI = new Set([
  // Arcipelago toscano
  '57030',
  '57031',
  '57032',
  '57033',
  '57034',
  '57036',
  '57037',
  '57038',
  '57039',
  '58012',
  '58019',
  // Isole Pontine
  '04027',
  // Golfo di Napoli
  '80070',
  '80071',
  '80073',
  '80074',
  '80075',
  '80076',
  '80077',
  // Isole Tremiti
  '71040',
  // Isole del Nord Adriatico e lagunari abitate servite via traghetto
  '30142',
])

function numerico(cap: string): number | null {
  const pulito = cap.trim()
  if (!/^\d{5}$/.test(pulito)) return null
  return Number.parseInt(pulito, 10)
}

/**
 * Restituisce la zona a partire dal CAP, o `null` se il CAP non è valido.
 * Per l'estero il CAP non serve: decide il paese.
 */
export function zonaDaCap(cap: string, paese = 'IT'): ZonaSpedizione | null {
  if (paese.toUpperCase() !== 'IT') return 'estero'

  const valore = numerico(cap)
  if (valore === null) return null

  const pulito = cap.trim()
  if (CAP_ISOLE_MINORI.has(pulito)) return 'isole'

  // Sardegna: 07000–09999. Sicilia: 90000–98999.
  if (valore >= 7000 && valore <= 9999) return 'isole'
  if (valore >= 90000 && valore <= 98999) return 'isole'

  return 'italia'
}

export const ETICHETTE_ZONA: Record<ZonaSpedizione, string> = {
  italia: 'Italia peninsulare',
  isole: 'Sicilia, Sardegna e isole minori',
  estero: 'Estero',
}
