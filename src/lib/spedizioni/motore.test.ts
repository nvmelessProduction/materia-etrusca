import { describe, expect, it } from 'vitest'
import {
  calcolaSpedizione,
  fasciaPerPeso,
  opzionePredefinita,
  pesoTotale,
  SOGLIA_PREVENTIVO_KG,
  trovaOpzione,
  volumeTotale,
  type FasciaSpedizione,
  type RigaSpedizione,
} from '@/lib/spedizioni/motore'
import { zonaDaCap } from '@/lib/spedizioni/zone'

const FASCE: FasciaSpedizione[] = [
  {
    id: '1',
    minPesoKg: 0,
    maxPesoKg: 5,
    metodo: 'courier',
    prezzoCents: 900,
    zona: 'italia',
    etaGiorni: 3,
  },
  {
    id: '2',
    minPesoKg: 5,
    maxPesoKg: 15,
    metodo: 'courier',
    prezzoCents: 1500,
    zona: 'italia',
    etaGiorni: 3,
  },
  {
    id: '3',
    minPesoKg: 15,
    maxPesoKg: 30,
    metodo: 'courier',
    prezzoCents: 2500,
    zona: 'italia',
    etaGiorni: 4,
  },
  {
    id: '4',
    minPesoKg: 30,
    maxPesoKg: 50,
    metodo: 'courier',
    prezzoCents: 3900,
    zona: 'italia',
    etaGiorni: 5,
  },
  {
    id: '5',
    minPesoKg: 50,
    maxPesoKg: 70,
    metodo: 'courier',
    prezzoCents: 5900,
    zona: 'italia',
    etaGiorni: 6,
  },
  {
    id: '6',
    minPesoKg: 0,
    maxPesoKg: 5,
    metodo: 'courier',
    prezzoCents: 1305,
    zona: 'isole',
    etaGiorni: 6,
  },
  {
    id: '7',
    minPesoKg: 5,
    maxPesoKg: 15,
    metodo: 'courier',
    prezzoCents: 2175,
    zona: 'isole',
    etaGiorni: 6,
  },
  {
    id: '8',
    minPesoKg: 15,
    maxPesoKg: 30,
    metodo: 'courier',
    prezzoCents: 3625,
    zona: 'isole',
    etaGiorni: 7,
  },
  {
    id: '9',
    minPesoKg: 0,
    maxPesoKg: 5,
    metodo: 'courier',
    prezzoCents: 2160,
    zona: 'estero',
    etaGiorni: 9,
  },
  {
    id: '10',
    minPesoKg: 0,
    maxPesoKg: 250,
    metodo: 'floor_delivery',
    prezzoCents: 4900,
    zona: 'italia',
    etaGiorni: 10,
  },
  {
    id: '11',
    minPesoKg: 0,
    maxPesoKg: 9999,
    metodo: 'pickup',
    prezzoCents: 0,
    zona: 'italia',
    etaGiorni: 2,
  },
]

function riga(pesoImballoKg: number, quantita = 1): RigaSpedizione {
  return { pesoImballoKg, volumeImballoL: 60, quantita }
}

