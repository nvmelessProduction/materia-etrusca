import 'server-only'
import { Resend } from 'resend'
import type { ReactElement } from 'react'
import { envFlag, optionalEnv } from '@/lib/env'
import { site } from '@/lib/site'

/**
 * Un solo punto d'uscita per le email. Senza chiave configurata, o con
 * EMAIL_DRY_RUN attivo, il messaggio finisce in console: in sviluppo si vede
 * cosa sarebbe partito senza spedire niente a nessuno.
 */

let cliente: Resend | null = null

function resend(): Resend | null {
  const chiave = optionalEnv('RESEND_API_KEY')
  if (!chiave) return null
  cliente ??= new Resend(chiave)
  return cliente
}

export type EsitoInvio = { inviata: boolean; motivo?: string; id?: string }

export async function inviaEmail(messaggio: {
  a: string | string[]
  oggetto: string
  contenuto: ReactElement
  rispondiA?: string
}): Promise<EsitoInvio> {
  const mittente = optionalEnv('EMAIL_FROM') ?? `Materia Etrusca <onboarding@resend.dev>`
  const client = resend()

  if (!client || envFlag('EMAIL_DRY_RUN')) {
    console.info(
      `[email non inviata] a: ${Array.isArray(messaggio.a) ? messaggio.a.join(', ') : messaggio.a} — oggetto: ${messaggio.oggetto}`,
    )
    return { inviata: false, motivo: client ? 'EMAIL_DRY_RUN attivo' : 'RESEND_API_KEY mancante' }
  }

  const esito = await client.emails.send({
    from: mittente,
    to: messaggio.a,
    subject: messaggio.oggetto,
    react: messaggio.contenuto,
    replyTo: messaggio.rispondiA ?? site.artisan.email,
  })

  if (esito.error) {
    // L'invio fallito non deve mai far fallire l'ordine: si registra e si prosegue.
    console.error('Invio email fallito:', esito.error.message)
    return { inviata: false, motivo: esito.error.message }
  }

  return { inviata: true, id: esito.data?.id }
}

/** Dove arrivano le notifiche interne. */
export function emailArtigiano(): string {
  return optionalEnv('ARTISAN_EMAIL') ?? site.artisan.email
}
