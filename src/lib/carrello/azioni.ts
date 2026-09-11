'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { z } from 'zod'
import {
  aggiornaCarrello,
  componiCarrello,
  scontoPerCodice,
  scriviRiga,
  svuotaRighe,
  trovaCarrello,
  trovaOCreaCarrello,
} from '@/db/queries/carrello'
import { varianteConProdotto } from '@/db/queries/prodotti'
import { aProdottoDominio, aScontoDominio, aVarianteDominio } from '@/db/queries/mappatori'
import { verificaQuantita } from '@/lib/dominio/disponibilita'
import { calcolaSconto, spiegaScontoNonValido } from '@/lib/dominio/prezzi'
import { COOKIE_CARRELLO, DURATA_COOKIE_CARRELLO, chiaveSessione } from '@/lib/carrello/server'
import { carrelloVuoto, type CarrelloPubblico } from '@/lib/carrello/tipi'
import { isValidPostalCode } from '@/lib/utils'

export type EsitoCarrello = {
  ok: boolean
  carrello: CarrelloPubblico
  messaggio?: string
}

const schemaAggiunta = z.object({
  variantId: z.string().uuid(),
  quantita: z.number().int().min(1).max(20),
})

/** Ricava il carrello scrivibile, creando cookie e riga se non ci sono ancora. */
async function carrelloScrivibile() {
  const chiave = await chiaveSessione()
  let guestToken = chiave.guestToken

  if (!guestToken && !chiave.customerId) {
    guestToken = randomUUID()
    const contenitore = await cookies()
    contenitore.set(COOKIE_CARRELLO, guestToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: DURATA_COOKIE_CARRELLO,
    })
  }

  return trovaOCreaCarrello({ guestToken, customerId: chiave.customerId })
}

async function rileggi(): Promise<CarrelloPubblico> {
  const chiave = await chiaveSessione()
  const carrello = await trovaCarrello(chiave)
  return componiCarrello(carrello)
}

function aggiorna(): void {
  revalidatePath('/carrello')
  revalidatePath('/checkout')
}

export async function aggiungiAlCarrello(variantId: string, quantita = 1): Promise<EsitoCarrello> {
  const lettura = schemaAggiunta.safeParse({ variantId, quantita })
  if (!lettura.success) {
    return { ok: false, carrello: await rileggi(), messaggio: 'Richiesta non valida.' }
  }

  const variante = await varianteConProdotto(lettura.data.variantId)
  if (!variante || variante.product.status !== 'active') {
    return { ok: false, carrello: await rileggi(), messaggio: 'Questo pezzo non è più in vendita.' }
  }

  const carrello = await carrelloScrivibile()
  const attuale = await componiCarrello(carrello)
  const giaNelCarrello = attuale.righe.find((riga) => riga.variantId === variante.id)?.quantita ?? 0

  const esito = verificaQuantita(
    giaNelCarrello + lettura.data.quantita,
    aVarianteDominio(variante),
    aProdottoDominio(variante.product),
  )

  if (!esito.ok) {
    const messaggio =
      esito.quantitaMassima === 0
        ? variante.product.isUnique
          ? 'È un pezzo unico e ce l’hai già nel carrello.'
          : 'Questo pezzo è esaurito.'
        : `Di questo ne ho ${esito.quantitaMassima}.`
    return { ok: false, carrello: attuale, messaggio }
  }

  await scriviRiga(carrello.id, variante.id, esito.quantita)
  aggiorna()

  return { ok: true, carrello: await componiCarrello(carrello) }
}

export async function impostaQuantita(variantId: string, quantita: number): Promise<EsitoCarrello> {
  const lettura = z
    .object({ variantId: z.string().uuid(), quantita: z.number().int().min(0).max(20) })
    .safeParse({ variantId, quantita })

  if (!lettura.success) {
    return { ok: false, carrello: await rileggi(), messaggio: 'Richiesta non valida.' }
  }

  const chiave = await chiaveSessione()
  const carrello = await trovaCarrello(chiave)
  if (!carrello) return { ok: false, carrello: carrelloVuoto }

  if (lettura.data.quantita === 0) {
    await scriviRiga(carrello.id, lettura.data.variantId, 0)
    aggiorna()
    return { ok: true, carrello: await componiCarrello(carrello) }
  }

  const variante = await varianteConProdotto(lettura.data.variantId)
  if (!variante) {
    await scriviRiga(carrello.id, lettura.data.variantId, 0)
    return { ok: true, carrello: await componiCarrello(carrello) }
  }

  const esito = verificaQuantita(
    lettura.data.quantita,
    aVarianteDominio(variante),
    aProdottoDominio(variante.product),
  )

  await scriviRiga(
    carrello.id,
    variante.id,
    esito.ok ? esito.quantita : Math.max(0, esito.quantitaMassima),
  )
  aggiorna()

  return {
    ok: esito.ok,
    carrello: await componiCarrello(carrello),
    messaggio: esito.ok ? undefined : `Di questo ne ho ${esito.quantitaMassima}.`,
  }
}

export async function rimuoviDalCarrello(variantId: string): Promise<EsitoCarrello> {
  return impostaQuantita(variantId, 0)
}

export async function svuotaCarrello(): Promise<EsitoCarrello> {
  const chiave = await chiaveSessione()
  const carrello = await trovaCarrello(chiave)
  if (!carrello) return { ok: true, carrello: carrelloVuoto }

  await svuotaRighe(carrello.id)
  aggiorna()
  return { ok: true, carrello: await componiCarrello(carrello) }
}

export async function impostaCapCarrello(cap: string): Promise<EsitoCarrello> {
  const pulito = cap.trim()
  if (pulito !== '' && !isValidPostalCode(pulito)) {
    return { ok: false, carrello: await rileggi(), messaggio: 'Il CAP ha cinque cifre.' }
  }

  const carrello = await carrelloScrivibile()
  await aggiornaCarrello(carrello.id, { postalCode: pulito === '' ? null : pulito })
  aggiorna()
  return { ok: true, carrello: await componiCarrello(carrello) }
}

export async function applicaCodiceSconto(codice: string): Promise<EsitoCarrello> {
  const pulito = codice.trim().toUpperCase()
  const chiave = await chiaveSessione()
  const carrello = await trovaCarrello(chiave)
  if (!carrello) {
    return { ok: false, carrello: carrelloVuoto, messaggio: 'Il carrello è vuoto.' }
  }

  if (pulito === '') {
    await aggiornaCarrello(carrello.id, { discountCode: null })
    aggiorna()
    return { ok: true, carrello: await componiCarrello(carrello) }
  }

  const attuale = await componiCarrello(carrello)
  const riga = await scontoPerCodice(pulito)
  // La validazione è qui, sul server: il codice che arriva dal client è solo testo.
  const esito = calcolaSconto(riga ? aScontoDominio(riga) : null, attuale.subtotaleCents)

  if (!esito.valido) {
    return { ok: false, carrello: attuale, messaggio: spiegaScontoNonValido(esito.motivo) }
  }

  await aggiornaCarrello(carrello.id, { discountCode: pulito })
  aggiorna()
  return { ok: true, carrello: await componiCarrello(carrello) }
}

export async function rimuoviCodiceSconto(): Promise<EsitoCarrello> {
  return applicaCodiceSconto('')
}
