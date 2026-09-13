import 'server-only'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  cartItems,
  carts,
  customers,
  discountCodes,
  orderItems,
  orders,
  processedWebhookEvents,
  productVariants,
  products,
  type MetodoPagamento,
  type MetodoSpedizione,
  type Order,
  type StatoOrdine,
} from '@/db/schema'

export type IndirizzoOrdine = {
  nome: string
  indirizzo: string
  indirizzo2: string | null
  citta: string
  cap: string
  provincia: string
  paese: string
}

export type VoceNuovoOrdine = {
  variantId: string
  nomeProdotto: string
  snapshot: Record<string, unknown>
  quantita: number
  prezzoUnitarioCents: number
  totaleCents: number
}

export type NuovoOrdineInput = {
  email: string
  customerId: string | null
  subtotaleCents: number
  spedizioneCents: number
  scontoCents: number
  totaleCents: number
  codiceSconto: string | null
  metodoSpedizione: MetodoSpedizione
  metodoPagamento: MetodoPagamento
  indirizzo: IndirizzoOrdine
  telefono: string
  noteConsegna: string | null
  fatturaRichiesta: boolean
  partitaIva: string | null
  codiceSdi: string | null
  progettoId: string | null
  voci: VoceNuovoOrdine[]
}

export async function creaOrdine(input: NuovoOrdineInput): Promise<Order> {
  return db.transaction(async (tx) => {
    const [ordine] = await tx
      .insert(orders)
      .values({
        email: input.email,
        customerId: input.customerId,
        status: 'pending',
        subtotalCents: input.subtotaleCents,
        shippingCents: input.spedizioneCents,
        discountCents: input.scontoCents,
        totalCents: input.totaleCents,
        discountCode: input.codiceSconto,
        shippingMethod: input.metodoSpedizione,
        paymentMethod: input.metodoPagamento,
        shippingAddress: input.indirizzo,
        phone: input.telefono,
        deliveryNotes: input.noteConsegna,
        invoiceRequested: input.fatturaRichiesta,
        vatNumber: input.partitaIva,
        sdiCode: input.codiceSdi,
        projectId: input.progettoId,
      })
      .returning()

    if (!ordine) throw new Error('Non sono riuscito a registrare l’ordine.')

    await tx.insert(orderItems).values(
      input.voci.map((voce) => ({
        orderId: ordine.id,
        variantId: voce.variantId,
        productNameSnapshot: voce.nomeProdotto,
        variantSnapshot: voce.snapshot,
        quantity: voce.quantita,
        unitPriceCents: voce.prezzoUnitarioCents,
        totalCents: voce.totaleCents,
      })),
    )

    return ordine
  })
}

export async function ordinePerId(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: true },
  })
}

export async function ordinePerNumero(numero: string) {
  return db.query.orders.findFirst({
    where: eq(orders.orderNumber, numero),
    with: { items: true },
  })
}

export async function ordinePerSessioneStripe(sessionId: string) {
  return db.query.orders.findFirst({
    where: eq(orders.stripeSessionId, sessionId),
    with: { items: true },
  })
}

export async function collegaSessioneStripe(ordineId: string, sessionId: string): Promise<void> {
  await db.update(orders).set({ stripeSessionId: sessionId }).where(eq(orders.id, ordineId))
}

export async function collegaOrdinePaypal(ordineId: string, paypalOrderId: string): Promise<void> {
  await db.update(orders).set({ paypalOrderId }).where(eq(orders.id, ordineId))
}

/**
 * Registra un evento del fornitore di pagamento. Restituisce `false` se
 * quell'evento era già stato lavorato: è questo che rende il webhook
 * idempotente, e i webhook arrivano due volte più spesso di quanto si creda.
 */
export async function registraEvento(id: string, provider: string, tipo: string): Promise<boolean> {
  const inserito = await db
    .insert(processedWebhookEvents)
    .values({ id, provider, type: tipo })
    .onConflictDoNothing({ target: processedWebhookEvents.id })
    .returning({ id: processedWebhookEvents.id })

  return inserito.length > 0
}

