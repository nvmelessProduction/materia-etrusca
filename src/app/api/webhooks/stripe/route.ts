import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { annullaOrdine, registraEvento, segnaOrdinePagato } from '@/db/queries/ordini'
import { ordinePerId } from '@/db/queries/ordini'
import { inviaEmailOrdine } from '@/lib/ordini/notifiche'
import { inviaEmail, emailArtigiano } from '@/lib/email/invia'
import { stripe } from '@/lib/pagamenti/stripe'
import { requireEnv } from '@/lib/env'
import { site } from '@/lib/site'
import { Guscio, stili } from '@/emails/base'
import { Text } from '@react-email/components'

/** Il corpo grezzo serve alla verifica della firma: niente parsing prima. */
export const dynamic = 'force-dynamic'

const TIPI_PAGATO = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
])

export async function POST(richiesta: Request): Promise<Response> {
  const firma = richiesta.headers.get('stripe-signature')
  if (!firma) {
    return NextResponse.json({ errore: 'Firma mancante.' }, { status: 400 })
  }

  const corpo = await richiesta.text()

  let evento: Stripe.Event
  try {
    evento = stripe().webhooks.constructEvent(corpo, firma, requireEnv('STRIPE_WEBHOOK_SECRET'))
  } catch (errore) {
    console.error('Webhook Stripe: firma non valida.', errore)
    return NextResponse.json({ errore: 'Firma non valida.' }, { status: 400 })
  }

  // Stripe rispedisce gli eventi finché non riceve un 200: senza questo controllo
  // la stessa sessione scalerebbe la giacenza più di una volta.
  const primaVolta = await registraEvento(evento.id, 'stripe', evento.type)
  if (!primaVolta) {
    return NextResponse.json({ ricevuto: true, gia: true })
  }

  if (!TIPI_PAGATO.has(evento.type)) {
    return NextResponse.json({ ricevuto: true })
  }

  const sessione = evento.data.object as Stripe.Checkout.Session
  const ordineId = sessione.metadata?.ordineId ?? sessione.client_reference_id
  if (!ordineId) {
    console.error('Webhook Stripe: sessione senza ordineId.', sessione.id)
    return NextResponse.json({ ricevuto: true })
  }

  if (sessione.payment_status !== 'paid') {
    return NextResponse.json({ ricevuto: true, inAttesa: true })
  }

  const paymentIntentId =
    typeof sessione.payment_intent === 'string'
      ? sessione.payment_intent
      : (sessione.payment_intent?.id ?? null)

  const esito = await segnaOrdinePagato({ ordineId, stripePaymentIntentId: paymentIntentId })

  if (!esito.ok) {
    if (esito.motivo === 'scorta-insufficiente') {
      await gestisciVenditaDoppia(ordineId, esito.pezziMancanti, paymentIntentId)
      return NextResponse.json({ ricevuto: true, rimborsato: true })
    }
    console.error('Webhook Stripe: ordine inesistente.', ordineId)
    return NextResponse.json({ ricevuto: true })
  }

  if (!esito.giaLavorato) {
    await inviaEmailOrdine(esito.ordine)
  }

  return NextResponse.json({ ricevuto: true })
}

/**
 * Due persone hanno pagato lo stesso pezzo unico nello stesso momento.
 * La transazione ha già impedito la doppia vendita: qui si rimette a posto
 * chi è arrivato secondo, subito e senza farglielo chiedere.
 */
async function gestisciVenditaDoppia(
  ordineId: string,
  pezziMancanti: string[],
  paymentIntentId: string | null,
): Promise<void> {
  const elenco = pezziMancanti.join(', ')
  await annullaOrdine(ordineId, `Annullato automaticamente: ${elenco} non più disponibile.`)

  if (paymentIntentId) {
    try {
      await stripe().refunds.create({
        payment_intent: paymentIntentId,
        reason: 'requested_by_customer',
      })
    } catch (errore) {
      console.error('Rimborso automatico fallito:', errore)
    }
  }

  const ordine = await ordinePerId(ordineId)
  if (!ordine) return

  await inviaEmail({
    a: ordine.email,
    oggetto: `Ordine ${ordine.orderNumber} — devo annullarlo, ti ho già rimborsato`,
    contenuto: Guscio({
      anteprima: 'Ho dovuto annullare il tuo ordine',
      urlSito: site.url,
      children: [
        Text({
          key: 't',
          style: stili.titolo,
          children: 'Mi dispiace: è arrivato qualcuno prima.',
        }),
        Text({
          key: 'p1',
          style: stili.testo,
          children: `${elenco} è un pezzo unico, e nello stesso momento in cui pagavi tu l'ha preso un'altra persona. Il tuo pagamento è già stato rimborsato per intero: vedrai l'accredito in tre o quattro giorni lavorativi, dipende dalla banca.`,
        }),
        Text({
          key: 'p2',
          style: stili.testo,
          children:
            'Se vuoi, posso rifarne uno simile: non sarà identico, perché nessuno lo è, ma la forma è quella. Rispondi a questa email e ne parliamo.',
        }),
      ],
    }),
  })

  await inviaEmail({
    a: emailArtigiano(),
    oggetto: `Vendita doppia evitata su ${ordine.orderNumber}`,
    contenuto: Guscio({
      anteprima: 'Vendita doppia evitata',
      urlSito: site.url,
      children: [
        Text({ key: 't', style: stili.titolo, children: `Ordine ${ordine.orderNumber} annullato` }),
        Text({
          key: 'p',
          style: stili.testo,
          children: `${elenco} non era più disponibile al momento dell'incasso. L'ordine è stato annullato e il pagamento rimborsato in automatico. Il cliente è ${ordine.email}.`,
        }),
      ],
    }),
  })
}
