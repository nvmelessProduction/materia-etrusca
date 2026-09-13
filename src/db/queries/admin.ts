import 'server-only'
import { and, asc, count, desc, eq, gte, inArray, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  collections,
  contentBlocks,
  designProposalItems,
  designProposals,
  designRequestPhotos,
  designRequests,
  discountCodes,
  orderItems,
  orders,
  productImages,
  productVariants,
  products,
  reviews,
  shippingRates,
  type StatoOrdine,
  type StatoRichiesta,
} from '@/db/schema'
import { numero } from '@/db/queries/mappatori'

/* ------------------------------------------------------------------ *
 * Riepilogo
 * ------------------------------------------------------------------ */

export type Riepilogo = {
  venditeCents: number
  ordini: number
  ordiniDaPreparare: number
  richiesteNuove: number
  richiesteTotali: number
  richiesteConvertite: number
  tassoConversione: number
  scorteBasse: { nome: string; sku: string; giacenza: number; slug: string }[]
  recensioniDaApprovare: number
}

/** Sotto questa soglia il pezzo va rifatto prima che finisca. */
export const SOGLIA_SCORTE = 2

export async function riepilogo(giorni = 30): Promise<Riepilogo> {
  const da = new Date(Date.now() - giorni * 24 * 60 * 60 * 1000)
  const statiIncassati: StatoOrdine[] = ['paid', 'processing', 'shipped', 'delivered']

  const [vendite] = await db
    .select({
      totale: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
      quanti: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, da), inArray(orders.status, statiIncassati)))

  const [daPreparare] = await db
    .select({ quanti: sql<number>`count(*)::int` })
    .from(orders)
    .where(inArray(orders.status, ['paid', 'processing']))

  const [richieste] = await db
    .select({
      totali: sql<number>`count(*)::int`,
      nuove: sql<number>`count(*) filter (where ${designRequests.status} = 'new')::int`,
      convertite: sql<number>`count(*) filter (where ${designRequests.status} = 'converted')::int`,
    })
    .from(designRequests)
    .where(gte(designRequests.createdAt, da))

  const scorte = await db
    .select({
      nome: products.name,
      slug: products.slug,
      sku: productVariants.sku,
      giacenza: productVariants.stock,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        eq(products.status, 'active'),
        eq(products.isMadeToOrder, false),
        isNull(productVariants.archivedAt),
        sql`${productVariants.stock} <= ${SOGLIA_SCORTE}`,
      ),
    )
    .orderBy(asc(productVariants.stock))
    .limit(12)

  const [recensioni] = await db
    .select({ quanti: sql<number>`count(*)::int` })
    .from(reviews)
    .where(eq(reviews.approved, false))

  const totali = richieste?.totali ?? 0
  const convertite = richieste?.convertite ?? 0

  return {
    venditeCents: vendite?.totale ?? 0,
    ordini: vendite?.quanti ?? 0,
    ordiniDaPreparare: daPreparare?.quanti ?? 0,
    richiesteNuove: richieste?.nuove ?? 0,
    richiesteTotali: totali,
    richiesteConvertite: convertite,
    // Il numero che dice se «Progetta il tuo angolo» sta funzionando davvero.
    tassoConversione: totali === 0 ? 0 : Math.round((convertite / totali) * 1000) / 10,
    scorteBasse: scorte,
    recensioniDaApprovare: recensioni?.quanti ?? 0,
  }
}

/* ------------------------------------------------------------------ *
 * Richieste di progetto
 * ------------------------------------------------------------------ */

export type RigaCodaProgetti = {
  id: string
  nome: string
  email: string
  citta: string | null
  tipoSpazio: string
  stato: StatoRichiesta
  creataIl: Date
  anteprima: string | null
  numeroFoto: number
  token: string
}

export async function codaProgetti(stato?: StatoRichiesta): Promise<RigaCodaProgetti[]> {
  const righe = await db.query.designRequests.findMany({
    where: stato ? eq(designRequests.status, stato) : undefined,
    with: { photos: { orderBy: [asc(designRequestPhotos.position)], limit: 1 } },
    orderBy: [desc(designRequests.createdAt)],
    limit: 100,
  })

  const conteggi = await db
    .select({
      requestId: designRequestPhotos.requestId,
      quante: sql<number>`count(*)::int`,
    })
    .from(designRequestPhotos)
    .groupBy(designRequestPhotos.requestId)

  const perRichiesta = new Map(conteggi.map((riga) => [riga.requestId, riga.quante]))

  return righe.map((riga) => ({
    id: riga.id,
    nome: riga.name,
    email: riga.email,
    citta: riga.city,
    tipoSpazio: riga.spaceType,
    stato: riga.status,
    creataIl: riga.createdAt,
    anteprima: riga.photos[0]?.url ?? null,
    numeroFoto: perRichiesta.get(riga.id) ?? 0,
    token: riga.publicToken,
  }))
}

