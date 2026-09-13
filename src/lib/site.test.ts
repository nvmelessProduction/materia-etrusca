import { describe, expect, it } from 'vitest'
import { risolviUrlSito } from '@/lib/site'

/**
 * Da questo indirizzo dipendono `metadataBase`, i link nelle email, la sitemap
 * e i dati strutturati. Viene risolto al livello del modulo: un valore storto
 * non degrada, fa fallire la build. Quindi va provato per davvero.
 */
describe('risolviUrlSito', () => {
  it('usa la variabile esplicita quando c’è', () => {
    expect(risolviUrlSito('https://materiaetrusca.it')).toBe('https://materiaetrusca.it')
  })

  it('toglie lo slash finale', () => {
    expect(risolviUrlSito('https://materiaetrusca.it/')).toBe('https://materiaetrusca.it')
    expect(risolviUrlSito('https://materiaetrusca.it///')).toBe('https://materiaetrusca.it')
  })

  it('aggiunge il protocollo a chi incolla solo il dominio', () => {
    expect(risolviUrlSito('materiaetrusca.it')).toBe('https://materiaetrusca.it')
  })

  it('tiene lo spazio di troppo fuori dai piedi', () => {
    expect(risolviUrlSito('  https://materiaetrusca.it  ')).toBe('https://materiaetrusca.it')
  })

  // Il caso che ha fatto fallire il primo deploy su Vercel: la variabile
  // esisteva ma era vuota, e `??` non interviene sulle stringhe vuote.
  it('ripiega quando la variabile è una stringa vuota', () => {
    expect(risolviUrlSito('')).toBe('http://localhost:3000')
    expect(risolviUrlSito('   ')).toBe('http://localhost:3000')
  })

  it('ripiega quando la variabile non c’è', () => {
    expect(risolviUrlSito(undefined)).toBe('http://localhost:3000')
  })

  it('usa il dominio d’anteprima di Vercel quando manca quello esplicito', () => {
    expect(risolviUrlSito(undefined, 'materia-etrusca-abc123.vercel.app')).toBe(
      'https://materia-etrusca-abc123.vercel.app',
    )
    expect(risolviUrlSito('', 'materia-etrusca-abc123.vercel.app')).toBe(
      'https://materia-etrusca-abc123.vercel.app',
    )
  })

  it('preferisce comunque il dominio esplicito a quello d’anteprima', () => {
    expect(risolviUrlSito('https://materiaetrusca.it', 'anteprima.vercel.app')).toBe(
      'https://materiaetrusca.it',
    )
  })

  it('ripiega invece di sollevare davanti a un indirizzo malformato', () => {
    expect(risolviUrlSito('http://')).toBe('http://localhost:3000')
    expect(risolviUrlSito('://niente')).toBe('http://localhost:3000')
  })

  it('quello che restituisce è sempre un URL valido', () => {
    const casi = ['', '   ', undefined, 'materiaetrusca.it', 'https://x.it/', 'http://', '://rotto']
    for (const caso of casi) {
      expect(() => new URL(risolviUrlSito(caso))).not.toThrow()
    }
  })
})
