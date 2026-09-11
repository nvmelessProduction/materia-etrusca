import 'server-only'
import { cookies } from 'next/headers'
import { componiCarrello, clientePerUtente, trovaCarrello } from '@/db/queries/carrello'
import { sessioneUtente } from '@/lib/auth'
import { carrelloVuoto, type CarrelloPubblico } from '@/lib/carrello/tipi'

export const COOKIE_CARRELLO = 'me_carrello'

/** Un anno: il tempo che passa fra il "mi piace" e il "lo compro" su un pezzo da 600 €. */
export const DURATA_COOKIE_CARRELLO = 60 * 60 * 24 * 365

export type ChiaveSessione = { guestToken: string | null; customerId: string | null }

/**
 * Chi è che sta comprando. In lettura non si crea nulla: i cookie si possono
 * scrivere solo dentro una Server Action o un Route Handler.
 */
export async function chiaveSessione(): Promise<ChiaveSessione> {
  const contenitore = await cookies()
  const guestToken = contenitore.get(COOKIE_CARRELLO)?.value ?? null

  const utente = await sessioneUtente()
  if (!utente) return { guestToken, customerId: null }

  const cliente = await clientePerUtente(utente.id)
  return { guestToken, customerId: cliente?.id ?? null }
}

/** Lettura del carrello, usabile da qualunque Server Component. */
export async function leggiCarrello(): Promise<CarrelloPubblico> {
  const chiave = await chiaveSessione()
  if (!chiave.guestToken && !chiave.customerId) return carrelloVuoto

  const carrello = await trovaCarrello(chiave)
  return componiCarrello(carrello)
}
