import 'server-only'
import { optionalEnv, requireEnv } from '@/lib/env'

/**
 * PayPal via REST, senza SDK: servono tre chiamate in tutto (token, creazione
 * ordine, cattura) e l'SDK ufficiale pesa più di quanto risolva.
 */

function baseUrl(): string {
  return optionalEnv('PAYPAL_ENVIRONMENT') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

export function paypalConfigurato(): boolean {
  return Boolean(optionalEnv('PAYPAL_CLIENT_SECRET') && optionalEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID'))
}

async function token(): Promise<string> {
  const id = requireEnv('NEXT_PUBLIC_PAYPAL_CLIENT_ID')
  const segreto = requireEnv('PAYPAL_CLIENT_SECRET')
  const credenziali = Buffer.from(`${id}:${segreto}`).toString('base64')

  const risposta = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credenziali}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!risposta.ok) {
    throw new Error(`PayPal: autenticazione fallita (${risposta.status}).`)
  }

  const dati = (await risposta.json()) as { access_token: string }
  return dati.access_token
}

export type OrdinePaypal = { id: string; urlApprovazione: string }

export async function creaOrdinePaypal(input: {
  totaleCents: number
  numeroOrdine: string
  ordineId: string
  urlRitorno: string
  urlAnnulla: string
}): Promise<OrdinePaypal> {
  const accesso = await token()

  const risposta = await fetch(`${baseUrl()}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accesso}`,
      'Content-Type': 'application/json',
      // Evita ordini doppi se la richiesta viene rispedita.
      'PayPal-Request-Id': input.ordineId,
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.ordineId,
          custom_id: input.ordineId,
          invoice_id: input.numeroOrdine,
          amount: {
            currency_code: 'EUR',
            value: (input.totaleCents / 100).toFixed(2),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'Materia Etrusca',
            locale: 'it-IT',
            user_action: 'PAY_NOW',
            return_url: input.urlRitorno,
            cancel_url: input.urlAnnulla,
          },
        },
      },
    }),
    cache: 'no-store',
  })

  if (!risposta.ok) {
    throw new Error(`PayPal: creazione ordine fallita (${risposta.status}).`)
  }

  const dati = (await risposta.json()) as {
    id: string
    links: { rel: string; href: string }[]
  }

  const approvazione =
    dati.links.find((collegamento) => collegamento.rel === 'payer-action') ??
    dati.links.find((collegamento) => collegamento.rel === 'approve')

  if (!approvazione) throw new Error('PayPal: manca il link di approvazione.')

  return { id: dati.id, urlApprovazione: approvazione.href }
}

export type EsitoCattura = {
  pagato: boolean
  idTransazione: string | null
  ordineId: string | null
}

export async function catturaOrdinePaypal(idOrdinePaypal: string): Promise<EsitoCattura> {
  const accesso = await token()

  const risposta = await fetch(`${baseUrl()}/v2/checkout/orders/${idOrdinePaypal}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accesso}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `cattura-${idOrdinePaypal}`,
    },
    cache: 'no-store',
  })

  // 422 con issue ORDER_ALREADY_CAPTURED significa che è già andata a buon fine.
  const dati = (await risposta.json()) as {
    status?: string
    purchase_units?: {
      custom_id?: string
      payments?: { captures?: { id: string; status: string }[] }
    }[]
    details?: { issue?: string }[]
  }

  const giaCatturato =
    dati.details?.some((voce) => voce.issue === 'ORDER_ALREADY_CAPTURED') ?? false

  if (!risposta.ok && !giaCatturato) {
    throw new Error(`PayPal: cattura fallita (${risposta.status}).`)
  }

  const unita = dati.purchase_units?.[0]
  const cattura = unita?.payments?.captures?.[0]

  return {
    pagato: giaCatturato || dati.status === 'COMPLETED' || cattura?.status === 'COMPLETED',
    idTransazione: cattura?.id ?? null,
    ordineId: unita?.custom_id ?? null,
  }
}