describe('zonaDaCap', () => {
  it('riconosce la penisola', () => {
    expect(zonaDaCap('00195')).toBe('italia')
    expect(zonaDaCap('20121')).toBe('italia')
    expect(zonaDaCap('00052')).toBe('italia')
  })

  it('riconosce la Sicilia', () => {
    expect(zonaDaCap('90133')).toBe('isole')
    expect(zonaDaCap('95124')).toBe('isole')
    expect(zonaDaCap('98122')).toBe('isole')
  })

  it('riconosce la Sardegna', () => {
    expect(zonaDaCap('09121')).toBe('isole')
    expect(zonaDaCap('07100')).toBe('isole')
    expect(zonaDaCap('08100')).toBe('isole')
  })

  it('non scambia Reggio Calabria per Sicilia', () => {
    expect(zonaDaCap('89127')).toBe('italia')
  })

  it('riconosce le isole minori, che hanno CAP continentali', () => {
    expect(zonaDaCap('80073')).toBe('isole') // Capri
    expect(zonaDaCap('57037')).toBe('isole') // Portoferraio
    expect(zonaDaCap('04027')).toBe('isole') // Ponza
  })

  it('è estero appena il paese non è l’Italia', () => {
    expect(zonaDaCap('75001', 'FR')).toBe('estero')
    expect(zonaDaCap('', 'DE')).toBe('estero')
  })

  it('rifiuta un CAP che non ha cinque cifre', () => {
    expect(zonaDaCap('0019')).toBeNull()
    expect(zonaDaCap('abcde')).toBeNull()
    expect(zonaDaCap('')).toBeNull()
  })
})

describe('pesoTotale', () => {
  it('somma i pesi a imballo moltiplicati per la quantità', () => {
    expect(pesoTotale([riga(12.5, 2), riga(8.25)])).toBe(33.25)
  })

  it('vale zero su un carrello vuoto', () => {
    expect(pesoTotale([])).toBe(0)
  })

  it('somma i volumi allo stesso modo', () => {
    expect(volumeTotale([riga(10, 3)])).toBe(180)
  })
})

describe('fasciaPerPeso', () => {
  it('sceglie la fascia che contiene il peso', () => {
    expect(fasciaPerPeso(FASCE, 12, 'italia')?.prezzoCents).toBe(1500)
  })

  it('include l’estremo superiore della fascia', () => {
    // 15 kg esatti stanno ancora nella fascia 5–15, non in quella sopra.
    expect(fasciaPerPeso(FASCE, 15, 'italia')?.prezzoCents).toBe(1500)
    expect(fasciaPerPeso(FASCE, 15.01, 'italia')?.prezzoCents).toBe(2500)
  })

  it('cambia prezzo con la zona', () => {
    expect(fasciaPerPeso(FASCE, 12, 'isole')?.prezzoCents).toBe(2175)
    expect(fasciaPerPeso(FASCE, 3, 'estero')?.prezzoCents).toBe(2160)
  })

  it('non trova nulla oltre l’ultima fascia', () => {
    expect(fasciaPerPeso(FASCE, 120, 'italia')).toBeNull()
  })
})

