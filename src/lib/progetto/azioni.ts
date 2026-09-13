'use server'

import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { designRequests } from '@/db/schema'
import { componiCarrello, scriviRiga, trovaOCreaCarrello } from '@/db/queries/carrello'
import { richiestaPerToken, variantiDellaProposta } from '@/db/queries/progetti'
import { chiaveSessione, COOKIE_CARRELLO, DURATA_COOKIE_CARRELLO } from '@/lib/carrello/server'
import { carrelloVuoto, type CarrelloPubblico } from '@/lib/carrello/tipi'
import { inviaEmail, emailArtigiano } from '@/lib/email/invia'
import { Guscio, stili } from '@/emails/base'
import { Text } from '@react-email/components'
import { consumaLimiteChiave } from '@/lib/limite-richieste'
import { site } from '@/lib/site'
import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'

export type EsitoProposta = {
  ok: boolean
  messaggio?: string
  carrello: CarrelloPubblico
  aggiunti: number
}

/**
 * «Aggiungi tutto al carrello» dalla pagina della proposta.
 *
 * È la funzione che alza il valore medio dell'ordine: chi arriva qui ha già
 * deciso, e non deve ripassare da tre schede prodotto per comprare tre pezzi.
 * Le varianti vengono comunque riprese dal database — il client manda solo
 * quali voci ha lasciato spuntate.
 */
export async function aggiungiPropostaAlCarrello(
  token: string,
  variantIdSelezionati: string[],
): Promise<EsitoProposta> {
  const lettura = z
    .object({ token: z.uuid(), variantIds: z.array(z.uuid()).max(20) })
    .safeParse({ token, variantIds: variantIdSelezionati })

  if (!lettura.success) {
    return { ok: false, messaggio: 'Richiesta non valida.', carrello: carrelloVuoto, aggiunti: 0 }
  }

  const richiesta = await richiestaPerToken(lettura.data.token)
  if (!richiesta) {
    return {
      ok: false,
      messaggio: 'Questa proposta non esiste più.',
      carrello: carrelloVuoto,
      aggiunti: 0,
    }
  }

  if (richiesta.expiresAt && richiesta.expiresAt.getTime() < Date.now()) {
    return {
      ok: false,
      messaggio: 'Questa proposta è scaduta. Scrivimi e te la rifaccio aggiornata.',
      carrello: carrelloVuoto,
      aggiunti: 0,
    }
  }

  const voci = await variantiDellaProposta(lettura.data.token)
  const selezionati = new Set(lettura.data.variantIds)
  const daAggiungere = voci.filter((voce) => selezionati.has(voce.variantId))

  if (daAggiungere.length === 0) {
    return {
      ok: false,
      messaggio: 'Non hai lasciato selezionato nessun pezzo.',
      carrello: carrelloVuoto,
      aggiunti: 0,
    }
  }

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

  const carrello = await trovaOCreaCarrello({ guestToken, customerId: chiave.customerId })

  let aggiunti = 0
  let saltati = 0

  for (const voce of daAggiungere) {
    const disponibile = voce.stato === 'active' && (voce.giacenza > 0 || voce.suOrdinazione)
    if (!disponibile) {
      saltati += 1
      continue
    }
    const quantita = voce.suOrdinazione
      ? voce.quantita
      : Math.min(voce.quantita, Math.max(1, voce.giacenza))
    await scriviRiga(carrello.id, voce.variantId, quantita)
    aggiunti += 1
  }

  // La richiesta diventa "convertita" appena il carrello si riempie da qui:
  // è così che si misura se questo flusso funziona davvero.
  if (aggiunti > 0 && richiesta.status !== 'converted') {
    await db
      .update(designRequests)
      .set({ status: 'converted' })
      .where(and(eq(designRequests.id, richiesta.id), sql`${designRequests.status} <> 'converted'`))
  }

  revalidatePath('/carrello')

  return {
    ok: aggiunti > 0,
    aggiunti,
    messaggio:
      saltati > 0
        ? `Ho aggiunto ${aggiunti} ${aggiunti === 1 ? 'pezzo' : 'pezzi'}: ${saltati} nel frattempo non ${saltati === 1 ? 'è' : 'sono'} più disponibile.`
        : undefined,
    carrello: await componiCarrello(carrello),
  }
}

export type EsitoModifica = { ok: boolean; messaggio: string }

/** «Chiedi una modifica»: una email all'artigiano, senza moduli di assistenza. */
export async function chiediModifica(token: string, testo: string): Promise<EsitoModifica> {
  const lettura = z
    .object({ token: z.uuid(), testo: z.string().trim().min(5).max(2000) })
    .safeParse({ token, testo })

  if (!lettura.success) {
    return { ok: false, messaggio: 'Scrivimi due righe in più e riprovo a capirci qualcosa.' }
  }

  const permesso = await consumaLimiteChiave(`modifica:${lettura.data.token}`, {
    quante: 3,
    finestraMs: 60 * 60 * 1000,
  })
  if (!permesso) {
    return { ok: false, messaggio: 'Mi hai già scritto poco fa: sto leggendo, dammi un momento.' }
  }

  const richiesta = await richiestaPerToken(lettura.data.token)
  if (!richiesta) return { ok: false, messaggio: 'Questa proposta non esiste più.' }

  await inviaEmail({
    a: emailArtigiano(),
    rispondiA: richiesta.email,
    oggetto: `Modifica richiesta da ${richiesta.name}`,
    contenuto: Guscio({
      anteprima: `${richiesta.name} chiede una modifica`,
      urlSito: site.url,
      children: [
        Text({ key: 't', style: stili.titolo, children: `${richiesta.name} chiede una modifica` }),
        Text({ key: 'm', style: stili.testo, children: lettura.data.testo }),
        Text({
          key: 'l',
          style: stili.tenue,
          children: `Proposta: ${site.url}/progetto/${richiesta.publicToken} — rispondi a ${richiesta.email}`,
        }),
      ],
    }),
  })

  return {
    ok: true,
    messaggio: 'Ricevuto. Ti rispondo io, di solito entro un paio di giorni.',
  }
}
