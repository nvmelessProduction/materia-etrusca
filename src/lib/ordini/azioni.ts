'use server'

import { db } from '@/db'
import { newsletterSubscribers } from '@/db/schema'
import { fasceSpedizione } from '@/db/queries/spedizioni'
import {
  collegaOrdinePaypal,
  collegaSessioneStripe,
  creaOrdine,
  trovaOCreaCliente,
  type VoceNuovoOrdine,
} from '@/db/queries/ordini'
import { sessioneUtente } from '@/lib/auth'
import { leggiCarrello } from '@/lib/carrello/server'
import { calcolaSpedizione, trovaOpzione } from '@/lib/spedizioni/motore'
import { totaliOrdine } from '@/lib/dominio/prezzi'
import { schemaCheckout } from '@/lib/validazioni/checkout'
import { creaOrdinePaypal, paypalConfigurato } from '@/lib/pagamenti/paypal'
import { stripe, stripeConfigurato } from '@/lib/pagamenti/stripe'
import { inviaEmailOrdine } from '@/lib/ordini/notifiche'
import { site } from '@/lib/site'

export type EsitoCheckout = { ok: true; destinazione: string } | { ok: false; messaggio: string }

/**
 * Dal modulo all'ordine. Tutto viene ricalcolato qui: il client manda solo
 * dati di consegna e preferenze, mai importi. I prezzi che arrivassero dal
 * browser sarebbero semplicemente ignorati.
 */
