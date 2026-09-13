import { NextResponse } from 'next/server'
import { registraEvento, segnaOrdinePagato } from '@/db/queries/ordini'
import { inviaEmailOrdine } from '@/lib/ordini/notifiche'
import { optionalEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'

type EventoPaypal = {
  id?: string
  event_type?: string
  resource?: {
    id?: string
    custom_id?: string
    supplementary_data?: { related_ids?: { order_id?: string } }
  }
}

/**
 * Rete di sicurezza per chi chiude il browser prima di tornare sul sito.
 * La firma si verifica chiamando PayPal: senza `PAYPAL_WEBHOOK_ID` configurato
 * l'evento viene rifiutato, perché un webhook non verificato non vale nulla.
 */
export async function POST(richiesta: Request): Promise<Response> {
  const webhookId = optionalEnv('PAYPAL_WEBHOOK_ID')
  if (!webhookId) {
    return NextResponse.json({ errore: 'Webhook PayPal non configurato.' }, { status: 503 })
  }

  const corpo = await richiesta.text()
  const intestazioni = richiesta.headers

  const verificato = await verificaFirma(corpo, intestazioni, webhookId)
  if (!verificato) {
    return NextResponse.json({ errore: 'Firma non valida.' }, { status: 400 })
  }

  const evento = JSON.parse(corpo) as EventoPaypal
  if (evento.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
    return NextResponse.json({ ricevuto: true })
  }

  const ordineId = evento.resource?.custom_id
  if (!ordineId) return NextResponse.json({ ricevuto: true })

  const primaVolta = await registraEvento(
    evento.id ?? `paypal-${evento.resource?.id}`,
    'paypal',
    evento.event_type,
  )
  if (!primaVolta) return NextResponse.json({ ricevuto: true, gia: true })

  const esito = await segnaOrdinePagato({
    ordineId,
    paypalOrderId: evento.resource?.supplementary_data?.related_ids?.order_id ?? null,
  })

  if (esito.ok && !esito.giaLavorato) {
    await inviaEmailOrdine(esito.ordine)
  }

  return NextResponse.json({ ricevuto: true })
}

async function verificaFirma(
  corpo: string,
  intestazioni: Headers,
  webhookId: string,
): Promise<boolean> {
  const id = optionalEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID')
  const segreto = optionalEnv('PAYPAL_CLIENT_SECRET')
  if (!id || !segreto) return false

  const base =
    optionalEnv('PAYPAL_ENVIRONMENT') === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'

  const credenziali = Buffer.from(`${id}:${segreto}`).toString('base64')
  const rispostaToken = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credenziali}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })
  if (!rispostaToken.ok) return false
  const { access_token } = (await rispostaToken.json()) as { access_token: string }

  const risposta = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: intestazioni.get('paypal-auth-algo'),
      cert_url: intestazioni.get('paypal-cert-url'),
      transmission_id: intestazioni.get('paypal-transmission-id'),
      transmission_sig: intestazioni.get('paypal-transmission-sig'),
      transmission_time: intestazioni.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(corpo),
    }),
    cache: 'no-store',
  })

  if (!risposta.ok) return false
  const esito = (await risposta.json()) as { verification_status?: string }
  return esito.verification_status === 'SUCCESS'
}
