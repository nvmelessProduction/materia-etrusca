import 'server-only'
import { and, asc, desc, eq, gte, inArray, isNull, lte, ne, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import {
  collections,
  productImages,
  productVariants,
  products,
  reviews,
  type Finitura,
} from '@/db/schema'
import { aProdottoDominio, aVarianteDominio, numero } from '@/db/queries/mappatori'
import {
  PER_PAGINA_PREDEFINITO,
  type EsitoCatalogo,
  type EstremiCatalogo,
  type FiltriCatalogo,
  type ImmagineVetrina,
  type Ordinamento,
  type ProdottoVetrina,
} from '@/lib/catalogo/tipi'
import { disponibilitaVariante, type Disponibilita } from '@/lib/dominio/disponibilita'
import { fasciaPrezzo, prezzoVariante } from '@/lib/dominio/prezzi'

export {
  ORDINAMENTI,
  ETICHETTE_ORDINAMENTO,
  PER_PAGINA_PREDEFINITO,
  type EsitoCatalogo,
  type EstremiCatalogo,
  type FiltriCatalogo,
  type ImmagineVetrina,
  type Ordinamento,
  type ProdottoVetrina,
} from '@/lib/catalogo/tipi'
import type { ProdottoDominio, VarianteDominio } from '@/lib/dominio/tipi'

/** Condizioni che si applicano alle varianti: decidono quali versioni del pezzo mostrare. */
function condizioniVariante(filtri: FiltriCatalogo): SQL[] {
  const condizioni: SQL[] = [isNull(productVariants.archivedAt)]

  if (filtri.altezzaMinCm !== undefined) {
    condizioni.push(gte(productVariants.heightCm, String(filtri.altezzaMinCm)))
  }
  if (filtri.altezzaMaxCm !== undefined) {
    condizioni.push(lte(productVariants.heightCm, String(filtri.altezzaMaxCm)))
  }
  if (filtri.finiture && filtri.finiture.length > 0) {
    condizioni.push(inArray(productVariants.finish, filtri.finiture))
  }
  if (filtri.prezzoMinCents !== undefined) {
    condizioni.push(gte(productVariants.priceCents, filtri.prezzoMinCents))
  }
  if (filtri.prezzoMaxCents !== undefined) {
    condizioni.push(lte(productVariants.priceCents, filtri.prezzoMaxCents))
  }

  return condizioni
}

function condizioniProdotto(filtri: FiltriCatalogo, collezioneId?: string | null): SQL[] {
  const condizioni: SQL[] = [eq(products.status, 'active')]

  if (collezioneId) condizioni.push(eq(products.collectionId, collezioneId))
  if (filtri.ambiente === 'interno') condizioni.push(eq(products.suitableIndoor, true))
  if (filtri.ambiente === 'esterno') condizioni.push(eq(products.suitableOutdoor, true))

  return condizioni
}

function ordinamentoSql(ordinamento: Ordinamento): SQL[] {
  switch (ordinamento) {
    case 'prezzo-asc':
      return [asc(sql`min(${productVariants.priceCents})`), asc(products.name)]
    case 'prezzo-desc':
      return [desc(sql`max(${productVariants.priceCents})`), asc(products.name)]
    case 'altezza-asc':
      return [asc(sql`min(${productVariants.heightCm})`), asc(products.name)]
    case 'altezza-desc':
      return [desc(sql`max(${productVariants.heightCm})`), asc(products.name)]
    case 'novita':
    default:
      return [desc(products.createdAt), asc(products.name)]
  }
}

/**
 * Catalogo con filtri. I filtri sulle misure e sulla finitura agiscono sulle
 * varianti: un prodotto compare se ha almeno una versione che li rispetta, e
 * il prezzo mostrato è quello delle sole versioni compatibili — altrimenti si
 * annuncia un "da 180 €" che poi non si può comprare.
 */
export async function cercaProdotti(filtri: FiltriCatalogo = {}): Promise<EsitoCatalogo> {
  const pagina = Math.max(1, filtri.pagina ?? 1)
  const perPagina = Math.min(48, Math.max(1, filtri.perPagina ?? PER_PAGINA_PREDEFINITO))
  const ordinamento = filtri.ordinamento ?? 'novita'

  let collezioneId: string | null = null
  if (filtri.collezioneSlug) {
    const [collezione] = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.slug, filtri.collezioneSlug))
      .limit(1)
    if (!collezione) {
      return { prodotti: [], totale: 0, pagina, perPagina, haAltre: false }
    }
    collezioneId = collezione.id
  }

  const dovePro = and(...condizioniProdotto(filtri, collezioneId))
  const doveVar = and(eq(productVariants.productId, products.id), ...condizioniVariante(filtri))

  // "Disponibile" comprende anche i pezzi che colo su ordinazione: il cliente
  // può comprarli, deve solo sapere quanto aspetta.
  const avendo = filtri.soloDisponibili
    ? sql`bool_or(${productVariants.stock} > 0) or bool_or(${products.isMadeToOrder})`
    : undefined

  const base = db
    .select({
      id: products.id,
      slug: products.slug,
      nome: products.name,
      prezzoBaseCents: products.basePriceCents,
      pezzoUnico: products.isUnique,
      suOrdinazione: products.isMadeToOrder,
      giorniDiAttesa: products.leadTimeDays,
      interno: products.suitableIndoor,
      esterno: products.suitableOutdoor,
      creatoIl: products.createdAt,
      collezioneSlug: collections.slug,
      collezioneNome: collections.name,
      prezzoMinCents: sql<number>`min(${productVariants.priceCents})::int`,
      prezzoMaxCents: sql<number>`max(${productVariants.priceCents})::int`,
      altezzaMinCm: sql<string>`min(${productVariants.heightCm})`,
      altezzaMaxCm: sql<string>`max(${productVariants.heightCm})`,
      giacenzaTotale: sql<number>`coalesce(sum(${productVariants.stock}), 0)::int`,
    })
    .from(products)
    .innerJoin(productVariants, doveVar)
    .leftJoin(collections, eq(collections.id, products.collectionId))
    .where(dovePro)
    .groupBy(products.id, collections.slug, collections.name)

  const conAvendo = avendo ? base.having(avendo) : base

  const righe = await conAvendo
    .orderBy(...ordinamentoSql(ordinamento))
    .limit(perPagina + 1)
    .offset((pagina - 1) * perPagina)

  const haAltre = righe.length > perPagina
  const pagine = haAltre ? righe.slice(0, perPagina) : righe

  const immagini = await immaginiDiCopertina(pagine.map((riga) => riga.id))

  const prodotti: ProdottoVetrina[] = pagine.map((riga) => {
    const coppia = immagini.get(riga.id)
    return {
      id: riga.id,
      slug: riga.slug,
      nome: riga.nome,
      collezione:
        riga.collezioneSlug && riga.collezioneNome
          ? { slug: riga.collezioneSlug, nome: riga.collezioneNome }
          : null,
      prezzoMinCents: riga.prezzoMinCents || riga.prezzoBaseCents,
      prezzoMaxCents: riga.prezzoMaxCents || riga.prezzoBaseCents,
      altezzaMinCm: numero(riga.altezzaMinCm),
      altezzaMaxCm: numero(riga.altezzaMaxCm),
      pezzoUnico: riga.pezzoUnico,
      suOrdinazione: riga.suOrdinazione,
      giorniDiAttesa: riga.giorniDiAttesa,
      acquistabile: riga.giacenzaTotale > 0 || riga.suOrdinazione,
      interno: riga.interno,
      esterno: riga.esterno,
      immagine: coppia?.[0] ?? null,
      immagineSecondaria: coppia?.[1] ?? null,
      creatoIl: riga.creatoIl,
    }
  })

  const totale = await contaProdotti(filtri, collezioneId)

  return { prodotti, totale, pagina, perPagina, haAltre }
}

