import 'server-only'
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { cartItems, carts, customers, discountCodes, type Cart } from '@/db/schema'
import { aScontoDominio, numero } from '@/db/queries/mappatori'
import { immaginiPerVarianti, variantiConProdotto } from '@/db/queries/prodotti'
import { aProdottoDominio, aVarianteDominio } from '@/db/queries/mappatori'
import { calcolaSconto } from '@/lib/dominio/prezzi'
import { prezzoVariante } from '@/lib/dominio/prezzi'
import { disponibilitaVariante } from '@/lib/dominio/disponibilita'
import { carrelloVuoto, type CarrelloPubblico, type RigaCarrello } from '@/lib/carrello/tipi'
import { ETICHETTE_FINITURA } from '@/lib/catalogo/etichette'

export type ChiaveCarrello = { guestToken?: string | null; customerId?: string | null }

export async function trovaCarrello(chiave: ChiaveCarrello): Promise<Cart | null> {
  if (chiave.customerId) {
    const [riga] = await db
      .select()
      .from(carts)
      .where(eq(carts.customerId, chiave.customerId))
      .limit(1)
    if (riga) return riga
  }
  if (chiave.guestToken) {
    const [riga] = await db
      .select()
      .from(carts)
      .where(eq(carts.guestToken, chiave.guestToken))
      .limit(1)
    return riga ?? null
  }
  return null
}

export async function creaCarrello(chiave: ChiaveCarrello): Promise<Cart> {
  const [riga] = await db
    .insert(carts)
    .values({
      customerId: chiave.customerId ?? null,
      guestToken: chiave.guestToken ?? null,
    })
    .returning()

  if (!riga) throw new Error('Non sono riuscito a creare il carrello.')
  return riga
}

export async function trovaOCreaCarrello(chiave: ChiaveCarrello): Promise<Cart> {
  return (await trovaCarrello(chiave)) ?? (await creaCarrello(chiave))
}

/**
 * Quando un ospite accede, il suo carrello va con lui: si uniscono le righe
 * invece di perderle. È il momento in cui si abbandona di più.
 */
export async function unisciCarrelli(guestToken: string, customerId: string): Promise<void> {
  const ospite = await trovaCarrello({ guestToken })
  if (!ospite) return

  const utente = await trovaCarrello({ customerId })
  if (!utente) {
    await db.update(carts).set({ customerId, guestToken: null }).where(eq(carts.id, ospite.id))
    return
  }

  const righeOspite = await db.select().from(cartItems).where(eq(cartItems.cartId, ospite.id))

  for (const riga of righeOspite) {
    await db
      .insert(cartItems)
      .values({ cartId: utente.id, variantId: riga.variantId, quantity: riga.quantity })
      .onConflictDoUpdate({
        target: [cartItems.cartId, cartItems.variantId],
        // Si tiene la quantità più alta: sommare porterebbe a doppioni indesiderati.
        set: { quantity: sql`greatest(${cartItems.quantity}, ${riga.quantity})` },
      })
  }

  await db.delete(carts).where(eq(carts.id, ospite.id))
}

export async function scriviRiga(
  cartId: string,
  variantId: string,
  quantita: number,
): Promise<void> {
  if (quantita <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.variantId, variantId)))
    return
  }

  await db
    .insert(cartItems)
    .values({ cartId, variantId, quantity: quantita })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.variantId],
      set: { quantity: quantita },
    })

  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId))
}

export async function svuotaRighe(cartId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId))
}

export async function aggiornaCarrello(
  cartId: string,
  dati: { postalCode?: string | null; discountCode?: string | null; email?: string | null },
): Promise<void> {
  await db
    .update(carts)
    .set({ ...dati, updatedAt: new Date() })
    .where(eq(carts.id, cartId))
}

/**
 * Ricostruisce il carrello pubblico leggendo i prezzi dal database.
 * Quello che il client manda è solo l'identificativo della variante e una
 * quantità: prezzi, pesi e disponibilità li decide sempre il server.
 */
