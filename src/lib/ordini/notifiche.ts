import 'server-only'
import { db } from '@/db'
import { eq } from 'drizzle-orm'
import { orderItems, orders, type Order } from '@/db/schema'
import { inviaEmail, emailArtigiano } from '@/lib/email/invia'
import ConfermaOrdine from '@/emails/conferma-ordine'
import NotificaOrdine from '@/emails/notifica-ordine'
import OrdineSpedito from '@/emails/ordine-spedito'
import { ETICHETTE_METODO } from '@/lib/spedizioni/motore'
import { ETICHETTE_PAGAMENTO } from '@/lib/validazioni/checkout'
import { optionalEnv } from '@/lib/env'
import { site } from '@/lib/site'
import type { IndirizzoOrdine } from '@/db/queries/ordini'

type SnapshotVariante = {
  altezzaCm?: number
  diametroCm?: number
  pesoKg?: number
  pesoImballoKg?: number
  finitura?: string
  sku?: string
  giorniDiAttesa?: number
}

function indirizzoTesto(ordine: Order): string {
  const indirizzo = ordine.shippingAddress as IndirizzoOrdine
  return [
    indirizzo.nome,
    indirizzo.indirizzo,
    indirizzo.indirizzo2,
    `${indirizzo.cap} ${indirizzo.citta} (${indirizzo.provincia})`,
    indirizzo.paese === 'IT' ? null : indirizzo.paese,
  ]
    .filter(Boolean)
    .join('\n')
}

function dettaglio(snapshot: SnapshotVariante): string {
  return [
    snapshot.altezzaCm ? `${snapshot.altezzaCm} cm` : null,
    snapshot.finitura,
    snapshot.pesoKg ? `${snapshot.pesoKg} kg` : null,
  ]
    .filter(Boolean)
    .join(' · ')
}

async function vociOrdine(ordineId: string) {
  return db.select().from(orderItems).where(eq(orderItems.orderId, ordineId))
}

export function bonificoConfigurato(): {
  iban: string
  intestatario: string
  banca: string
} | null {
  const iban = optionalEnv('BANK_TRANSFER_IBAN')
  if (!iban) return null
  return {
    iban,
    intestatario: optionalEnv('BANK_TRANSFER_HOLDER') ?? site.legal.companyName,
    banca: optionalEnv('BANK_TRANSFER_BANK') ?? '',
  }
}

/**
 * Email al cliente più notifica all'artigiano. Non solleva mai: un ordine
 * pagato resta valido anche se il servizio di posta ha un'ora storta.
 */