export async function richiestaCompleta(id: string) {
  return db.query.designRequests.findFirst({
    where: eq(designRequests.id, id),
    with: {
      photos: { orderBy: [asc(designRequestPhotos.position)] },
      proposals: {
        orderBy: [desc(designProposals.createdAt)],
        with: {
          items: {
            orderBy: [asc(designProposalItems.position)],
            with: { variant: { with: { product: true } } },
          },
        },
      },
    },
  })
}

/** Ricerca varianti per l'editor della proposta: poche righe, nome leggibile. */
export async function cercaVariantiPerProposta(testo: string) {
  const modello = `%${testo.trim().toLowerCase()}%`
  return db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      nome: products.name,
      slug: products.slug,
      altezzaCm: productVariants.heightCm,
      finitura: productVariants.finish,
      prezzoCents: productVariants.priceCents,
      giacenza: productVariants.stock,
      suOrdinazione: products.isMadeToOrder,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        eq(products.status, 'active'),
        isNull(productVariants.archivedAt),
        sql`(lower(${products.name}) like ${modello} or lower(${productVariants.sku}) like ${modello})`,
      ),
    )
    .orderBy(asc(products.name), asc(productVariants.heightCm))
    .limit(25)
}

/* ------------------------------------------------------------------ *
 * Ordini
 * ------------------------------------------------------------------ */

export async function elencoOrdini(filtro?: { stato?: StatoOrdine; cerca?: string }) {
  const condizioni = []
  if (filtro?.stato) condizioni.push(eq(orders.status, filtro.stato))
  if (filtro?.cerca) {
    const modello = `%${filtro.cerca.trim().toLowerCase()}%`
    condizioni.push(
      sql`(lower(${orders.orderNumber}) like ${modello} or lower(${orders.email}) like ${modello})`,
    )
  }

  return db.query.orders.findMany({
    where: condizioni.length > 0 ? and(...condizioni) : undefined,
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
    limit: 100,
  })
}

export async function ordineCompleto(id: string) {
  return db.query.orders.findFirst({
    where: eq(orders.id, id),
    with: { items: { with: { variant: { with: { product: true } } } }, customer: true },
  })
}

/* ------------------------------------------------------------------ *
 * Catalogo
 * ------------------------------------------------------------------ */

export async function elencoProdottiAdmin() {
  const righe = await db
    .select({
      id: products.id,
      nome: products.name,
      slug: products.slug,
      stato: products.status,
      pezzoUnico: products.isUnique,
      suOrdinazione: products.isMadeToOrder,
      collezione: collections.name,
      varianti: sql<number>`count(${productVariants.id})::int`,
      giacenza: sql<number>`coalesce(sum(${productVariants.stock}), 0)::int`,
      prezzoMin: sql<number>`coalesce(min(${productVariants.priceCents}), ${products.basePriceCents})::int`,
      aggiornatoIl: products.updatedAt,
    })
    .from(products)
    .leftJoin(
      productVariants,
      and(eq(productVariants.productId, products.id), isNull(productVariants.archivedAt)),
    )
    .leftJoin(collections, eq(collections.id, products.collectionId))
    .groupBy(products.id, collections.name)
    .orderBy(desc(products.updatedAt))
    .limit(200)

  const copertine = await db
    .select({ productId: productImages.productId, url: productImages.url })
    .from(productImages)
    .orderBy(asc(productImages.position))

  const perProdotto = new Map<string, string>()
  for (const riga of copertine) {
    if (!perProdotto.has(riga.productId)) perProdotto.set(riga.productId, riga.url)
  }

  return righe.map((riga) => ({ ...riga, copertina: perProdotto.get(riga.id) ?? null }))
}

export async function prodottoAdmin(id: string) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      variants: { orderBy: [asc(productVariants.position)] },
      images: { orderBy: [asc(productImages.position)] },
      collection: true,
    },
  })
}

