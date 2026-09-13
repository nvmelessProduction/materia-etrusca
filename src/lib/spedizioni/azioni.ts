'use server'

import { z } from 'zod'
import { fasceSpedizione } from '@/db/queries/spedizioni'
import { pesoImballoVariante } from '@/db/queries/carrello'
import { leggiCarrello } from '@/lib/carrello/server'
import {
  calcolaSpedizione,
  opzionePredefinita,
  type RisultatoSpedizione,
} from '@/lib/spedizioni/motore'

export type StimaSpedizione = {
  ok: boolean
  messaggio?: string
  risultato: RisultatoSpedizione | null
  /** L'opzione che proporrei io: la più economica fra quelle vere. */
  migliorePrezzoCents: number | null
  etaGiorni: number | null
}

const schema = z.object({
  variantId: z.string().uuid(),
  quantita: z.number().int().min(1).max(20),
  cap: z.string().trim().max(10).optional(),
})

/**
 * Stima della spedizione per una singola variante, usata sulla scheda prodotto
 * **prima** del carrello: su pezzi che pesano quaranta chili, scoprire il costo
 * al checkout è il motivo numero uno per cui un ordine non si chiude.
 */
export async function stimaSpedizioneVariante(
  variantId: string,
  quantita: number,
  cap?: string,
): Promise<StimaSpedizione> {
  const lettura = schema.safeParse({ variantId, quantita, cap })
  if (!lettura.success) {
    return {
      ok: false,
      messaggio: 'Richiesta non valida.',
      risultato: null,
      migliorePrezzoCents: null,
      etaGiorni: null,
    }
  }

  const [pesoImballoKg, fasce] = await Promise.all([
    pesoImballoVariante(lettura.data.variantId),
    fasceSpedizione(),
  ])

  if (pesoImballoKg === null) {
    return {
      ok: false,
      messaggio: 'Non trovo questo pezzo.',
      risultato: null,
      migliorePrezzoCents: null,
      etaGiorni: null,
    }
  }

  const risultato = calcolaSpedizione({
    righe: [{ pesoImballoKg, volumeImballoL: 0, quantita: lettura.data.quantita }],
    fasce,
    cap: lettura.data.cap ?? null,
  })

  const migliore = opzionePredefinita(risultato)

  return {
    ok: true,
    risultato,
    migliorePrezzoCents: migliore?.prezzoCents ?? null,
    etaGiorni: migliore?.etaGiorni ?? null,
  }
}

/**
 * Stima per l'intero carrello. Il peso è la somma dei pesi a imballo:
 * è quello che guarda il corriere, non il peso dei pezzi.
 */
export async function stimaSpedizioneCarrello(cap?: string): Promise<StimaSpedizione> {
  const [carrello, fasce] = await Promise.all([leggiCarrello(), fasceSpedizione()])

  const righe = carrello.righe.map((riga) => ({
    pesoImballoKg: riga.pesoImballoKg,
    volumeImballoL: 0,
    quantita: riga.quantita,
  }))

  const capScelto = (cap ?? carrello.cap ?? '').trim()
  const risultato = calcolaSpedizione({
    righe,
    fasce,
    cap: capScelto === '' ? null : capScelto,
  })

  const migliore = opzionePredefinita(risultato)

  return {
    ok: true,
    risultato,
    migliorePrezzoCents: migliore?.prezzoCents ?? null,
    etaGiorni: migliore?.etaGiorni ?? null,
  }
}