export async function avviaPagamento(datiGrezzi: unknown): Promise<EsitoCheckout> {
  const lettura = schemaCheckout.safeParse(datiGrezzi)
  if (!lettura.success) {
    const primo = lettura.error.issues[0]
    return { ok: false, messaggio: primo?.message ?? 'Controlla i dati inseriti.' }
  }
  const dati = lettura.data

  // Campo esca compilato: è un robot. Si risponde ok e non si fa nulla.
  if (dati.azienda && dati.azienda.length > 0) {
    return { ok: true, destinazione: '/carrello' }
  }

  const carrello = await leggiCarrello()
  if (carrello.righe.length === 0) {
    return { ok: false, messaggio: 'Il carrello è vuoto.' }
  }

  const nonDisponibili = carrello.righe.filter((riga) => riga.quantita > riga.disponibili)
  if (nonDisponibili.length > 0) {
    return {
      ok: false,
      messaggio: `Nel frattempo è cambiata la disponibilità di ${nonDisponibili
        .map((riga) => riga.nomeProdotto)
        .join(', ')}. Torna al carrello e controlla.`,
    }
  }

  const fasce = await fasceSpedizione()
  const spedizione = calcolaSpedizione({
    righe: carrello.righe.map((riga) => ({
      pesoImballoKg: riga.pesoImballoKg,
      volumeImballoL: 0,
      quantita: riga.quantita,
    })),
    fasce,
    cap: dati.cap,
    paese: dati.paese,
  })

  const scelta = trovaOpzione(spedizione, dati.metodoSpedizione)
  if (!scelta) {
    return {
      ok: false,
      messaggio: 'Quel metodo di spedizione non è disponibile per questo ordine.',
    }
  }
  if (scelta.prezzoCents === null) {
    return {
      ok: false,
      messaggio:
        'Questo ordine viaggia su pallet e va quotato a mano: scrivimi e ti mando il preventivo, oppure scegli il ritiro in laboratorio.',
    }
  }

  const alPiano =
    dati.consegnaAlPiano && dati.metodoSpedizione !== 'pickup'
      ? trovaOpzione(spedizione, 'floor_delivery')
      : null

  const speseCents = scelta.prezzoCents + (alPiano?.prezzoCents ?? 0)
  const totali = totaliOrdine({
    subtotaleCents: carrello.subtotaleCents,
    spedizioneCents: speseCents,
    scontoCents: carrello.scontoCents,
  })

  const utente = await sessioneUtente()
  const customerId = await trovaOCreaCliente({
    email: dati.email,
    nome: dati.nome,
    telefono: dati.telefono,
    partitaIva: dati.fatturaRichiesta ? (dati.partitaIva ?? null) : null,
    codiceSdi: dati.fatturaRichiesta ? (dati.codiceSdi ?? null) : null,
    userId: utente?.id ?? null,
  })

  const voci: VoceNuovoOrdine[] = carrello.righe.map((riga) => ({
    variantId: riga.variantId,
    nomeProdotto: riga.nomeProdotto,
    snapshot: {
      sku: riga.variantId,
      altezzaCm: riga.altezzaCm,
      diametroCm: riga.diametroCm,
      pesoKg: riga.pesoKg,
      pesoImballoKg: riga.pesoImballoKg,
      finitura: riga.finitura,
      slug: riga.slug,
      giorniDiAttesa: riga.isMadeToOrder ? riga.leadTimeDays : 0,
      pezzoUnico: riga.isUnique,
    },
    quantita: riga.quantita,
    prezzoUnitarioCents: riga.prezzoUnitarioCents,
    totaleCents: riga.totaleCents,
  }))

  const ordine = await creaOrdine({
    email: dati.email,
    customerId,
    subtotaleCents: totali.subtotaleCents,
    spedizioneCents: totali.spedizioneCents,
    scontoCents: totali.scontoCents,
    totaleCents: totali.totaleCents,
    codiceSconto: carrello.codiceSconto,
    // La consegna al piano è un supplemento, ma nell'ordine resta il metodo che conta.
    metodoSpedizione: alPiano ? 'floor_delivery' : dati.metodoSpedizione,
    metodoPagamento: dati.metodoPagamento,
    indirizzo: {
      nome: dati.nome,
      indirizzo: dati.indirizzo,
      indirizzo2: dati.indirizzo2 || null,
      citta: dati.citta,
      cap: dati.cap,
      provincia: dati.provincia,
      paese: dati.paese,
    },
    telefono: dati.telefono,
    noteConsegna: dati.noteConsegna || null,
    fatturaRichiesta: dati.fatturaRichiesta,
    partitaIva: dati.fatturaRichiesta ? (dati.partitaIva ?? null) : null,
    codiceSdi: dati.fatturaRichiesta ? (dati.codiceSdi ?? null) : null,
    progettoId: null,
    voci,
  })

  if (dati.newsletter) {
    // Consenso separato da quello sull'ordine: si registra solo se spuntato.
    await db
      .insert(newsletterSubscribers)
      .values({ email: dati.email, source: 'checkout' })
      .onConflictDoNothing({ target: newsletterSubscribers.email })
  }

  if (dati.metodoPagamento === 'bank_transfer') {
    // L'ordine resta in attesa: le giacenze si scalano quando vedo il bonifico.
    await inviaEmailOrdine(ordine)
    return { ok: true, destinazione: `/ordine/${ordine.id}` }
  }

  if (dati.metodoPagamento === 'paypal') {
    if (!paypalConfigurato()) {
      return { ok: false, messaggio: 'PayPal non è al momento disponibile. Prova con la carta.' }
    }
    const ordinePaypal = await creaOrdinePaypal({
      totaleCents: totali.totaleCents,
      numeroOrdine: ordine.orderNumber,
      ordineId: ordine.id,
      urlRitorno: `${site.url}/ordine/${ordine.id}/paypal`,
      urlAnnulla: `${site.url}/checkout?annullato=1`,
    })
    await collegaOrdinePaypal(ordine.id, ordinePaypal.id)
    return { ok: true, destinazione: ordinePaypal.urlApprovazione }
  }

  if (!stripeConfigurato()) {
    return { ok: false, messaggio: 'Il pagamento con carta non è al momento disponibile.' }
  }

  const sessione = await stripe().checkout.sessions.create({
    mode: 'payment',
    locale: 'it',
    customer_email: dati.email,
    client_reference_id: ordine.id,
    metadata: { ordineId: ordine.id, numeroOrdine: ordine.orderNumber },
    payment_intent_data: {
      metadata: { ordineId: ordine.id, numeroOrdine: ordine.orderNumber },
      description: `Ordine ${ordine.orderNumber} — Materia Etrusca`,
    },
    line_items: [
      ...carrello.righe.map((riga) => ({
        quantity: riga.quantita,
        price_data: {
          currency: 'eur',
          unit_amount: riga.prezzoUnitarioCents,
          product_data: {
            name: riga.nomeProdotto,
            description: `${riga.altezzaCm} cm · ${riga.finitura}`,
            images: riga.immagineUrl ? [riga.immagineUrl] : undefined,
          },
        },
      })),
      ...(totali.spedizioneCents > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: 'eur',
                unit_amount: totali.spedizioneCents,
                product_data: {
                  name: alPiano ? `${scelta.etichetta} + consegna al piano` : scelta.etichetta,
                },
              },
            },
          ]
        : []),
    ],
    ...(totali.scontoCents > 0
      ? {
          discounts: [
            {
              coupon: (
                await stripe().coupons.create({
                  amount_off: totali.scontoCents,
                  currency: 'eur',
                  duration: 'once',
                  name: carrello.codiceSconto ?? 'Sconto',
                })
              ).id,
            },
          ],
        }
      : {}),
    success_url: `${site.url}/ordine/${ordine.id}?pagamento=ok`,
    cancel_url: `${site.url}/checkout?annullato=1`,
  })

  await collegaSessioneStripe(ordine.id, sessione.id)

  if (!sessione.url) {
    return { ok: false, messaggio: 'Non sono riuscito ad aprire la pagina di pagamento.' }
  }

  return { ok: true, destinazione: sessione.url }
}
