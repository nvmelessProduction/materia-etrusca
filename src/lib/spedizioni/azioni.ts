'use server'

import { z } from 'zod'
import { fasceSpedizione } from '@/db/queries/spedizioni'
import { pesoImballoVariante } from '@/db/queries/carrello'
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