async function contaProdotti(filtri: FiltriCatalogo, collezioneId: string | null): Promise<number> {
  const doveVar = and(eq(productVariants.productId, products.id), ...condizioniVariante(filtri))
  const avendo = filtri.soloDisponibili
    ? sql`bool_or(${productVariants.stock} > 0) or bool_or(${products.isMadeToOrder})`
    : undefined

  const raggruppati = db
    .select({ id: products.id })
    .from(products)
    .innerJoin(productVariants, doveVar)
    .where(and(...condizioniProdotto(filtri, collezioneId)))
    .groupBy(products.id)

  const conAvendo = avendo ? raggruppati.having(avendo) : raggruppati
  const sotto = conAvendo.as('trovati')

  const [riga] = await db.select({ totale: sql<number>`count(*)::int` }).from(sotto)
  return riga?.totale ?? 0
}

/** Prima immagine (per la card) e seconda (per lo scambio al passaggio del mouse). */
async function immaginiDiCopertina(
  idProdotti: string[],
): Promise<Map<string, [ImmagineVetrina, ImmagineVetrina | null]>> {
  const mappa = new Map<string, [ImmagineVetrina, ImmagineVetrina | null]>()
  if (idProdotti.length === 0) return mappa

  const righe = await db
    .select({
      productId: productImages.productId,
      url: productImages.url,
      alt: productImages.alt,
      position: productImages.position,
    })
    .from(productImages)
    .where(and(inArray(productImages.productId, idProdotti), ne(productImages.type, 'video')))
    .orderBy(asc(productImages.productId), asc(productImages.position))

  for (const riga of righe) {
    const esistente = mappa.get(riga.productId)
    const immagine: ImmagineVetrina = { url: riga.url, alt: riga.alt }
    if (!esistente) {
      mappa.set(riga.productId, [immagine, null])
    } else if (esistente[1] === null) {
      esistente[1] = immagine
    }
  }

  return mappa
}

