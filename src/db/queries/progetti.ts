import 'server-only'
import { and, asc, desc, eq, isNull, lt, sql } from 'drizzle-orm'
import { db } from '@/db'
import {
  designProposalItems,
  designProposals,
  designRequestPhotos,
  designRequests,
  productImages,
  productVariants,
  products,
  type DesignRequest,
  type Esposizione,
  type Stile,
  type StatoRichiesta,
  type TipoSpazio,
} from '@/db/schema'
import { numero } from '@/db/queries/mappatori'
import { ETICHETTE_FINITURA } from '@/lib/catalogo/etichette'
import { site } from '@/lib/site'

export type NuovaRichiesta = {
  nome: string
  email: string
  telefono: string | null
  citta: string | null
  cap: string | null
  tipoSpazio: TipoSpazio
  larghezzaM: number | null
  profonditaM: number | null
  esposizione: Esposizione | null
  stile: Stile | null
  fasciaBudget: string | null
  note: string | null
  consensoMarketing: boolean
  foto: { url: string; chiave: string | null }[]
}

export async function creaRichiesta(input: NuovaRichiesta): Promise<DesignRequest> {
  return db.transaction(async (tx) => {
    const [richiesta] = await tx
      .insert(designRequests)
      .values({
        name: input.nome,
        email: input.email,
        phone: input.telefono,
        city: input.citta,
        postalCode: input.cap,
        spaceType: input.tipoSpazio,
        widthM: input.larghezzaM === null ? null : String(input.larghezzaM),
        depthM: input.profonditaM === null ? null : String(input.profonditaM),
        exposure: input.esposizione,
        styleWanted: input.stile,
        budgetRange: input.fasciaBudget,
        freeNotes: input.note,
        marketingConsent: input.consensoMarketing,
        status: 'new',
      })
      .returning()

    if (!richiesta) throw new Error('Non sono riuscito a registrare la richiesta.')

    if (input.foto.length > 0) {
      await tx.insert(designRequestPhotos).values(
        input.foto.map((foto, posizione) => ({
          requestId: richiesta.id,
          url: foto.url,
          storageKey: foto.chiave,
          position: posizione,
        })),
      )
    }

    return richiesta
  })
}

export type VocePropostaPubblica = {
  id: string
  variantId: string
  slug: string
  nomeProdotto: string
  finitura: string
  altezzaCm: number
  diametroCm: number
  pesoKg: number
  prezzoCents: number
  quantita: number
  nota: string | null
  immagineUrl: string | null
  immagineAlt: string
  acquistabile: boolean
}

export type PropostaPubblica = {
  richiestaId: string
  token: string
  nomeCliente: string
  stato: StatoRichiesta
  tipoSpazio: TipoSpazio
  fotoCliente: { url: string; alt: string }[]
  renderUrl: string | null
  messaggio: string
  voci: VocePropostaPubblica[]
  stimaCents: number
  pubblicataIl: Date | null
  scadeIl: Date | null
  scaduta: boolean
}

/** La pagina privata della proposta: si arriva solo con il token. */
export async function propostaPerToken(token: string): Promise<PropostaPubblica | null> {
  const richiesta = await db.query.designRequests.findFirst({
    where: eq(designRequests.publicToken, token),
    with: {
      photos: { orderBy: [asc(designRequestPhotos.position)] },
      proposals: {
        orderBy: [desc(designProposals.createdAt)],
        limit: 1,
        with: {
          items: {
            orderBy: [asc(designProposalItems.position)],
            with: { variant: { with: { product: true } } },
          },
        },
      },
    },
  })

  if (!richiesta) return null

  const proposta = richiesta.proposals[0]
  if (!proposta || !proposta.publishedAt) return null

  const idProdotti = proposta.items.map((voce) => voce.variant.productId)
  const immagini = new Map<string, { url: string; alt: string }>()

  if (idProdotti.length > 0) {
    const righe = await db
      .select({
        productId: productImages.productId,
        url: productImages.url,
        alt: productImages.alt,
      })
      .from(productImages)
      .where(
        and(
          sql`${productImages.productId} in ${idProdotti}`,
          sql`${productImages.type} <> 'video'`,
        ),
      )
      .orderBy(asc(productImages.position))

    for (const riga of righe) {
      if (!immagini.has(riga.productId)) {
        immagini.set(riga.productId, { url: riga.url, alt: riga.alt })
      }
    }
  }

  const voci: VocePropostaPubblica[] = proposta.items.map((voce) => {
    const immagine = immagini.get(voce.variant.productId)
    return {
      id: voce.id,
      variantId: voce.variantId,
      slug: voce.variant.product.slug,
      nomeProdotto: voce.variant.product.name,
      finitura: ETICHETTE_FINITURA[voce.variant.finish],
      altezzaCm: numero(voce.variant.heightCm),
      diametroCm: numero(voce.variant.diameterCm),
      pesoKg: numero(voce.variant.weightKg),
      prezzoCents: voce.variant.priceCents || voce.variant.product.basePriceCents,
      quantita: voce.quantity,
      nota: voce.note,
      immagineUrl: immagine?.url ?? null,
      immagineAlt: immagine?.alt ?? voce.variant.product.name,
      acquistabile:
        voce.variant.product.status === 'active' &&
        (voce.variant.stock > 0 || voce.variant.product.isMadeToOrder),
    }
  })

  const scadeIl = richiesta.expiresAt
  const scaduta = scadeIl !== null && scadeIl.getTime() < Date.now()

  return {
    richiestaId: richiesta.id,
    token: richiesta.publicToken,
    nomeCliente: richiesta.name,
    stato: richiesta.status,
    tipoSpazio: richiesta.spaceType,
    fotoCliente: richiesta.photos.map((foto, indice) => ({
      url: foto.url,
      alt: `Foto ${indice + 1} dello spazio di ${richiesta.name}`,
    })),
    renderUrl: proposta.renderImageUrl,
    messaggio: proposta.artisanMessage,
    voci,
    stimaCents: proposta.totalEstimateCents,
    pubblicataIl: proposta.publishedAt,
    scadeIl,
    scaduta,
  }
}