describe('calcolaSpedizione', () => {
  it('calcola il corriere per un pezzo leggero in penisola', () => {
    const esito = calcolaSpedizione({ righe: [riga(13)], fasce: FASCE, cap: '00195' })
    expect(esito.richiedePreventivo).toBe(false)
    expect(esito.zona).toBe('italia')
    expect(trovaOpzione(esito, 'courier')?.prezzoCents).toBe(1500)
  })

  it('applica il supplemento isole', () => {
    const esito = calcolaSpedizione({ righe: [riga(13)], fasce: FASCE, cap: '90133' })
    expect(trovaOpzione(esito, 'courier')?.prezzoCents).toBe(2175)
  })

  it('offre sempre il ritiro in laboratorio, gratis', () => {
    const esito = calcolaSpedizione({ righe: [riga(13)], fasce: FASCE, cap: '00195' })
    expect(trovaOpzione(esito, 'pickup')?.prezzoCents).toBe(0)
  })

  it('offre il ritiro anche quando serve un preventivo', () => {
    const esito = calcolaSpedizione({ righe: [riga(150)], fasce: FASCE, cap: '00195' })
    expect(esito.richiedePreventivo).toBe(true)
    expect(trovaOpzione(esito, 'pickup')?.prezzoCents).toBe(0)
  })

  it(`non fa prezzo automatico oltre i ${SOGLIA_PREVENTIVO_KG} kg`, () => {
    const esito = calcolaSpedizione({
      righe: [riga(SOGLIA_PREVENTIVO_KG + 0.5)],
      fasce: FASCE,
      cap: '00195',
    })
    expect(esito.richiedePreventivo).toBe(true)
    expect(trovaOpzione(esito, 'courier')).toBeNull()
    expect(trovaOpzione(esito, 'pallet')?.prezzoCents).toBeNull()
  })

  it(`resta automatico esattamente a ${SOGLIA_PREVENTIVO_KG} kg`, () => {
    const esito = calcolaSpedizione({
      righe: [riga(SOGLIA_PREVENTIVO_KG)],
      fasce: FASCE,
      cap: '00195',
    })
    expect(esito.richiedePreventivo).toBe(false)
    expect(trovaOpzione(esito, 'courier')?.prezzoCents).toBe(5900)
  })

  it('supera la soglia sommando più pezzi leggeri', () => {
    const esito = calcolaSpedizione({ righe: [riga(25, 3)], fasce: FASCE, cap: '00195' })
    expect(esito.pesoTotaleKg).toBe(75)
    expect(esito.richiedePreventivo).toBe(true)
  })

  it('propone la consegna al piano solo quando il pezzo è pesante', () => {
    const leggero = calcolaSpedizione({ righe: [riga(12)], fasce: FASCE, cap: '00195' })
    expect(trovaOpzione(leggero, 'floor_delivery')).toBeNull()

    const pesante = calcolaSpedizione({ righe: [riga(45)], fasce: FASCE, cap: '00195' })
    const alPiano = trovaOpzione(pesante, 'floor_delivery')
    expect(alPiano?.prezzoCents).toBe(4900)
    // È un supplemento: si somma al corriere, non lo sostituisce.
    expect(alPiano?.supplemento).toBe(true)
  })

  it('senza CAP dà una stima sulla penisola e lo dichiara', () => {
    const esito = calcolaSpedizione({ righe: [riga(13)], fasce: FASCE })
    expect(esito.capMancante).toBe(true)
    expect(esito.zona).toBeNull()
    expect(trovaOpzione(esito, 'courier')?.prezzoCents).toBe(1500)
  })

  it('con un CAP inventato non pretende di sapere la zona', () => {
    const esito = calcolaSpedizione({ righe: [riga(13)], fasce: FASCE, cap: '999' })
    expect(esito.capMancante).toBe(true)
  })

  it('chiede un preventivo quando per quella zona non c’è tariffa', () => {
    // All'estero il listino di prova arriva solo a 5 kg.
    const esito = calcolaSpedizione({ righe: [riga(40)], fasce: FASCE, cap: '75001', paese: 'FR' })
    expect(esito.zona).toBe('estero')
    expect(trovaOpzione(esito, 'courier')).toBeNull()
    expect(trovaOpzione(esito, 'pallet')?.prezzoCents).toBeNull()
  })

  it('non propone nulla per un carrello vuoto', () => {
    const esito = calcolaSpedizione({ righe: [], fasce: FASCE, cap: '00195' })
    expect(esito.opzioni).toEqual([])
    expect(esito.pesoTotaleKg).toBe(0)
  })
})

describe('opzionePredefinita', () => {
  it('sceglie la spedizione più economica, non il ritiro', () => {
    const esito = calcolaSpedizione({ righe: [riga(13)], fasce: FASCE, cap: '00195' })
    expect(opzionePredefinita(esito)?.metodo).toBe('courier')
  })

  it('ripiega sul preventivo quando non c’è un prezzo', () => {
    const esito = calcolaSpedizione({ righe: [riga(150)], fasce: FASCE, cap: '00195' })
    expect(opzionePredefinita(esito)?.metodo).toBe('pallet')
  })

  it('non sceglie nulla su un carrello vuoto', () => {
    const esito = calcolaSpedizione({ righe: [], fasce: FASCE, cap: '00195' })
    expect(opzionePredefinita(esito)).toBeNull()
  })
})
