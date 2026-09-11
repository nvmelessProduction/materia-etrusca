import { z } from 'zod'
import { ORDINAMENTI, type FiltriCatalogo, type Ordinamento } from '@/lib/catalogo/tipi'
import type { Finitura } from '@/db/schema'

/**
 * I filtri vivono nell'URL, non nello stato del client: un elenco filtrato
 * deve poter essere incollato in una chat e riaprirsi identico.
 */

export const FINITURE = ['grezzo', 'levigato', 'ocra', 'antracite'] as const

const intervallo = z
  .string()
  .regex(/^\d+-\d+$/)
  .transform((valore) => {
    const [min, max] = valore.split('-').map((parte) => Number.parseInt(parte, 10))
    return { min: min ?? 0, max: max ?? 0 }
  })
  .refine((intervallo) => intervallo.min <= intervallo.max, {
    message: 'Il minimo non può superare il massimo.',
  })

export const schemaParametri = z.object({
  altezza: intervallo.optional().catch(undefined),
  prezzo: intervallo.optional().catch(undefined),
  finitura: z
    .string()
    .optional()
    .transform((valore) =>
      valore
        ? valore
            .split(',')
            .map((parte) => parte.trim())
            .filter((parte): parte is Finitura => (FINITURE as readonly string[]).includes(parte))
        : undefined,
    )
    .catch(undefined),
  ambiente: z.enum(['interno', 'esterno']).optional().catch(undefined),
  disp: z
    .string()
    .optional()
    .transform((valore) => valore === '1')
    .catch(false),
  ordina: z.enum(ORDINAMENTI).optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).max(500).optional().catch(1),
})

/** Forma grezza dei searchParams di Next: un valore può arrivare ripetuto. */
export type ParametriGrezzi = Record<string, string | string[] | undefined>

function primo(valore: string | string[] | undefined): string | undefined {
  return Array.isArray(valore) ? valore[0] : valore
}

export function leggiFiltri(
  parametri: ParametriGrezzi,
  collezioneSlug?: string,
): FiltriCatalogo & { ordinamento: Ordinamento; pagina: number } {
  const letti = schemaParametri.parse({
    altezza: primo(parametri.altezza),
    prezzo: primo(parametri.prezzo),
    finitura: primo(parametri.finitura),
    ambiente: primo(parametri.ambiente),
    disp: primo(parametri.disp),
    ordina: primo(parametri.ordina),
    pagina: primo(parametri.pagina),
  })

  const filtri: FiltriCatalogo & { ordinamento: Ordinamento; pagina: number } = {
    ordinamento: letti.ordina ?? 'novita',
    pagina: letti.pagina ?? 1,
  }

  if (collezioneSlug) filtri.collezioneSlug = collezioneSlug
  if (letti.altezza) {
    filtri.altezzaMinCm = letti.altezza.min
    filtri.altezzaMaxCm = letti.altezza.max
  }
  if (letti.prezzo) {
    filtri.prezzoMinCents = letti.prezzo.min
    filtri.prezzoMaxCents = letti.prezzo.max
  }
  if (letti.finitura && letti.finitura.length > 0) filtri.finiture = letti.finitura
  if (letti.ambiente) filtri.ambiente = letti.ambiente
  if (letti.disp) filtri.soloDisponibili = true

  return filtri
}

/** Quanti filtri sono attivi: serve al pallino sul pulsante "Filtri". */
export function contaFiltriAttivi(filtri: FiltriCatalogo): number {
  let quanti = 0
  if (filtri.altezzaMinCm !== undefined || filtri.altezzaMaxCm !== undefined) quanti += 1
  if (filtri.prezzoMinCents !== undefined || filtri.prezzoMaxCents !== undefined) quanti += 1
  if (filtri.finiture && filtri.finiture.length > 0) quanti += 1
  if (filtri.ambiente) quanti += 1
  if (filtri.soloDisponibili) quanti += 1
  return quanti
}

/** Ricompone la query string, omettendo i valori predefiniti per non sporcare l'URL. */
export function scriviParametri(filtri: FiltriCatalogo): string {
  const parametri = new URLSearchParams()

  if (filtri.altezzaMinCm !== undefined && filtri.altezzaMaxCm !== undefined) {
    parametri.set('altezza', `${filtri.altezzaMinCm}-${filtri.altezzaMaxCm}`)
  }
  if (filtri.prezzoMinCents !== undefined && filtri.prezzoMaxCents !== undefined) {
    parametri.set('prezzo', `${filtri.prezzoMinCents}-${filtri.prezzoMaxCents}`)
  }
  if (filtri.finiture && filtri.finiture.length > 0) {
    parametri.set('finitura', filtri.finiture.join(','))
  }
  if (filtri.ambiente) parametri.set('ambiente', filtri.ambiente)
  if (filtri.soloDisponibili) parametri.set('disp', '1')
  if (filtri.ordinamento && filtri.ordinamento !== 'novita') {
    parametri.set('ordina', filtri.ordinamento)
  }
  if (filtri.pagina && filtri.pagina > 1) parametri.set('pagina', String(filtri.pagina))

  const stringa = parametri.toString()
  return stringa ? `?${stringa}` : ''
}
