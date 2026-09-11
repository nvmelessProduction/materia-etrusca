import { describe, expect, it } from 'vitest'
import { contaFiltriAttivi, leggiFiltri, scriviParametri } from '@/lib/catalogo/parametri'

describe('leggiFiltri', () => {
  it('legge un URL vuoto con i valori predefiniti', () => {
    expect(leggiFiltri({})).toEqual({ ordinamento: 'novita', pagina: 1 })
  })

  it('legge un intervallo di altezza', () => {
    const filtri = leggiFiltri({ altezza: '30-70' })
    expect(filtri.altezzaMinCm).toBe(30)
    expect(filtri.altezzaMaxCm).toBe(70)
  })

  it('ignora un intervallo rovesciato invece di rompersi', () => {
    expect(leggiFiltri({ altezza: '90-30' }).altezzaMinCm).toBeUndefined()
  })

  it('ignora valori non numerici', () => {
    expect(leggiFiltri({ altezza: 'alto' }).altezzaMinCm).toBeUndefined()
    expect(leggiFiltri({ prezzo: '<script>' }).prezzoMinCents).toBeUndefined()
  })

  it('legge più finiture e scarta quelle inventate', () => {
    expect(leggiFiltri({ finitura: 'grezzo,dorato,ocra' }).finiture).toEqual(['grezzo', 'ocra'])
  })

  it('ignora del tutto una finitura inesistente', () => {
    expect(leggiFiltri({ finitura: 'dorato' }).finiture).toBeUndefined()
  })

  it('accetta solo interno o esterno', () => {
    expect(leggiFiltri({ ambiente: 'interno' }).ambiente).toBe('interno')
    expect(leggiFiltri({ ambiente: 'cantina' }).ambiente).toBeUndefined()
  })

  it('ripiega su "novita" davanti a un ordinamento sconosciuto', () => {
    expect(leggiFiltri({ ordina: 'a-caso' }).ordinamento).toBe('novita')
  })

  it('prende il primo valore quando un parametro arriva ripetuto', () => {
    expect(leggiFiltri({ ordina: ['prezzo-asc', 'prezzo-desc'] }).ordinamento).toBe('prezzo-asc')
  })

  it('non accetta pagine assurde', () => {
    expect(leggiFiltri({ pagina: '-3' }).pagina).toBe(1)
    expect(leggiFiltri({ pagina: '99999' }).pagina).toBe(1)
  })

  it('porta dentro la collezione quando è indicata', () => {
    expect(leggiFiltri({}, 'buccheri').collezioneSlug).toBe('buccheri')
  })
})

describe('scriviParametri', () => {
  it('non scrive nulla quando non c’è nulla da scrivere', () => {
    expect(scriviParametri({ ordinamento: 'novita', pagina: 1 })).toBe('')
  })

  it('fa il giro completo: URL, filtri, URL di nuovo', () => {
    const partenza = {
      altezza: '30-70',
      prezzo: '15000-60000',
      finitura: 'grezzo,ocra',
      ambiente: 'esterno',
      disp: '1',
      ordina: 'prezzo-asc',
    }
    const filtri = leggiFiltri(partenza)
    const ricomposto = scriviParametri(filtri)

    expect(ricomposto).toContain('altezza=30-70')
    expect(ricomposto).toContain('prezzo=15000-60000')
    expect(ricomposto).toContain('finitura=grezzo%2Cocra')
    expect(ricomposto).toContain('ambiente=esterno')
    expect(ricomposto).toContain('disp=1')
    expect(ricomposto).toContain('ordina=prezzo-asc')

    // Rileggendo l'URL ricomposto si devono ottenere gli stessi filtri.
    const secondoGiro = leggiFiltri(
      Object.fromEntries(new URLSearchParams(ricomposto.slice(1)).entries()),
    )
    expect(secondoGiro).toEqual(filtri)
  })

  it('omette l’ordinamento predefinito e la prima pagina', () => {
    const scritto = scriviParametri({ ordinamento: 'novita', pagina: 1, soloDisponibili: true })
    expect(scritto).toBe('?disp=1')
  })
})

describe('contaFiltriAttivi', () => {
  it('conta zero su un catalogo intero', () => {
    expect(contaFiltriAttivi({ ordinamento: 'novita', pagina: 1 })).toBe(0)
  })

  it('non conta ordinamento e pagina: non sono filtri', () => {
    expect(contaFiltriAttivi({ ordinamento: 'prezzo-asc', pagina: 3 })).toBe(0)
  })

  it('conta un filtro per famiglia, non uno per valore', () => {
    const filtri = leggiFiltri({ finitura: 'grezzo,ocra,antracite', altezza: '30-70', disp: '1' })
    expect(contaFiltriAttivi(filtri)).toBe(3)
  })
})
