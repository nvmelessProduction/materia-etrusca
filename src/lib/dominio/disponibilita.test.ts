import { describe, expect, it } from 'vitest'
import {
  attesaComplessiva,
  disponibilitaVariante,
  LIMITE_SU_ORDINAZIONE,
  prodottoAcquistabile,
  verificaQuantita,
} from '@/lib/dominio/disponibilita'
import type { ProdottoDominio, VarianteDominio } from '@/lib/dominio/tipi'

function prodotto(patch: Partial<ProdottoDominio> = {}): ProdottoDominio {
  return {
    id: 'p1',
    slug: 'kyathos',
    nome: 'Kyathos',
    prezzoBaseCents: 18000,
    pezzoUnico: false,
    suOrdinazione: false,
    giorniDiAttesa: 0,
    ...patch,
  }
}

function variante(patch: Partial<VarianteDominio> = {}): VarianteDominio {
  return {
    id: 'v1',
    sku: 'ME-KYA-40-GRE',
    altezzaCm: 40,
    diametroCm: 28,
    pesoKg: 18,
    finitura: 'grezzo',
    prezzoCents: 21000,
    giacenza: 4,
    pesoImballoKg: 21,
    volumeImballoL: 60,
    posizione: 0,
    ...patch,
  }
}

describe('disponibilitaVariante — pezzi di serie', () => {
  it('è disponibile quando la giacenza è comoda', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 6 }), prodotto())
    expect(esito.stato).toBe('disponibile')
    expect(esito.acquistabile).toBe(true)
    expect(esito.quantitaMassima).toBe(6)
  })

  it('avvisa quando ne restano due o meno', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 2 }), prodotto())
    expect(esito.stato).toBe('ultimo-pezzo')
    expect(esito.etichetta).toContain('2')
  })

  it('è esaurito a giacenza zero', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 0 }), prodotto())
    expect(esito.stato).toBe('esaurito')
    expect(esito.acquistabile).toBe(false)
    expect(esito.quantitaMassima).toBe(0)
  })

  it('scala quello che è già nel carrello', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 3 }), prodotto(), {
      giaNelCarrello: 2,
    })
    expect(esito.quantitaMassima).toBe(1)
  })

  it('non propone nulla se il carrello ha già tutta la giacenza', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 3 }), prodotto(), {
      giaNelCarrello: 3,
    })
    expect(esito.acquistabile).toBe(false)
  })
})

describe('disponibilitaVariante — pezzi unici', () => {
  const unico = prodotto({ pezzoUnico: true })

  it('si vende in un solo esemplare', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 1 }), unico)
    expect(esito.stato).toBe('ultimo-pezzo')
    expect(esito.quantitaMassima).toBe(1)
  })

  it('non si vende due volte nemmeno se la giacenza è sbagliata', () => {
    // Giacenza 5 su un pezzo unico è un errore di inserimento: vale comunque 1.
    const esito = disponibilitaVariante(variante({ giacenza: 5 }), unico)
    expect(esito.quantitaMassima).toBe(1)
  })

  it('sparisce dal carrello una volta preso', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 1 }), unico, { giaNelCarrello: 1 })
    expect(esito.acquistabile).toBe(false)
    expect(esito.etichetta).toBe('Già nel carrello')
  })

  it('è venduto quando la giacenza è zero', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 0 }), unico)
    expect(esito.stato).toBe('esaurito')
    expect(esito.etichetta).toBe('Venduto')
  })
})

describe('disponibilitaVariante — su ordinazione', () => {
  const suOrdinazione = prodotto({ suOrdinazione: true, giorniDiAttesa: 21 })

  it('si vende anche a giacenza zero, dichiarando l’attesa', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 0 }), suOrdinazione)
    expect(esito.stato).toBe('su-ordinazione')
    expect(esito.acquistabile).toBe(true)
    expect(esito.giorniDiAttesa).toBe(21)
    expect(esito.etichetta).toContain('21')
  })

  it('preferisce il magazzino quando c’è: niente attesa inutile', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 3 }), suOrdinazione)
    expect(esito.stato).toBe('disponibile')
    expect(esito.giorniDiAttesa).toBe(0)
  })

  it('mette un tetto ragionevole alla quantità', () => {
    const esito = disponibilitaVariante(variante({ giacenza: 0 }), suOrdinazione)
    expect(esito.quantitaMassima).toBe(LIMITE_SU_ORDINAZIONE)
  })
})

describe('verificaQuantita', () => {
  it('accetta una quantità nei limiti', () => {
    expect(verificaQuantita(2, variante({ giacenza: 4 }), prodotto())).toEqual({
      ok: true,
      quantita: 2,
    })
  })

  it('rifiuta e dice quanto si può prendere', () => {
    expect(verificaQuantita(9, variante({ giacenza: 4 }), prodotto())).toEqual({
      ok: false,
      motivo: 'oltre-scorta',
      quantitaMassima: 4,
    })
  })

  it('rifiuta lo zero e i negativi', () => {
    expect(verificaQuantita(0, variante(), prodotto()).ok).toBe(false)
    expect(verificaQuantita(-3, variante(), prodotto()).ok).toBe(false)
  })

  it('rifiuta un pezzo esaurito', () => {
    expect(verificaQuantita(1, variante({ giacenza: 0 }), prodotto())).toEqual({
      ok: false,
      motivo: 'non-acquistabile',
      quantitaMassima: 0,
    })
  })

  it('non fa passare due copie dello stesso pezzo unico', () => {
    const unico = prodotto({ pezzoUnico: true })
    expect(verificaQuantita(2, variante({ giacenza: 1 }), unico).ok).toBe(false)
  })
})

describe('prodottoAcquistabile', () => {
  it('basta una variante disponibile', () => {
    const varianti = [variante({ id: 'a', giacenza: 0 }), variante({ id: 'b', giacenza: 2 })]
    expect(prodottoAcquistabile(varianti, prodotto())).toBe(true)
  })

  it('è falso se sono tutte esaurite', () => {
    const varianti = [variante({ id: 'a', giacenza: 0 }), variante({ id: 'b', giacenza: 0 })]
    expect(prodottoAcquistabile(varianti, prodotto())).toBe(false)
  })
})

describe('attesaComplessiva', () => {
  it('prende il pezzo più lento', () => {
    const righe = [
      { variante: variante({ giacenza: 5 }), prodotto: prodotto(), quantita: 1 },
      {
        variante: variante({ id: 'v2', giacenza: 0 }),
        prodotto: prodotto({ suOrdinazione: true, giorniDiAttesa: 28 }),
        quantita: 1,
      },
    ]
    expect(attesaComplessiva(righe)).toBe(28)
  })

  it('è zero su un carrello di soli pezzi a magazzino', () => {
    const righe = [{ variante: variante({ giacenza: 5 }), prodotto: prodotto(), quantita: 2 }]
    expect(attesaComplessiva(righe)).toBe(0)
  })
})
