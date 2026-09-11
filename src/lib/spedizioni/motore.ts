import type { MetodoSpedizione, ZonaSpedizione } from '@/db/schema'
import { site } from '@/lib/site'
import { zonaDaCap } from '@/lib/spedizioni/zone'

/** Una fascia di listino, già convertita in numeri. */
export type FasciaSpedizione = {
  id: string
  minPesoKg: number
  maxPesoKg: number
  metodo: MetodoSpedizione
  prezzoCents: number
  zona: ZonaSpedizione
  etaGiorni: number
}

export type RigaSpedizione = {
  pesoImballoKg: number
  volumeImballoL: number
  quantita: number
}

export type OpzioneSpedizione = {
  metodo: MetodoSpedizione
  etichetta: string
  descrizione: string
  /** `null` significa "prezzo non calcolabile in automatico": si fa un preventivo. */
  prezzoCents: number | null
  etaGiorni: number
  /** Aggiunta facoltativa da sommare a un'altra opzione, non alternativa. */
  supplemento: boolean
}

export type RisultatoSpedizione = {
  pesoTotaleKg: number
  volumeTotaleL: number
  zona: ZonaSpedizione | null
  /** Sopra la soglia il corriere non fa più prezzo a listino. */
  richiedePreventivo: boolean
  opzioni: OpzioneSpedizione[]
  /** Se il CAP manca o è sbagliato, la stima resta indicativa. */
  capMancante: boolean
}

/** Oltre questo peso si va su pallet, e il pallet si quota caso per caso. */
export const SOGLIA_PREVENTIVO_KG = site.maxAutomaticShippingWeightKg

export function pesoTotale(righe: readonly RigaSpedizione[]): number {
  const grezzo = righe.reduce((somma, riga) => somma + riga.pesoImballoKg * riga.quantita, 0)
  // Due decimali bastano: il corriere arrotonda comunque al chilo.
  return Math.round(grezzo * 100) / 100
}

export function volumeTotale(righe: readonly RigaSpedizione[]): number {
  const grezzo = righe.reduce((somma, riga) => somma + riga.volumeImballoL * riga.quantita, 0)
  return Math.round(grezzo * 100) / 100
}

/** La fascia giusta è quella che contiene il peso, estremo superiore incluso. */
export function fasciaPerPeso(
  fasce: readonly FasciaSpedizione[],
  pesoKg: number,
  zona: ZonaSpedizione,
  metodo: MetodoSpedizione = 'courier',
): FasciaSpedizione | null {
  const candidate = fasce
    .filter((fascia) => fascia.zona === zona && fascia.metodo === metodo)
    .filter((fascia) => pesoKg > fascia.minPesoKg && pesoKg <= fascia.maxPesoKg)
    .sort((a, b) => a.prezzoCents - b.prezzoCents)

  return candidate[0] ?? null
}

const RITIRO: OpzioneSpedizione = {
  metodo: 'pickup',
  etichetta: 'Ritiro in laboratorio',
  descrizione: `Vieni a prenderlo a ${site.laboratory.city}. Ti scrivo io quando è pronto, e ci mettiamo d'accordo sull'orario.`,
  prezzoCents: 0,
  etaGiorni: 2,
  supplemento: false,
}

/**
 * Calcola le opzioni di spedizione per un insieme di righe.
 *
 * Regole:
 *  - il ritiro in laboratorio c'è sempre ed è sempre gratis;
 *  - sopra i 70 kg il corriere non fa prezzo: si passa a preventivo;
 *  - la consegna al piano è un supplemento, non un'alternativa, e ha senso
 *    solo quando il pezzo è pesante davvero.
 */