export async function componiCarrello(carrello: Cart | null): Promise<CarrelloPubblico> {
  if (!carrello) return carrelloVuoto

  const righe = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, carrello.id))
    .orderBy(cartItems.addedAt)

  if (righe.length === 0) {
    return {
      ...carrelloVuoto,
      cap: carrello.postalCode,
      codiceSconto: carrello.discountCode,
    }
  }

  const varianti = await variantiConProdotto(righe.map((riga) => riga.variantId))
  const perId = new Map(varianti.map((variante) => [variante.id, variante]))
  const immagini = await immaginiPerVarianti(
    varianti.map((variante) => variante.id),
    varianti.map((variante) => variante.productId),
  )

  const composte: RigaCarrello[] = []

  for (const riga of righe) {
    const variante = perId.get(riga.variantId)
    // Un pezzo archiviato mentre era nel carrello semplicemente sparisce.
    if (!variante || variante.product.status !== 'active') continue

    const dominioVariante = aVarianteDominio(variante)
    const dominioProdotto = aProdottoDominio(variante.product)
    const disponibilita = disponibilitaVariante(dominioVariante, dominioProdotto)
    const prezzoUnitario = prezzoVariante(dominioVariante, dominioProdotto)

    // Se la giacenza è calata nel frattempo, la riga si adegua senza rumore.
    const quantita = Math.max(0, Math.min(riga.quantity, disponibilita.quantitaMassima))
    if (quantita === 0) continue

    const immagine = immagini.get(variante.id) ?? immagini.get(variante.productId) ?? null

    composte.push({
      variantId: variante.id,
      productId: variante.productId,
      slug: variante.product.slug,
      nomeProdotto: variante.product.name,
      finitura: ETICHETTE_FINITURA[variante.finish],
      altezzaCm: dominioVariante.altezzaCm,
      diametroCm: dominioVariante.diametroCm,
      pesoKg: dominioVariante.pesoKg,
      pesoImballoKg: dominioVariante.pesoImballoKg,
      immagineUrl: immagine?.url ?? null,
      immagineAlt: immagine?.alt ?? variante.product.name,
      prezzoUnitarioCents: prezzoUnitario,
      quantita,
      disponibili: disponibilita.quantitaMassima,
      isUnique: variante.product.isUnique,
      isMadeToOrder: variante.product.isMadeToOrder,
      leadTimeDays: variante.product.leadTimeDays,
      totaleCents: prezzoUnitario * quantita,
    })
  }

  const subtotaleCents = composte.reduce((somma, riga) => somma + riga.totaleCents, 0)
  const pesoTotaleKg =
    Math.round(
      composte.reduce((somma, riga) => somma + riga.pesoImballoKg * riga.quantita, 0) * 100,
    ) / 100

  let scontoCents = 0
  let codiceSconto: string | null = null

  if (carrello.discountCode) {
    const sconto = await scontoPerCodice(carrello.discountCode)
    const esito = calcolaSconto(sconto ? aScontoDominio(sconto) : null, subtotaleCents)
    if (esito.valido) {
      scontoCents = esito.scontoCents
      codiceSconto = carrello.discountCode
    }
  }

  return {
    righe: composte,
    subtotaleCents,
    pesoTotaleKg,
    cap: carrello.postalCode,
    codiceSconto,
    scontoCents,
  }
}

export async function scontoPerCodice(codice: string) {
  const [riga] = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, codice.trim().toUpperCase()))
    .limit(1)
  return riga ?? null
}

export async function clientePerEmail(email: string) {
  const [riga] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, email.toLowerCase()))
    .limit(1)
  return riga ?? null
}

export async function clientePerUtente(userId: string) {
  const [riga] = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1)
  return riga ?? null
}

/** Peso a imballo di una singola variante, per la stima in scheda prodotto. */
export async function pesoImballoVariante(variantId: string): Promise<number | null> {
  const variante = await db.query.productVariants.findFirst({
    where: (tabella, { eq: uguale }) => uguale(tabella.id, variantId),
    columns: { packageWeightKg: true },
  })
  return variante ? numero(variante.packageWeightKg) : null
}