export type EsitoPagamento =
  | { ok: true; ordine: Order; giaLavorato: boolean }
  | { ok: false; motivo: 'ordine-inesistente' }
  | { ok: false; motivo: 'scorta-insufficiente'; pezziMancanti: string[] }

/**
 * Segna l'ordine come pagato e scala le giacenze **nella stessa transazione**.
 *
 * Le righe delle varianti vengono bloccate con `for update` prima di essere
 * lette: due pagamenti simultanei sullo stesso pezzo unico si mettono in fila,
 * il primo lo prende e il secondo trova zero. Senza il blocco entrambi
 * leggerebbero "1 disponibile" e lo venderebbero due volte.
 */
export async function segnaOrdinePagato(input: {
  ordineId: string
  stripePaymentIntentId?: string | null
  paypalOrderId?: string | null
}): Promise<EsitoPagamento> {
  return db.transaction(async (tx) => {
    const [ordine] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, input.ordineId))
      .for('update')
      .limit(1)

    if (!ordine) return { ok: false, motivo: 'ordine-inesistente' }

    // Già pagato: non si scala la giacenza due volte.
    if (ordine.status !== 'pending') {
      return { ok: true, ordine, giaLavorato: true }
    }

    const voci = await tx.select().from(orderItems).where(eq(orderItems.orderId, ordine.id))
    const idVarianti = voci.map((voce) => voce.variantId).filter((id): id is string => id !== null)

    if (idVarianti.length > 0) {
      // Ordine stabile nel blocco: due transazioni che prendono gli stessi
      // pezzi in ordine diverso finirebbero in stallo.
      const varianti = await tx
        .select({
          id: productVariants.id,
          stock: productVariants.stock,
          nome: products.name,
          pezzoUnico: products.isUnique,
          suOrdinazione: products.isMadeToOrder,
        })
        .from(productVariants)
        .innerJoin(products, eq(products.id, productVariants.productId))
        .where(inArray(productVariants.id, idVarianti))
        .orderBy(productVariants.id)
        .for('update', { of: productVariants })

      const perId = new Map(varianti.map((variante) => [variante.id, variante]))
      const mancanti: string[] = []

      for (const voce of voci) {
        if (!voce.variantId) continue
        const variante = perId.get(voce.variantId)
        if (!variante) {
          mancanti.push(voce.productNameSnapshot)
          continue
        }
        // Un pezzo su ordinazione si cola apposta: la giacenza non lo vincola.
        // Tutto il resto, pezzi unici compresi, deve esserci davvero.
        if (!variante.suOrdinazione && variante.stock < voce.quantity) {
          mancanti.push(variante.nome)
        }
      }

      if (mancanti.length > 0) {
        return { ok: false, motivo: 'scorta-insufficiente', pezziMancanti: mancanti }
      }

      for (const voce of voci) {
        if (!voce.variantId) continue
        await tx
          .update(productVariants)
          .set({
            // I pezzi su ordinazione non vanno mai sotto zero.
            stock: sql`greatest(${productVariants.stock} - ${voce.quantity}, 0)`,
            updatedAt: new Date(),
          })
          .where(eq(productVariants.id, voce.variantId))
      }
    }

    const [aggiornato] = await tx
      .update(orders)
      .set({
        status: 'paid',
        paidAt: new Date(),
        updatedAt: new Date(),
        ...(input.stripePaymentIntentId
          ? { stripePaymentIntentId: input.stripePaymentIntentId }
          : {}),
        ...(input.paypalOrderId ? { paypalOrderId: input.paypalOrderId } : {}),
      })
      .where(eq(orders.id, ordine.id))
      .returning()

    if (ordine.discountCode) {
      await tx
        .update(discountCodes)
        .set({ usedCount: sql`${discountCodes.usedCount} + 1` })
        .where(eq(discountCodes.code, ordine.discountCode))
    }

    // Il carrello che ha generato l'ordine si svuota: ha finito il suo lavoro.
    const [carrello] = await tx
      .select({ id: carts.id })
      .from(carts)
      .where(
        ordine.customerId ? eq(carts.customerId, ordine.customerId) : eq(carts.email, ordine.email),
      )
      .limit(1)

    if (carrello) {
      await tx.delete(cartItems).where(eq(cartItems.cartId, carrello.id))
      await tx
        .update(carts)
        .set({ convertedOrderId: ordine.id, discountCode: null })
        .where(eq(carts.id, carrello.id))
    }

    return { ok: true, ordine: aggiornato ?? ordine, giaLavorato: false }
  })
}

