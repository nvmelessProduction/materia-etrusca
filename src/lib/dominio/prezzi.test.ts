import { describe, expect, it } from 'vitest'
import {
  calcolaSconto,
  fasciaPrezzo,
  prezzoVariante,
  scorporaIva,
  spiegaScontoNonValido,
  subtotale,
  totaleRiga,
  totaliOrdine,
} from '@/lib/dominio/prezzi'
import type { ProdottoDominio, ScontoDominio, VarianteDominio } from '@/lib/dominio/tipi'

const prodotto: ProdottoDominio = {
  id: 'p1',
  slug: 'kyathos',
  nome: 'Kyathos',
  prezzoBaseCents: 18000,
  pezzoUnico: false,
  suOrdinazione: false,
  giorniDiAttesa: 0,
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

describe('prezzoVariante', () => {
  it('preferisce il prezzo della variante', () => {
    expect(prezzoVariante(variante(), prodotto)).toBe(21000)
  })

  it('ricade sul prezzo base quando la variante non ne ha uno', () => {
    expect(prezzoVariante(variante({ prezzoCents: 0 }), prodotto)).toBe(18000)
  })
})

describe('totaleRiga', () => {
  it('moltiplica prezzo e quantità', () => {
    expect(totaleRiga(21000, 3)).toBe(63000)
  })

  it('vale zero con quantità zero', () => {
    expect(totaleRiga(21000, 0)).toBe(0)
  })

  it('rifiuta importi non interi: i centesimi non hanno decimali', () => {
    expect(() => totaleRiga(210.5, 1)).toThrow()
  })

  it('rifiuta quantità negative', () => {
    expect(() => totaleRiga(21000, -1)).toThrow()
  })
})

describe('subtotale', () => {
  it('somma le righe senza perdere centesimi', () => {
    const righe = [
      { prezzoUnitarioCents: 21000, quantita: 2 },
      { prezzoUnitarioCents: 9990, quantita: 3 },
    ]
    expect(subtotale(righe)).toBe(42000 + 29970)
  })

  it('vale zero su un carrello vuoto', () => {
    expect(subtotale([])).toBe(0)
  })
})

describe('fasciaPrezzo', () => {
  it('restituisce minimo e massimo fra le varianti', () => {
    const varianti = [
      variante({ id: 'a', prezzoCents: 21000 }),
      variante({ id: 'b', prezzoCents: 34000 }),
      variante({ id: 'c', prezzoCents: 15000 }),
    ]
    expect(fasciaPrezzo(varianti, prodotto)).toEqual({ minCents: 15000, maxCents: 34000 })
  })

  it('ricade sul prezzo base quando non ci sono varianti', () => {
    expect(fasciaPrezzo([], prodotto)).toEqual({ minCents: 18000, maxCents: 18000 })
  })
})

function sconto(patch: Partial<ScontoDominio> = {}): ScontoDominio {
  return {
    codice: 'BENVENUTO',
    tipo: 'percent',
    valore: 10,
    minimoOrdineCents: 0,
    limiteUtilizzi: null,
    utilizzi: 0,
    scadenza: null,
    attivo: true,
    ...patch,
  }
}

describe('calcolaSconto', () => {
  const adesso = new Date('2026-03-01T10:00:00Z')

  it('applica una percentuale arrotondando al centesimo', () => {
    // 10% di 19.999 € = 1.999,9 centesimi -> 2.000
    const esito = calcolaSconto(sconto({ valore: 10 }), 19999, adesso)
    expect(esito).toEqual({ valido: true, scontoCents: 2000 })
  })

  it('applica un importo fisso', () => {
    const esito = calcolaSconto(sconto({ tipo: 'fixed', valore: 3000 }), 19999, adesso)
    expect(esito).toEqual({ valido: true, scontoCents: 3000 })
  })

  it('non porta mai il carrello sotto zero', () => {
    const esito = calcolaSconto(sconto({ tipo: 'fixed', valore: 50000 }), 19999, adesso)
    expect(esito).toEqual({ valido: true, scontoCents: 19999 })
  })

  it('rifiuta un codice inesistente', () => {
    expect(calcolaSconto(null, 19999, adesso)).toEqual({ valido: false, motivo: 'inesistente' })
  })

  it('rifiuta un codice disattivato', () => {
    expect(calcolaSconto(sconto({ attivo: false }), 19999, adesso)).toEqual({
      valido: false,
      motivo: 'disattivato',
    })
  })

  it('rifiuta un codice scaduto', () => {
    const scaduto = sconto({ scadenza: new Date('2026-02-28T23:59:59Z') })
    expect(calcolaSconto(scaduto, 19999, adesso)).toEqual({ valido: false, motivo: 'scaduto' })
  })

  it('accetta un codice che scade domani', () => {
    const valido = sconto({ scadenza: new Date('2026-03-02T00:00:00Z') })
    expect(calcolaSconto(valido, 19999, adesso).valido).toBe(true)
  })

  it('rifiuta un codice che ha esaurito gli utilizzi', () => {
    const esaurito = sconto({ limiteUtilizzi: 10, utilizzi: 10 })
    expect(calcolaSconto(esaurito, 19999, adesso)).toEqual({ valido: false, motivo: 'esaurito' })
  })

  it('rifiuta un carrello sotto il minimo richiesto', () => {
    const conMinimo = sconto({ minimoOrdineCents: 30000 })
    expect(calcolaSconto(conMinimo, 19999, adesso)).toEqual({
      valido: false,
      motivo: 'sotto-minimo',
    })
  })

  it('ha un messaggio leggibile per ogni motivo di rifiuto', () => {
    expect(spiegaScontoNonValido('scaduto')).toMatch(/scaduto/i)
    expect(spiegaScontoNonValido('sotto-minimo')).toMatch(/minimo/i)
  })
})

describe('totaliOrdine', () => {
  it('somma merce e spedizione al netto dello sconto', () => {
    expect(
      totaliOrdine({ subtotaleCents: 50000, spedizioneCents: 4500, scontoCents: 5000 }),
    ).toEqual({
      subtotaleCents: 50000,
      spedizioneCents: 4500,
      scontoCents: 5000,
      totaleCents: 49500,
    })
  })

  it('non sconta la spedizione: il corriere si paga comunque', () => {
    const totali = totaliOrdine({
      subtotaleCents: 10000,
      spedizioneCents: 4500,
      scontoCents: 99999,
    })
    expect(totali.scontoCents).toBe(10000)
    expect(totali.totaleCents).toBe(4500)
  })

  it('normalizza gli ingressi negativi a zero', () => {
    expect(totaliOrdine({ subtotaleCents: -100, spedizioneCents: -1, scontoCents: -50 })).toEqual({
      subtotaleCents: 0,
      spedizioneCents: 0,
      scontoCents: 0,
      totaleCents: 0,
    })
  })
})

describe('scorporaIva', () => {
  it('scorpora il 22% da un prezzo che la comprende', () => {
    const { imponibileCents, ivaCents } = scorporaIva(12200)
    expect(imponibileCents).toBe(10000)
    expect(ivaCents).toBe(2200)
  })

  it('imponibile e imposta ricompongono sempre il totale', () => {
    for (const totale of [1, 999, 19999, 123457]) {
      const { imponibileCents, ivaCents } = scorporaIva(totale)
      expect(imponibileCents + ivaCents).toBe(totale)
    }
  })
})