/* ------------------------------------------------------------------ *
 * Scheda prodotto
 * ------------------------------------------------------------------ */

export type VarianteVetrina = VarianteDominio & {
  prezzoCentsEffettivo: number
  disponibilita: Disponibilita
}

export type ProdottoCompleto = {
  id: string
  slug: string
  nome: string
  descrizione: string
  storia: string | null
  cura: string | null
  pezzoUnico: boolean
  suOrdinazione: boolean
  giorniDiAttesa: number
  interno: boolean
  esterno: boolean
  resistenteGelo: boolean
  seoTitle: string | null
  seoDescription: string | null
  creatoIl: Date
  collezione: { slug: string; nome: string } | null
  varianti: VarianteVetrina[]
  immagini: { id: string; url: string; alt: string; tipo: string; variantId: string | null }[]
  prezzoMinCents: number
  prezzoMaxCents: number
  dominio: ProdottoDominio
}

export async function prodottoPerSlug(slug: string): Promise<ProdottoCompleto | null> {
  const riga = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), ne(products.status, 'archived')),
    with: {
      collection: true,
      variants: {
        where: isNull(productVariants.archivedAt),
        orderBy: [asc(productVariants.position), asc(productVariants.heightCm)],
      },
      images: { orderBy: [asc(productImages.position)] },
    },
  })

  if (!riga) return null

  const dominio = aProdottoDominio(riga)
  const varianti: VarianteVetrina[] = riga.variants.map((variante) => {
    const base = aVarianteDominio(variante)
    return {
      ...base,
      prezzoCentsEffettivo: prezzoVariante(base, dominio),
      disponibilita: disponibilitaVariante(base, dominio),
    }
  })

  const fascia = fasciaPrezzo(
    varianti.map(({ disponibilita: _d, prezzoCentsEffettivo: _p, ...resto }) => resto),
    dominio,
  )

  return {
    id: riga.id,
    slug: riga.slug,
    nome: riga.name,
    descrizione: riga.description,
    storia: riga.story,
    cura: riga.careInstructions,
    pezzoUnico: riga.isUnique,
    suOrdinazione: riga.isMadeToOrder,
    giorniDiAttesa: riga.leadTimeDays,
    interno: riga.suitableIndoor,
    esterno: riga.suitableOutdoor,
    resistenteGelo: riga.frostResistant,
    seoTitle: riga.seoTitle,
    seoDescription: riga.seoDescription,
    creatoIl: riga.createdAt,
    collezione: riga.collection ? { slug: riga.collection.slug, nome: riga.collection.name } : null,
    varianti,
    immagini: riga.images.map((immagine) => ({
      id: immagine.id,
      url: immagine.url,
      alt: immagine.alt,
      tipo: immagine.type,
      variantId: immagine.variantId,
    })),
    prezzoMinCents: fascia.minCents,
    prezzoMaxCents: fascia.maxCents,
    dominio,
  }
}

export async function slugProdottiAttivi(): Promise<{ slug: string; aggiornatoIl: Date }[]> {
  const righe = await db
    .select({ slug: products.slug, aggiornatoIl: products.updatedAt })
    .from(products)
    .where(eq(products.status, 'active'))
  return righe
}

/** Pezzi della stessa collezione, o in alternativa novità: mai una griglia vuota. */
export async function prodottiCorrelati(
  prodottoId: string,
  collezioneSlug: string | null,
  quanti = 4,
): Promise<ProdottoVetrina[]> {
  if (collezioneSlug) {
    const esito = await cercaProdotti({ collezioneSlug, perPagina: quanti + 1 })
    const filtrati = esito.prodotti.filter((prodotto) => prodotto.id !== prodottoId)
    if (filtrati.length >= quanti) return filtrati.slice(0, quanti)
  }

  const recenti = await cercaProdotti({ ordinamento: 'novita', perPagina: quanti + 1 })
  return recenti.prodotti.filter((prodotto) => prodotto.id !== prodottoId).slice(0, quanti)
}

