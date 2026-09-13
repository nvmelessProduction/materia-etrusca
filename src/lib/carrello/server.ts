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

/**
 * Lettura del carrello, usabile da qualunque Server Component.
 *
 * Sta nel layout radice, quindi gira su **ogni** pagina del sito: se il
 * database non risponde è giusto che il conteggio resti a zero, non che
 * l'intero sito restituisca un errore. Il guasto finisce nei log.
 */
export async function leggiCarrello(): Promise<CarrelloPubblico> {
  try {
    const chiave = await chiaveSessione()
    if (!chiave.guestToken && !chiave.customerId) return carrelloVuoto

    const carrello = await trovaCarrello(chiave)
    return componiCarrello(carrello)
  } catch (errore) {
    console.error('Lettura del carrello fallita:', errore)
    return carrelloVuoto
  }
}