export async function annullaOrdine(ordineId: string, motivo: string): Promise<void> {
  await db
    .update(orders)
    .set({
      status: 'cancelled',
      notes: sql`coalesce(${orders.notes} || E'\n', '') || ${motivo}`,
      updatedAt: new Date(),
    })
    .where(eq(orders.id, ordineId))
}

export async function aggiornaStatoOrdine(
  ordineId: string,
  stato: StatoOrdine,
  extra?: {
    trackingCarrier?: string | null
    trackingNumber?: string | null
    notes?: string | null
  },
): Promise<void> {
  await db
    .update(orders)
    .set({
      status: stato,
      updatedAt: new Date(),
      ...(stato === 'shipped' ? { shippedAt: new Date() } : {}),
      ...(extra?.trackingCarrier !== undefined ? { trackingCarrier: extra.trackingCarrier } : {}),
      ...(extra?.trackingNumber !== undefined ? { trackingNumber: extra.trackingNumber } : {}),
      ...(extra?.notes !== undefined ? { notes: extra.notes } : {}),
    })
    .where(eq(orders.id, ordineId))
}

export async function trovaOCreaCliente(input: {
  email: string
  nome: string | null
  telefono: string | null
  partitaIva: string | null
  codiceSdi: string | null
  userId?: string | null
}): Promise<string> {
  const email = input.email.toLowerCase()
  const [esistente] = await db.select().from(customers).where(eq(customers.email, email)).limit(1)

  if (esistente) {
    await db
      .update(customers)
      .set({
        name: input.nome ?? esistente.name,
        phone: input.telefono ?? esistente.phone,
        vatNumber: input.partitaIva ?? esistente.vatNumber,
        sdiCode: input.codiceSdi ?? esistente.sdiCode,
        userId: input.userId ?? esistente.userId,
      })
      .where(eq(customers.id, esistente.id))
    return esistente.id
  }

  const [creato] = await db
    .insert(customers)
    .values({
      email,
      name: input.nome,
      phone: input.telefono,
      vatNumber: input.partitaIva,
      sdiCode: input.codiceSdi,
      userId: input.userId ?? null,
    })
    .returning({ id: customers.id })

  if (!creato) throw new Error('Non sono riuscito a registrare il cliente.')
  return creato.id
}

export async function ordiniDelCliente(customerId: string) {
  return db.query.orders.findMany({
    where: eq(orders.customerId, customerId),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
    limit: 50,
  })
}

export async function ordiniDaRecensire(giorni: number) {
  const soglia = new Date(Date.now() - giorni * 24 * 60 * 60 * 1000)
  return db.query.orders.findMany({
    where: and(
      eq(orders.status, 'delivered'),
      sql`${orders.reviewRequestSentAt} is null`,
      sql`${orders.shippedAt} is not null and ${orders.shippedAt} <= ${soglia}`,
    ),
    with: { items: true },
    limit: 50,
  })
}

export async function segnaRecensioneRichiesta(ordineId: string): Promise<void> {
  await db.update(orders).set({ reviewRequestSentAt: new Date() }).where(eq(orders.id, ordineId))
}
