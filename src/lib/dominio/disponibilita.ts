import type { ProdottoDominio, VarianteDominio } from '@/lib/dominio/tipi'

export type StatoDisponibilita =
  'disponibile' | 'ultimo-pezzo' | 'su-ordinazione' | 'esaurito' | 'non-in-vendita'

export type Disponibilita = {
  stato: StatoDisponibilita
  acquistabile: boolean
  /** Quante unità si possono mettere nel carrello adesso. */
  quantitaMassima: number
  /** Giorni di attesa dichiarati, 0 se il pezzo parte subito. */
  giorniDiAttesa: number
  etichetta: string
}

/**
 * Regole, in ordine di precedenza:
 *  1. un pezzo unico esiste in un solo esemplare, punto;
 *  2. un pezzo su ordinazione si vende anche a giacenza zero, ma si dichiara l'attesa;
 *  3. tutto il resto si vende solo se c'è.
 */
export function disponibilitaVariante(
  variante: VarianteDominio,
  prodotto: ProdottoDominio,
  opzioni?: { giaNelCarrello?: number },
): Disponibilita {
  const giaNelCarrello = Math.max(0, opzioni?.giaNelCarrello ?? 0)
  const giacenza = Math.max(0, variante.giacenza)

  if (prodotto.pezzoUnico) {
    const residuo = Math.max(0, Math.min(1, giacenza) - giaNelCarrello)
    if (residuo === 0) {
      return {
        stato: giacenza > 0 ? 'disponibile' : 'esaurito',
        acquistabile: false,
        quantitaMassima: 0,
        giorniDiAttesa: prodotto.giorniDiAttesa,
        etichetta: giacenza > 0 ? 'Già nel carrello' : 'Venduto',
      }
    }
    return {
      stato: 'ultimo-pezzo',
      acquistabile: true,
      quantitaMassima: 1,
      giorniDiAttesa: prodotto.giorniDiAttesa,
      etichetta: 'Pezzo unico, esiste solo questo',
    }
  }

  if (giacenza - giaNelCarrello > 0) {
    const residuo = giacenza - giaNelCarrello
    return {
      stato: residuo <= 2 ? 'ultimo-pezzo' : 'disponibile',
      acquistabile: true,
      quantitaMassima: residuo,
      giorniDiAttesa: 0,
      etichetta: residuo <= 2 ? `Ne restano ${residuo}` : 'Disponibile, parte in 2 giorni',
    }
  }

  if (prodotto.suOrdinazione) {
    return {
      stato: 'su-ordinazione',
      acquistabile: true,
      // Su ordinazione non c'è un limite di magazzino, ma un tetto ragionevole sì.
      quantitaMassima: Math.max(0, LIMITE_SU_ORDINAZIONE - giaNelCarrello),
      giorniDiAttesa: prodotto.giorniDiAttesa,
      etichetta: `Lo colo per te: pronto in ${prodotto.giorniDiAttesa} giorni`,
    }
  }

  return {
    stato: 'esaurito',
    acquistabile: false,
    quantitaMassima: 0,
    giorniDiAttesa: prodotto.giorniDiAttesa,
    etichetta: 'Esaurito',
  }
}

/** Oltre questa soglia un ordine "su ordinazione" diventa una commessa, e si tratta a voce. */
export const LIMITE_SU_ORDINAZIONE = 5

/** Un prodotto è in vetrina se almeno una variante si può comprare. */
export function prodottoAcquistabile(
  varianti: readonly VarianteDominio[],
  prodotto: ProdottoDominio,
): boolean {
  return varianti.some((variante) => disponibilitaVariante(variante, prodotto).acquistabile)
}

export type EsitoQuantita =
  | { ok: true; quantita: number }
  | { ok: false; motivo: 'non-acquistabile' | 'oltre-scorta'; quantitaMassima: number }

/**
 * Decide quante unità accettare quando il cliente ne chiede N.
 * Non "aggiusta" in silenzio: chi chiama deve poter dire al cliente cosa è successo.
 */
export function verificaQuantita(
  richiesta: number,
  variante: VarianteDominio,
  prodotto: ProdottoDominio,
  opzioni?: { giaNelCarrello?: number },
): EsitoQuantita {
  const disponibilita = disponibilitaVariante(variante, prodotto, opzioni)
  const quantita = Math.trunc(richiesta)

  if (quantita < 1) return { ok: false, motivo: 'non-acquistabile', quantitaMassima: 0 }
  if (!disponibilita.acquistabile) {
    return { ok: false, motivo: 'non-acquistabile', quantitaMassima: 0 }
  }
  if (quantita > disponibilita.quantitaMassima) {
    return { ok: false, motivo: 'oltre-scorta', quantitaMassima: disponibilita.quantitaMassima }
  }
  return { ok: true, quantita }
}

/**
 * Giorni di attesa dell'intera spedizione: si parte quando è pronto
 * il pezzo più lento, non il più veloce.
 */
export function attesaComplessiva(
  righe: readonly { variante: VarianteDominio; prodotto: ProdottoDominio; quantita: number }[],
): number {
  return righe.reduce((massimo, riga) => {
    const disponibilita = disponibilitaVariante(riga.variante, riga.prodotto)
    return Math.max(massimo, disponibilita.giorniDiAttesa)
  }, 0)
}