export async function inviaEmailOrdine(ordine: Order): Promise<void> {
  try {
    const voci = await vociOrdine(ordine.id)
    const indirizzo = ordine.shippingAddress as IndirizzoOrdine
    const bonifico = ordine.paymentMethod === 'bank_transfer' ? bonificoConfigurato() : null

    const righe = voci.map((voce) => ({
      nome: voce.productNameSnapshot,
      dettaglio: dettaglio(voce.variantSnapshot as SnapshotVariante),
      quantita: voce.quantity,
      totaleCents: voce.totalCents,
    }))

    const attesa = Math.max(
      0,
      ...voci.map((voce) => (voce.variantSnapshot as SnapshotVariante).giorniDiAttesa ?? 0),
    )

    const pesoTotale =
      Math.round(
        voci.reduce(
          (somma, voce) =>
            somma + ((voce.variantSnapshot as SnapshotVariante).pesoImballoKg ?? 0) * voce.quantity,
          0,
        ) * 100,
      ) / 100

    await inviaEmail({
      a: ordine.email,
      oggetto: bonifico
        ? `Ordine ${ordine.orderNumber} — gli estremi per il bonifico`
        : `Ho ricevuto il tuo ordine ${ordine.orderNumber}`,
      contenuto: ConfermaOrdine({
        numeroOrdine: ordine.orderNumber,
        nomeCliente: indirizzo.nome.split(' ')[0] ?? indirizzo.nome,
        righe,
        subtotaleCents: ordine.subtotalCents,
        spedizioneCents: ordine.shippingCents,
        scontoCents: ordine.discountCents,
        totaleCents: ordine.totalCents,
        metodoSpedizione: ETICHETTE_METODO[ordine.shippingMethod],
        indirizzo: indirizzoTesto(ordine),
        urlOrdine: `${site.url}/ordine/${ordine.id}`,
        urlSito: site.url,
        giorniDiAttesa: attesa,
        bonifico,
      }),
    })

    await inviaEmail({
      a: emailArtigiano(),
      oggetto: `Nuovo ordine ${ordine.orderNumber} — ${(ordine.totalCents / 100).toFixed(2)} €`,
      rispondiA: ordine.email,
      contenuto: NotificaOrdine({
        numeroOrdine: ordine.orderNumber,
        totaleCents: ordine.totalCents,
        metodoPagamento: ETICHETTE_PAGAMENTO[ordine.paymentMethod],
        metodoSpedizione: ETICHETTE_METODO[ordine.shippingMethod],
        pesoKg: pesoTotale,
        cliente: indirizzo.nome,
        email: ordine.email,
        telefono: ordine.phone ?? '',
        indirizzo: indirizzoTesto(ordine),
        noteConsegna: ordine.deliveryNotes,
        fattura: ordine.invoiceRequested
          ? `P.IVA ${ordine.vatNumber ?? '—'} · SDI ${ordine.sdiCode ?? '—'}`
          : null,
        righe: righe.map((riga) => ({
          nome: riga.nome,
          dettaglio: riga.dettaglio,
          quantita: riga.quantita,
        })),
        urlAdmin: `${site.url}/admin/ordini/${ordine.id}`,
        urlSito: site.url,
      }),
    })
  } catch (errore) {
    console.error('Email dell’ordine non inviate:', errore)
  }
}

export async function inviaEmailSpedizione(ordineId: string): Promise<void> {
  try {
    const [ordine] = await db.select().from(orders).where(eq(orders.id, ordineId)).limit(1)
    if (!ordine || !ordine.trackingNumber) return

    const voci = await vociOrdine(ordine.id)
    const indirizzo = ordine.shippingAddress as IndirizzoOrdine
    const pesoTotale =
      Math.round(
        voci.reduce(
          (somma, voce) =>
            somma + ((voce.variantSnapshot as SnapshotVariante).pesoImballoKg ?? 0) * voce.quantity,
          0,
        ) * 100,
      ) / 100

    await inviaEmail({
      a: ordine.email,
      oggetto: `Il tuo ordine ${ordine.orderNumber} è partito`,
      contenuto: OrdineSpedito({
        numeroOrdine: ordine.orderNumber,
        nomeCliente: indirizzo.nome.split(' ')[0] ?? indirizzo.nome,
        corriere: ordine.trackingCarrier ?? 'Corriere',
        tracking: ordine.trackingNumber,
        urlTracking: urlTracking(ordine.trackingCarrier, ordine.trackingNumber),
        urlSito: site.url,
        pesoKg: pesoTotale,
        alPiano: ordine.shippingMethod === 'floor_delivery',
      }),
    })
  } catch (errore) {
    console.error('Email di spedizione non inviata:', errore)
  }
}

/** Pagine di tracciamento dei corrieri che uso più spesso. */
function urlTracking(corriere: string | null, codice: string): string | null {
  if (!corriere) return null
  const normalizzato = corriere.toLowerCase()
  if (normalizzato.includes('brt') || normalizzato.includes('bartolini')) {
    return `https://vas.brt.it/vas/sped_det_show.hsm?ChiaveSpedizione=${encodeURIComponent(codice)}`
  }
  if (normalizzato.includes('gls')) {
    return `https://gls-group.eu/IT/it/servizi-online/ricerca-spedizioni?match=${encodeURIComponent(codice)}`
  }
  if (normalizzato.includes('dhl')) {
    return `https://www.dhl.com/it-it/home/tracking.html?tracking-id=${encodeURIComponent(codice)}`
  }
  if (normalizzato.includes('sda') || normalizzato.includes('poste')) {
    return `https://www.poste.it/cerca/index.html#/risultati-spedizioni/${encodeURIComponent(codice)}`
  }
  return null
}