export async function richiestaPerToken(token: string) {
  return db.query.designRequests.findFirst({
    where: eq(designRequests.publicToken, token),
  })
}

/** Proposte che scadono fra una settimana e non hanno ancora avuto il promemoria. */
export async function proposteInScadenza(giorniPrima = 7) {
  const fra = new Date(Date.now() + giorniPrima * 24 * 60 * 60 * 1000)
  return db
    .select()
    .from(designRequests)
    .where(
      and(
        eq(designRequests.status, 'sent'),
        isNull(designRequests.reminderSentAt),
        sql`${designRequests.expiresAt} is not null`,
        lt(designRequests.expiresAt, fra),
      ),
    )
    .limit(50)
}

export async function segnaPromemoriaScadenza(richiestaId: string): Promise<void> {
  await db
    .update(designRequests)
    .set({ reminderSentAt: new Date() })
    .where(eq(designRequests.id, richiestaId))
}

export async function scadiRichiesteVecchie(): Promise<number> {
  const righe = await db
    .update(designRequests)
    .set({ status: 'expired' })
    .where(
      and(
        eq(designRequests.status, 'sent'),
        sql`${designRequests.expiresAt} is not null and ${designRequests.expiresAt} < now()`,
      ),
    )
    .returning({ id: designRequests.id })
  return righe.length
}

/**
 * Foto di progetto più vecchie di dodici mesi: vanno cancellate davvero,
 * dall'archivio e dal database. È una promessa scritta nella privacy.
 */
export async function fotoDaCancellare(mesi = 12) {
  const soglia = new Date(Date.now() - mesi * 30 * 24 * 60 * 60 * 1000)
  return db
    .select({
      richiestaId: designRequests.id,
      fotoId: designRequestPhotos.id,
      chiave: designRequestPhotos.storageKey,
    })
    .from(designRequestPhotos)
    .innerJoin(designRequests, eq(designRequests.id, designRequestPhotos.requestId))
    .where(and(lt(designRequests.createdAt, soglia), isNull(designRequests.photosPurgedAt)))
    .limit(200)
}

export async function confermaCancellazioneFoto(richiestaIds: string[]): Promise<void> {
  if (richiestaIds.length === 0) return
  await db
    .delete(designRequestPhotos)
    .where(sql`${designRequestPhotos.requestId} in ${richiestaIds}`)
  await db
    .update(designRequests)
    .set({ photosPurgedAt: new Date() })
    .where(sql`${designRequests.id} in ${richiestaIds}`)
}

/** Le varianti della proposta, ricontrollate sul database prima di riempire il carrello. */
export async function variantiDellaProposta(token: string) {
  const righe = await db
    .select({
      variantId: designProposalItems.variantId,
      quantita: designProposalItems.quantity,
      giacenza: productVariants.stock,
      suOrdinazione: products.isMadeToOrder,
      stato: products.status,
    })
    .from(designRequests)
    .innerJoin(designProposals, eq(designProposals.requestId, designRequests.id))
    .innerJoin(designProposalItems, eq(designProposalItems.proposalId, designProposals.id))
    .innerJoin(productVariants, eq(productVariants.id, designProposalItems.variantId))
    .innerJoin(products, eq(products.id, productVariants.productId))
    .where(
      and(eq(designRequests.publicToken, token), sql`${designProposals.publishedAt} is not null`),
    )
    .orderBy(asc(designProposalItems.position))

  return righe
}

export function urlProposta(token: string): string {
  return `${site.url}/progetto/${token}`
}
