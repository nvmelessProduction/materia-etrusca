import { beforeEach, describe, expect, it } from 'vitest'
import {
  azzeraLimiti,
  consumaLimite,
  consumaLimiteChiave,
  indirizzoRichiesta,
} from '@/lib/limite-richieste'

function richiestaDa(ip: string): Request {
  return new Request('https://materiaetrusca.it/api/progetto', {
    method: 'POST',
    headers: { 'x-forwarded-for': ip },
  })
}

describe('indirizzoRichiesta', () => {
  it('prende il primo indirizzo della catena di proxy', () => {
    const richiesta = new Request('https://x.it', {
      headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
    })
    expect(indirizzoRichiesta(richiesta)).toBe('203.0.113.7')
  })

  it('ripiega su x-real-ip', () => {
    const richiesta = new Request('https://x.it', { headers: { 'x-real-ip': '198.51.100.4' } })
    expect(indirizzoRichiesta(richiesta)).toBe('198.51.100.4')
  })

  it('non si rompe senza intestazioni', () => {
    expect(indirizzoRichiesta(new Request('https://x.it'))).toBe('sconosciuto')
  })
})

describe('consumaLimite', () => {
  beforeEach(azzeraLimiti)

  it('lascia passare fino al numero consentito', async () => {
    const opzioni = { quante: 3, finestraMs: 60_000 }
    for (let tentativo = 0; tentativo < 3; tentativo += 1) {
      expect(await consumaLimite(richiestaDa('1.1.1.1'), 'progetto', opzioni)).toBe(true)
    }
    expect(await consumaLimite(richiestaDa('1.1.1.1'), 'progetto', opzioni)).toBe(false)
  })

  it('conta separatamente indirizzi diversi', async () => {
    const opzioni = { quante: 1, finestraMs: 60_000 }
    expect(await consumaLimite(richiestaDa('1.1.1.1'), 'progetto', opzioni)).toBe(true)
    expect(await consumaLimite(richiestaDa('2.2.2.2'), 'progetto', opzioni)).toBe(true)
    expect(await consumaLimite(richiestaDa('1.1.1.1'), 'progetto', opzioni)).toBe(false)
  })

  it('conta separatamente gli ambiti: la newsletter non blocca il progetto', async () => {
    const opzioni = { quante: 1, finestraMs: 60_000 }
    expect(await consumaLimite(richiestaDa('1.1.1.1'), 'newsletter', opzioni)).toBe(true)
    expect(await consumaLimite(richiestaDa('1.1.1.1'), 'progetto', opzioni)).toBe(true)
  })

  it('riapre le porte quando la finestra è passata', async () => {
    const opzioni = { quante: 1, finestraMs: 1 }
    expect(await consumaLimite(richiestaDa('1.1.1.1'), 'progetto', opzioni)).toBe(true)
    await new Promise((risolvi) => setTimeout(risolvi, 5))
    expect(await consumaLimite(richiestaDa('1.1.1.1'), 'progetto', opzioni)).toBe(true)
  })
})

describe('consumaLimiteChiave', () => {
  beforeEach(azzeraLimiti)

  it('limita per chiave propria, non per indirizzo', async () => {
    const opzioni = { quante: 2, finestraMs: 60_000 }
    expect(await consumaLimiteChiave('modifica:abc', opzioni)).toBe(true)
    expect(await consumaLimiteChiave('modifica:abc', opzioni)).toBe(true)
    expect(await consumaLimiteChiave('modifica:abc', opzioni)).toBe(false)
    expect(await consumaLimiteChiave('modifica:xyz', opzioni)).toBe(true)
  })
})