export function calcolaSpedizione(input: {
  righe: readonly RigaSpedizione[]
  fasce: readonly FasciaSpedizione[]
  cap?: string | null
  paese?: string
}): RisultatoSpedizione {
  const pesoKg = pesoTotale(input.righe)
  const volumeL = volumeTotale(input.righe)
  const paese = input.paese ?? 'IT'
  const zona = input.cap
    ? zonaDaCap(input.cap, paese)
    : paese.toUpperCase() !== 'IT'
      ? 'estero'
      : null

  const vuoto = input.righe.length === 0 || pesoKg === 0

  if (vuoto) {
    return {
      pesoTotaleKg: 0,
      volumeTotaleL: 0,
      zona,
      richiedePreventivo: false,
      opzioni: [],
      capMancante: zona === null,
    }
  }

  if (pesoKg > SOGLIA_PREVENTIVO_KG) {
    return {
      pesoTotaleKg: pesoKg,
      volumeTotaleL: volumeL,
      zona,
      richiedePreventivo: true,
      capMancante: zona === null,
      opzioni: [
        {
          metodo: 'pallet',
          etichetta: 'Spedizione su pallet',
          descrizione: `Oltre i ${SOGLIA_PREVENTIVO_KG} kg non c'è un prezzo a listino: chiedo io la quota al trasportatore e te la scrivo prima che tu paghi qualcosa.`,
          prezzoCents: null,
          etaGiorni: 10,
          supplemento: false,
        },
        RITIRO,
      ],
    }
  }

  // Senza CAP si dà comunque una stima sulla penisola, dichiarandola tale.
  const zonaDiCalcolo: ZonaSpedizione = zona ?? 'italia'
  const fascia = fasciaPerPeso(input.fasce, pesoKg, zonaDiCalcolo)

  const opzioni: OpzioneSpedizione[] = []

  if (fascia) {
    opzioni.push({
      metodo: 'courier',
      etichetta: 'Corriere, consegna al piano strada',
      descrizione:
        'Il corriere chiama prima di arrivare e consegna al piano strada. Pesa parecchio: meglio esserci in due.',
      prezzoCents: fascia.prezzoCents,
      etaGiorni: fascia.etaGiorni,
      supplemento: false,
    })
  } else {
    opzioni.push({
      metodo: 'pallet',
      etichetta: 'Spedizione da concordare',
      descrizione:
        'Per questa combinazione di peso e destinazione non ho una tariffa pronta: ti scrivo la quota esatta prima di procedere.',
      prezzoCents: null,
      etaGiorni: 10,
      supplemento: false,
    })
  }

  const consegnaAlPiano = input.fasce.find(
    (voce) => voce.metodo === 'floor_delivery' && voce.zona === zonaDiCalcolo,
  )

  if (consegnaAlPiano && pesoKg >= SOGLIA_CONSEGNA_AL_PIANO_KG) {
    opzioni.push({
      metodo: 'floor_delivery',
      etichetta: 'Consegna al piano',
      descrizione:
        'Due persone lo portano su per le scale fin dentro casa. Se non hai ascensore e il pezzo supera i trenta chili, vale i soldi che costa.',
      prezzoCents: consegnaAlPiano.prezzoCents,
      etaGiorni: consegnaAlPiano.etaGiorni,
      supplemento: true,
    })
  }

  opzioni.push(RITIRO)

  return {
    pesoTotaleKg: pesoKg,
    volumeTotaleL: volumeL,
    zona,
    richiedePreventivo: false,
    opzioni,
    capMancante: zona === null,
  }
}

/** Sotto questo peso la consegna al piano non si propone: il pezzo si porta su da soli. */
export const SOGLIA_CONSEGNA_AL_PIANO_KG = 30

/** Opzione scelta di default: la più economica fra quelle non supplementari. */
export function opzionePredefinita(risultato: RisultatoSpedizione): OpzioneSpedizione | null {
  const principali = risultato.opzioni.filter((opzione) => !opzione.supplemento)
  const conPrezzo = principali.filter(
    (opzione): opzione is OpzioneSpedizione & { prezzoCents: number } =>
      opzione.prezzoCents !== null,
  )
  // Il ritiro è gratis, ma non è una spedizione: si propone solo se non c'è altro.
  const spedizioni = conPrezzo.filter((opzione) => opzione.metodo !== 'pickup')
  if (spedizioni.length > 0) {
    return spedizioni.reduce((minimo, opzione) =>
      opzione.prezzoCents < minimo.prezzoCents ? opzione : minimo,
    )
  }
  return principali[0] ?? null
}

export function trovaOpzione(
  risultato: RisultatoSpedizione,
  metodo: MetodoSpedizione,
): OpzioneSpedizione | null {
  return risultato.opzioni.find((opzione) => opzione.metodo === metodo) ?? null
}

export const ETICHETTE_METODO: Record<MetodoSpedizione, string> = {
  courier: 'Corriere',
  pallet: 'Pallet',
  floor_delivery: 'Consegna al piano',
  pickup: 'Ritiro in laboratorio',
}