export async function elencoCollezioniAdmin() {
  return db
    .select({
      id: collections.id,
      nome: collections.name,
      slug: collections.slug,
      posizione: collections.position,
      archiviataIl: collections.archivedAt,
      prodotti: sql<number>`count(${products.id})::int`,
    })
    .from(collections)
    .leftJoin(products, eq(products.collectionId, collections.id))
    .groupBy(collections.id)
    .orderBy(asc(collections.position))
}

/* ------------------------------------------------------------------ *
 * Contenuti, sconti, spedizioni, recensioni
 * ------------------------------------------------------------------ */

export async function elencoContenuti() {
  return db
    .select()
    .from(contentBlocks)
    .orderBy(asc(contentBlocks.group), asc(contentBlocks.position))
}

export async function elencoSconti() {
  return db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt))
}

export async function elencoFasce() {
  return db
    .select()
    .from(shippingRates)
    .orderBy(asc(shippingRates.zone), asc(shippingRates.method), asc(shippingRates.minWeightKg))
}

export async function recensioniDaApprovare() {
  return db
    .select({
      id: reviews.id,
      nome: reviews.customerName,
      voto: reviews.rating,
      testo: reviews.body,
      fotoUrl: reviews.photoUrl,
      approvata: reviews.approved,
      creataIl: reviews.createdAt,
      prodotto: products.name,
      slug: products.slug,
    })
    .from(reviews)
    .innerJoin(products, eq(products.id, reviews.productId))
    .orderBy(asc(reviews.approved), desc(reviews.createdAt))
    .limit(100)
}

/* ------------------------------------------------------------------ *
 * Riepilogo settimanale via email
 * ------------------------------------------------------------------ */

export type RiepilogoSettimana = {
  venditeCents: number
  ordini: number
  richieste: number
  proposteInviate: number
  scorteBasse: number
  ordiniDaPreparare: number
  pezziPiuVenduti: { nome: string; quanti: number }[]
}

export async function riepilogoSettimana(): Promise<RiepilogoSettimana> {
  const da = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const statiIncassati: StatoOrdine[] = ['paid', 'processing', 'shipped', 'delivered']

  const [vendite] = await db
    .select({
      totale: sql<number>`coalesce(sum(${orders.totalCents}), 0)::int`,
      quanti: sql<number>`count(*)::int`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, da), inArray(orders.status, statiIncassati)))

  const [richieste] = await db
    .select({ quanti: sql<number>`count(*)::int` })
    .from(designRequests)
    .where(gte(designRequests.createdAt, da))

  const [proposte] = await db
    .select({ quanti: sql<number>`count(*)::int` })
    .from(designProposals)
    .where(gte(designProposals.publishedAt, da))

  const [daPreparare] = await db
    .select({ quanti: sql<number>`count(*)::int` })
    .from(orders)
    .where(inArray(orders.status, ['paid', 'processing']))

  const [scorte] = await db
    .select({ quanti: sql<number>`count(*)::int` })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(
        eq(products.status, 'active'),
        eq(products.isMadeToOrder, false),
        sql`${productVariants.stock} <= ${SOGLIA_SCORTE}`,
      ),
    )

  const venduti = await db
    .select({
      nome: orderItems.productNameSnapshot,
      quanti: sql<number>`sum(${orderItems.quantity})::int`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orders.id, orderItems.orderId))
    .where(and(gte(orders.createdAt, da), inArray(orders.status, statiIncassati)))
    .groupBy(orderItems.productNameSnapshot)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))
    .limit(5)

  return {
    venditeCents: vendite?.totale ?? 0,
    ordini: vendite?.quanti ?? 0,
    richieste: richieste?.quanti ?? 0,
    proposteInviate: proposte?.quanti ?? 0,
    scorteBasse: scorte?.quanti ?? 0,
    ordiniDaPreparare: daPreparare?.quanti ?? 0,
    pezziPiuVenduti: venduti,
  }
}

/** Esportazione CSV degli ordini: il commercialista vuole un foglio, non un'API. */
export async function ordiniPerCsv(da?: Date, a?: Date) {
  const condizioni = []
  if (da) condizioni.push(gte(orders.createdAt, da))
  if (a) condizioni.push(sql`${orders.createdAt} <= ${a}`)

  return db
    .select()
    .from(orders)
    .where(condizioni.length > 0 ? and(...condizioni) : undefined)
    .orderBy(asc(orders.createdAt))
}

export async function contaOrdiniPerStato() {
  return db.select({ stato: orders.status, quanti: count() }).from(orders).groupBy(orders.status)
}

export { numero }
