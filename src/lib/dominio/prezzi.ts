import type { ProdottoDominio, ScontoDominio, VarianteDominio } from '@/lib/dominio/tipi'

/**
 * Tutti gli importi sono interi in centesimi. Mai float: 0.1 + 0.2 non fa 0.3
 * e su un carrello da quattro pezzi la differenza si vede in fattura.
 */

export function prezzoVariante(variante: VarianteDominio, prodotto: ProdottoDominio): number {
  // Il prezzo della variante ha la precedenza; quello base è la rete di sicurezza.
  return variante.prezzoCents > 0 ? variante.prezzoCents : prodotto.prezzoBaseCents
}

export function totaleRiga(prezzoUnitarioCents: number, quantita: number): number {
  if (!Number.isInteger(prezzoUnitarioCents) || prezzoUnitarioCents < 0) {
    throw new Error('Il prezzo unitario deve essere un intero non negativo in centesimi.')
  }
  if (!Number.isInteger(quantita) || quantita < 0) {
    throw new Error('La quantità deve essere un intero non negativo.')
  }
  return prezzoUnitarioCents * quantita
}

export function subtotale(
  righe: readonly { prezzoUnitarioCents: number; quantita: number }[],
): number {
  return righe.reduce(
    (somma, riga) => somma + totaleRiga(riga.prezzoUnitarioCents, riga.quantita),
    0,
  )
}

/** Estremi del listino di un prodotto: servono per la card "da € X". */
export function fasciaPrezzo(
  varianti: readonly VarianteDominio[],
  prodotto: ProdottoDominio,
): { minCents: number; maxCents: number } {
  if (varianti.length === 0) {
    return { minCents: prodotto.prezzoBaseCents, maxCents: prodotto.prezzoBaseCents }
  }
  const prezzi = varianti.map((variante) => prezzoVariante(variante, prodotto))
  return { minCents: Math.min(...prezzi), maxCents: Math.max(...prezzi) }
}

export type EsitoSconto =
  { valido: true; scontoCents: number } | { valido: false; motivo: MotivoScontoNonValido }

export type MotivoScontoNonValido =
  'inesistente' | 'disattivato' | 'scaduto' | 'esaurito' | 'sotto-minimo'

const MOTIVI: Record<MotivoScontoNonValido, string> = {
  inesistente: 'Questo codice non esiste.',
  disattivato: 'Questo codice non è più valido.',
  scaduto: 'Questo codice è scaduto.',
  esaurito: 'Questo codice ha già raggiunto il numero massimo di utilizzi.',
  'sotto-minimo': 'Il carrello non raggiunge il minimo richiesto da questo codice.',
}

export function spiegaScontoNonValido(motivo: MotivoScontoNonValido): string {
  return MOTIVI[motivo]
}

/**
 * Validazione e calcolo dello sconto. Va eseguita **sempre** lato server:
 * il codice che arriva dal client è solo una stringa, non una promessa.
 */
export function calcolaSconto(
  sconto: ScontoDominio | null,
  subtotaleCents: number,
  adesso: Date = new Date(),
): EsitoSconto {
  if (!sconto) return { valido: false, motivo: 'inesistente' }
  if (!sconto.attivo) return { valido: false, motivo: 'disattivato' }
  if (sconto.scadenza && sconto.scadenza.getTime() <= adesso.getTime()) {
    return { valido: false, motivo: 'scaduto' }
  }
  if (sconto.limiteUtilizzi !== null && sconto.utilizzi >= sconto.limiteUtilizzi) {
    return { valido: false, motivo: 'esaurito' }
  }
  if (subtotaleCents < sconto.minimoOrdineCents) {
    return { valido: false, motivo: 'sotto-minimo' }
  }

  const grezzo =
    sconto.tipo === 'percent' ? Math.round((subtotaleCents * sconto.valore) / 100) : sconto.valore

  // Lo sconto non può superare il subtotale: un ordine non va mai in negativo.
  return { valido: true, scontoCents: Math.max(0, Math.min(grezzo, subtotaleCents)) }
}

export type TotaliOrdine = {
  subtotaleCents: number
  spedizioneCents: number
  scontoCents: number
  totaleCents: number
}

/**
 * Lo sconto si applica alla merce, non alla spedizione: è quello che il cliente
 * si aspetta e quello che scrive la fattura.
 */
export function totaliOrdine(input: {
  subtotaleCents: number
  spedizioneCents: number
  scontoCents: number
}): TotaliOrdine {
  const subtotaleCents = Math.max(0, Math.trunc(input.subtotaleCents))
  const spedizioneCents = Math.max(0, Math.trunc(input.spedizioneCents))
  const scontoCents = Math.min(Math.max(0, Math.trunc(input.scontoCents)), subtotaleCents)

  return {
    subtotaleCents,
    spedizioneCents,
    scontoCents,
    totaleCents: subtotaleCents - scontoCents + spedizioneCents,
  }
}

/** Scorpora l'IVA italiana al 22% da un prezzo che la comprende già. */
export function scorporaIva(
  totaleCents: number,
  aliquota = 22,
): { imponibileCents: number; ivaCents: number } {
  const imponibileCents = Math.round((totaleCents * 100) / (100 + aliquota))
  return { imponibileCents, ivaCents: totaleCents - imponibileCents }
}