export async function prodottiInEvidenza(quanti = 4): Promise<ProdottoVetrina[]> {
  const esito = await cercaProdotti({ ordinamento: 'novita', perPagina: quanti })
  return esito.prodotti
}

/* ------------------------------------------------------------------ *
 * Estremi dei filtri: la fascia va calcolata sul catalogo vero
 * ------------------------------------------------------------------ */

export async function estremiCatalogo(collezioneSlug?: string): Promise<EstremiCatalogo> {
  const condizioni: SQL[] = [eq(products.status, 'active'), isNull(productVariants.archivedAt)]
  if (collezioneSlug) condizioni.push(eq(collections.slug, collezioneSlug))

  const [riga] = await db
    .select({
      altezzaMin: sql<string>`coalesce(min(${productVariants.heightCm}), 0)`,
      altezzaMax: sql<string>`coalesce(max(${productVariants.heightCm}), 0)`,
      prezzoMin: sql<number>`coalesce(min(${productVariants.priceCents}), 0)::int`,
      prezzoMax: sql<number>`coalesce(max(${productVariants.priceCents}), 0)::int`,
      finiture: sql<Finitura[]>`coalesce(array_agg(distinct ${productVariants.finish}), '{}')`,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(collections, eq(collections.id, products.collectionId))
    .where(and(...condizioni))

  return {
    altezzaMinCm: Math.floor(numero(riga?.altezzaMin)),
    altezzaMaxCm: Math.ceil(numero(riga?.altezzaMax)),
    prezzoMinCents: riga?.prezzoMin ?? 0,
    prezzoMaxCents: riga?.prezzoMax ?? 0,
    finiture: riga?.finiture ?? [],
  }
}

/* ------------------------------------------------------------------ *
 * Recensioni
 * ------------------------------------------------------------------ */

export type RecensionePubblica = {
  id: string
  nome: string
  voto: number
  testo: string | null
  fotoUrl: string | null
  creataIl: Date
}

export async function recensioniProdotto(prodottoId: string): Promise<RecensionePubblica[]> {
  const righe = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.productId, prodottoId), eq(reviews.approved, true)))
    .orderBy(desc(reviews.createdAt))
    .limit(20)

  return righe.map((riga) => ({
    id: riga.id,
    nome: riga.customerName,
    voto: riga.rating,
    testo: riga.body,
    fotoUrl: riga.photoUrl,
    creataIl: riga.createdAt,
  }))
}

export type AggregatoRecensioni = { media: number; numero: number }

export async function aggregatoRecensioni(prodottoId: string): Promise<AggregatoRecensioni | null> {
  const [riga] = await db
    .select({
      media: sql<string>`avg(${reviews.rating})`,
      numero: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(and(eq(reviews.productId, prodottoId), eq(reviews.approved, true)))

  if (!riga || riga.numero === 0) return null
  return { media: Math.round(numero(riga.media) * 10) / 10, numero: riga.numero }
}

/** Usata dal carrello e dal checkout: la variante da sola non basta mai. */
export async function varianteConProdotto(variantId: string) {
  const riga = await db.query.productVariants.findFirst({
    where: eq(productVariants.id, variantId),
    with: { product: true },
  })
  if (!riga || riga.product.status === 'archived') return null
  return riga
}

export async function variantiConProdotto(variantIds: string[]) {
  if (variantIds.length === 0) return []
  return db.query.productVariants.findMany({
    where: inArray(productVariants.id, variantIds),
    with: { product: true },
  })
}

/** Solo le immagini che servono al carrello: una per variante, con ripiego sul prodotto. */
export async function immaginiPerVarianti(
  variantIds: string[],
  productIds: string[],
): Promise<Map<string, ImmagineVetrina>> {
  const mappa = new Map<string, ImmagineVetrina>()
  if (productIds.length === 0) return mappa

  const righe = await db
    .select({
      productId: productImages.productId,
      variantId: productImages.variantId,
      url: productImages.url,
      alt: productImages.alt,
    })
    .from(productImages)
    .where(
      and(
        or(
          inArray(productImages.productId, productIds),
          variantIds.length > 0 ? inArray(productImages.variantId, variantIds) : undefined,
        ),
        ne(productImages.type, 'video'),
      ),
    )
    .orderBy(asc(productImages.position))

  for (const riga of righe) {
    const chiaveVariante = riga.variantId
    if (chiaveVariante && !mappa.has(chiaveVariante)) {
      mappa.set(chiaveVariante, { url: riga.url, alt: riga.alt })
    }
    if (!mappa.has(riga.productId)) {
      mappa.set(riga.productId, { url: riga.url, alt: riga.alt })
    }
  }

  return mappa
}
