'use server'

import { revalidatePath } from 'next/cache'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import {
  collections,
  contentBlocks,
  orders,
  designProposalItems,
  designProposals,
  designRequests,
  discountCodes,
  productImages,
  productVariants,
  products,
  reviews,
  shippingRates,
} from '@/db/schema'
import { richiediAmministratore } from '@/lib/auth'
import { cercaVariantiPerProposta } from '@/db/queries/admin'
import { aggiornaStatoOrdine, segnaOrdinePagato } from '@/db/queries/ordini'
import { inviaEmailOrdine, inviaEmailSpedizione } from '@/lib/ordini/notifiche'
import { inviaEmail } from '@/lib/email/invia'
import PropostaPronta from '@/emails/proposta-pronta'
import { urlProposta } from '@/db/queries/progetti'
import { slugify } from '@/lib/utils'
import { site } from '@/lib/site'

export type EsitoAzione = { ok: boolean; messaggio?: string }

/** Ogni azione passa di qui: il pannello non è mai raggiungibile per sbaglio. */
async function autorizza(): Promise<void> {
  await richiediAmministratore()
}

function riuscita(messaggio?: string): EsitoAzione {
  return { ok: true, messaggio }
}

function fallita(messaggio: string): EsitoAzione {
  return { ok: false, messaggio }
}

/* ------------------------------------------------------------------ *
 * Ordini
 * ------------------------------------------------------------------ */

const STATI_ORDINE = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const

export async function cambiaStatoOrdine(
  ordineId: string,
  stato: (typeof STATI_ORDINE)[number],
): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({ ordineId: z.uuid(), stato: z.enum(STATI_ORDINE) })
    .safeParse({ ordineId, stato })
  if (!lettura.success) return fallita('Stato non valido.')

  await aggiornaStatoOrdine(lettura.data.ordineId, lettura.data.stato)
  revalidatePath(`/admin/ordini/${ordineId}`)
  revalidatePath('/admin/ordini')
  return riuscita('Stato aggiornato.')
}

/**
 * Incasso del bonifico: è qui che si scalano le giacenze, non prima.
 * Passa dalla stessa transazione del webhook, quindi anche un pezzo unico
 * pagato in contemporanea con carta resta impossibile da vendere due volte.
 */
export async function segnaBonificoIncassato(ordineId: string): Promise<EsitoAzione> {
  await autorizza()
  const esito = await segnaOrdinePagato({ ordineId })

  if (!esito.ok) {
    return fallita(
      esito.motivo === 'scorta-insufficiente'
        ? `Non posso: ${esito.pezziMancanti.join(', ')} non ${esito.pezziMancanti.length === 1 ? 'è' : 'sono'} più disponibile. Rimborsa il bonifico o rifai il pezzo.`
        : 'Ordine non trovato.',
    )
  }

  if (!esito.giaLavorato) await inviaEmailOrdine(esito.ordine)
  revalidatePath(`/admin/ordini/${ordineId}`)
  return riuscita('Segnato come pagato, giacenze aggiornate.')
}

export async function salvaTracking(
  ordineId: string,
  corriere: string,
  codice: string,
): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({
      ordineId: z.uuid(),
      corriere: z.string().trim().min(2).max(80),
      codice: z.string().trim().min(3).max(120),
    })
    .safeParse({ ordineId, corriere, codice })

  if (!lettura.success) return fallita('Corriere e codice sono obbligatori.')

  await aggiornaStatoOrdine(lettura.data.ordineId, 'shipped', {
    trackingCarrier: lettura.data.corriere,
    trackingNumber: lettura.data.codice,
  })
  await inviaEmailSpedizione(lettura.data.ordineId)

  revalidatePath(`/admin/ordini/${ordineId}`)
  revalidatePath('/admin/ordini')
  return riuscita('Spedito. Ho mandato il tracking al cliente.')
}

export async function salvaNotaOrdine(ordineId: string, nota: string): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({ ordineId: z.uuid(), nota: z.string().max(2000) })
    .safeParse({ ordineId, nota })
  if (!lettura.success) return fallita('Nota troppo lunga.')

  // Nota interna: la vede solo chi entra nel pannello, mai il cliente.
  await db
    .update(orders)
    .set({ notes: lettura.data.nota, updatedAt: new Date() })
    .where(eq(orders.id, lettura.data.ordineId))

  revalidatePath(`/admin/ordini/${ordineId}`)
  return riuscita('Nota salvata.')
}

/* ------------------------------------------------------------------ *
 * Richieste di progetto e proposte
 * ------------------------------------------------------------------ */

const STATI_RICHIESTA = ['new', 'in_progress', 'sent', 'converted', 'expired'] as const

export async function cambiaStatoRichiesta(
  richiestaId: string,
  stato: (typeof STATI_RICHIESTA)[number],
): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({ richiestaId: z.uuid(), stato: z.enum(STATI_RICHIESTA) })
    .safeParse({ richiestaId, stato })
  if (!lettura.success) return fallita('Stato non valido.')

  await db
    .update(designRequests)
    .set({ status: lettura.data.stato })
    .where(eq(designRequests.id, lettura.data.richiestaId))

  revalidatePath(`/admin/progetti/${richiestaId}`)
  revalidatePath('/admin/progetti')
  return riuscita('Stato aggiornato.')
}

export async function salvaNotaRichiesta(richiestaId: string, nota: string): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({ richiestaId: z.uuid(), nota: z.string().max(2000) })
    .safeParse({ richiestaId, nota })
  if (!lettura.success) return fallita('Nota troppo lunga.')

  await db
    .update(designRequests)
    .set({ internalNotes: lettura.data.nota })
    .where(eq(designRequests.id, lettura.data.richiestaId))

  revalidatePath(`/admin/progetti/${richiestaId}`)
  return riuscita('Nota salvata.')
}

const schemaProposta = z.object({
  richiestaId: z.uuid(),
  renderUrl: z.string().trim().max(2000).optional().or(z.literal('')),
  messaggio: z.string().trim().max(6000),
  voci: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantita: z.number().int().min(1).max(20),
        nota: z.string().trim().max(600).optional().or(z.literal('')),
      }),
    )
    .max(12),
})

export type DatiProposta = z.infer<typeof schemaProposta>

/** Salva la bozza della proposta senza mandarla: si può riprendere domani. */
export async function salvaProposta(dati: DatiProposta): Promise<EsitoAzione> {
  await autorizza()
  const lettura = schemaProposta.safeParse(dati)
  if (!lettura.success) return fallita('Controlla i dati della proposta.')

  await scriviProposta(lettura.data, false)
  revalidatePath(`/admin/progetti/${dati.richiestaId}`)
  return riuscita('Bozza salvata.')
}

/** Pubblica la proposta, apre la pagina privata e avvisa il cliente. */
export async function inviaProposta(dati: DatiProposta): Promise<EsitoAzione> {
  await autorizza()
  const lettura = schemaProposta.safeParse(dati)
  if (!lettura.success) return fallita('Controlla i dati della proposta.')
  if (lettura.data.voci.length === 0) return fallita('Aggiungi almeno un pezzo.')
  if (lettura.data.messaggio.trim().length < 20) {
    return fallita('Scrivi due righe al cliente: è la parte che conta di più.')
  }

  const { richiesta, stimaCents } = await scriviProposta(lettura.data, true)

  await inviaEmail({
    a: richiesta.email,
    oggetto: 'Ho guardato le tue foto: ecco cosa ci metterei',
    contenuto: PropostaPronta({
      nomeCliente: richiesta.name.split(' ')[0] ?? richiesta.name,
      numeroPezzi: lettura.data.voci.length,
      stimaCents,
      urlProposta: urlProposta(richiesta.publicToken),
      urlSito: site.url,
      giorniValidita: site.proposalValidityDays,
    }),
  })

  revalidatePath(`/admin/progetti/${dati.richiestaId}`)
  revalidatePath('/admin/progetti')
  return riuscita('Proposta inviata. Il cliente ha ricevuto il link.')
}

async function scriviProposta(dati: DatiProposta, pubblica: boolean) {
  return db.transaction(async (tx) => {
    const [richiesta] = await tx
      .select()
      .from(designRequests)
      .where(eq(designRequests.id, dati.richiestaId))
      .limit(1)

    if (!richiesta) throw new Error('Richiesta non trovata.')

    const prezzi = await tx
      .select({
        id: productVariants.id,
        prezzoCents: productVariants.priceCents,
        prezzoBaseCents: products.basePriceCents,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(sql`${productVariants.id} in ${dati.voci.map((voce) => voce.variantId)}`)

    const perId = new Map(prezzi.map((riga) => [riga.id, riga.prezzoCents || riga.prezzoBaseCents]))
    const stimaCents = dati.voci.reduce(
      (somma, voce) => somma + (perId.get(voce.variantId) ?? 0) * voce.quantita,
      0,
    )

    const [esistente] = await tx
      .select({ id: designProposals.id })
      .from(designProposals)
      .where(eq(designProposals.requestId, richiesta.id))
      .limit(1)

    const adesso = new Date()
    const valori = {
      requestId: richiesta.id,
      renderImageUrl: dati.renderUrl || null,
      artisanMessage: dati.messaggio,
      totalEstimateCents: stimaCents,
      updatedAt: adesso,
      ...(pubblica ? { publishedAt: adesso } : {}),
    }

    const propostaId = esistente
      ? ((
          await tx
            .update(designProposals)
            .set(valori)
            .where(eq(designProposals.id, esistente.id))
            .returning({ id: designProposals.id })
        )[0]?.id ?? esistente.id)
      : ((await tx.insert(designProposals).values(valori).returning({ id: designProposals.id }))[0]
          ?.id ?? '')

    await tx.delete(designProposalItems).where(eq(designProposalItems.proposalId, propostaId))

    if (dati.voci.length > 0) {
      await tx.insert(designProposalItems).values(
        dati.voci.map((voce, posizione) => ({
          proposalId: propostaId,
          variantId: voce.variantId,
          quantity: voce.quantita,
          note: voce.nota || null,
          position: posizione,
        })),
      )
    }

    if (pubblica) {
      const scadenza = new Date(adesso.getTime() + site.proposalValidityDays * 24 * 60 * 60 * 1000)
      await tx
        .update(designRequests)
        .set({
          status: 'sent',
          sentAt: adesso,
          expiresAt: scadenza,
          // Ripubblicando, il promemoria di scadenza riparte da capo.
          reminderSentAt: null,
        })
        .where(eq(designRequests.id, richiesta.id))
    } else if (richiesta.status === 'new') {
      await tx
        .update(designRequests)
        .set({ status: 'in_progress' })
        .where(eq(designRequests.id, richiesta.id))
    }

    return { richiesta, stimaCents }
  })
}

export type VariantePerProposta = {
  variantId: string
  sku: string
  nome: string
  slug: string
  altezzaCm: number
  finitura: string
  prezzoCents: number
  giacenza: number
  suOrdinazione: boolean
}

/** Ricerca dei pezzi da mettere nella proposta, dall'editor. */
export async function cercaPezzi(testo: string): Promise<VariantePerProposta[]> {
  await autorizza()
  if (testo.trim().length < 2) return []

  const righe = await cercaVariantiPerProposta(testo)
  return righe.map((riga) => ({
    variantId: riga.variantId,
    sku: riga.sku,
    nome: riga.nome,
    slug: riga.slug,
    altezzaCm: Number.parseFloat(riga.altezzaCm),
    finitura: riga.finitura,
    prezzoCents: riga.prezzoCents,
    giacenza: riga.giacenza,
    suOrdinazione: riga.suOrdinazione,
  }))
}

/* ------------------------------------------------------------------ *
 * Prodotti
 * ------------------------------------------------------------------ */

const schemaProdotto = z.object({
  id: z.uuid().optional(),
  nome: z.string().trim().min(2).max(200),
  slug: z.string().trim().max(160).optional().or(z.literal('')),
  collezioneId: z.uuid().nullable().optional(),
  descrizione: z.string().max(8000).default(''),
  storia: z.string().max(2000).optional().or(z.literal('')),
  prezzoBaseCents: z.number().int().min(0),
  pezzoUnico: z.boolean().default(false),
  suOrdinazione: z.boolean().default(false),
  giorniDiAttesa: z.number().int().min(0).max(365).default(0),
  interno: z.boolean().default(true),
  esterno: z.boolean().default(true),
  resistenteGelo: z.boolean().default(false),
  cura: z.string().max(4000).optional().or(z.literal('')),
  stato: z.enum(['draft', 'active', 'archived']).default('draft'),
  seoTitle: z.string().max(180).optional().or(z.literal('')),
  seoDescription: z.string().max(320).optional().or(z.literal('')),
})

export type DatiProdotto = z.input<typeof schemaProdotto>

export async function salvaProdotto(dati: DatiProdotto): Promise<EsitoAzione & { id?: string }> {
  await autorizza()
  const lettura = schemaProdotto.safeParse(dati)
  if (!lettura.success) return fallita('Controlla i campi del prodotto.')
  const d = lettura.data

  const valori = {
    name: d.nome,
    slug: d.slug || slugify(d.nome),
    collectionId: d.collezioneId ?? null,
    description: d.descrizione,
    story: d.storia || null,
    basePriceCents: d.prezzoBaseCents,
    isUnique: d.pezzoUnico,
    isMadeToOrder: d.suOrdinazione,
    leadTimeDays: d.giorniDiAttesa,
    suitableIndoor: d.interno,
    suitableOutdoor: d.esterno,
    frostResistant: d.resistenteGelo,
    careInstructions: d.cura || null,
    status: d.stato,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
    updatedAt: new Date(),
  }

  try {
    const id = d.id
      ? ((
          await db
            .update(products)
            .set(valori)
            .where(eq(products.id, d.id))
            .returning({ id: products.id })
        )[0]?.id ?? d.id)
      : ((await db.insert(products).values(valori).returning({ id: products.id }))[0]?.id ?? '')

    revalidatePath('/admin/prodotti')
    revalidatePath(`/prodotti/${valori.slug}`)
    return { ok: true, id, messaggio: 'Prodotto salvato.' }
  } catch (errore) {
    // L'unico vincolo che può saltare qui è lo slug già preso.
    console.error('Salvataggio prodotto fallito:', errore)
    return fallita('Esiste già un prodotto con questo indirizzo. Cambia il nome o lo slug.')
  }
}

const schemaVariante = z.object({
  id: z.uuid().optional(),
  productId: z.uuid(),
  sku: z.string().trim().min(2).max(64),
  altezzaCm: z.number().min(1).max(400),
  diametroCm: z.number().min(1).max(400),
  pesoKg: z.number().min(0.1).max(999),
  finitura: z.enum(['grezzo', 'levigato', 'ocra', 'antracite']),
  prezzoCents: z.number().int().min(0),
  giacenza: z.number().int().min(0).max(999),
  pesoImballoKg: z.number().min(0.1).max(999),
  volumeImballoL: z.number().min(0).max(9999),
  posizione: z.number().int().min(0).max(99).default(0),
})

export type DatiVariante = z.input<typeof schemaVariante>

export async function salvaVariante(dati: DatiVariante): Promise<EsitoAzione> {
  await autorizza()
  const lettura = schemaVariante.safeParse(dati)
  if (!lettura.success) return fallita('Controlla i campi della variante.')
  const d = lettura.data

  const valori = {
    productId: d.productId,
    sku: d.sku,
    heightCm: String(d.altezzaCm),
    diameterCm: String(d.diametroCm),
    weightKg: String(d.pesoKg),
    finish: d.finitura,
    priceCents: d.prezzoCents,
    stock: d.giacenza,
    packageWeightKg: String(d.pesoImballoKg),
    packageVolumeL: String(d.volumeImballoL),
    position: d.posizione,
    updatedAt: new Date(),
  }

  try {
    if (d.id) {
      await db.update(productVariants).set(valori).where(eq(productVariants.id, d.id))
    } else {
      await db.insert(productVariants).values(valori)
    }
    revalidatePath(`/admin/prodotti/${d.productId}`)
    return riuscita('Variante salvata.')
  } catch (errore) {
    console.error('Salvataggio variante fallito:', errore)
    return fallita('Questo SKU è già usato da un’altra variante.')
  }
}

export async function aggiornaGiacenza(varianteId: string, giacenza: number): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({ varianteId: z.uuid(), giacenza: z.number().int().min(0).max(999) })
    .safeParse({ varianteId, giacenza })
  if (!lettura.success) return fallita('Quantità non valida.')

  await db
    .update(productVariants)
    .set({ stock: lettura.data.giacenza, updatedAt: new Date() })
    .where(eq(productVariants.id, lettura.data.varianteId))

  revalidatePath('/admin/prodotti')
  return riuscita('Giacenza aggiornata.')
}

/** Niente cancellazioni: si archivia e basta. Gli ordini vecchi devono restare leggibili. */
export async function archiviaVariante(varianteId: string): Promise<EsitoAzione> {
  await autorizza()
  if (!z.uuid().safeParse(varianteId).success) return fallita('Variante non valida.')

  await db
    .update(productVariants)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(productVariants.id, varianteId))

  revalidatePath('/admin/prodotti')
  return riuscita('Variante archiviata.')
}

export async function cambiaStatoProdotto(
  prodottoId: string,
  stato: 'draft' | 'active' | 'archived',
): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({ prodottoId: z.uuid(), stato: z.enum(['draft', 'active', 'archived']) })
    .safeParse({ prodottoId, stato })
  if (!lettura.success) return fallita('Stato non valido.')

  await db
    .update(products)
    .set({ status: lettura.data.stato, updatedAt: new Date() })
    .where(eq(products.id, lettura.data.prodottoId))

  revalidatePath('/admin/prodotti')
  return riuscita(stato === 'archived' ? 'Prodotto archiviato.' : 'Stato aggiornato.')
}

/** Duplicazione: il modo più veloce di inserire il decimo pezzo di una serie. */
export async function duplicaProdotto(prodottoId: string): Promise<EsitoAzione & { id?: string }> {
  await autorizza()
  if (!z.uuid().safeParse(prodottoId).success) return fallita('Prodotto non valido.')

  return db.transaction(async (tx) => {
    const originale = await tx.query.products.findFirst({
      where: eq(products.id, prodottoId),
      with: { variants: true, images: true },
    })
    if (!originale) return fallita('Prodotto non trovato.')

    const suffisso = Date.now().toString(36).slice(-4)
    const [copia] = await tx
      .insert(products)
      .values({
        name: `${originale.name} (copia)`,
        slug: `${originale.slug}-copia-${suffisso}`,
        collectionId: originale.collectionId,
        description: originale.description,
        story: originale.story,
        basePriceCents: originale.basePriceCents,
        isUnique: originale.isUnique,
        isMadeToOrder: originale.isMadeToOrder,
        leadTimeDays: originale.leadTimeDays,
        suitableIndoor: originale.suitableIndoor,
        suitableOutdoor: originale.suitableOutdoor,
        frostResistant: originale.frostResistant,
        careInstructions: originale.careInstructions,
        // La copia nasce in bozza: non deve comparire in vetrina per sbaglio.
        status: 'draft',
      })
      .returning({ id: products.id })

    if (!copia) return fallita('Non sono riuscito a duplicare.')

    if (originale.variants.length > 0) {
      await tx.insert(productVariants).values(
        originale.variants.map((variante) => ({
          productId: copia.id,
          sku: `${variante.sku}-${suffisso}`,
          heightCm: variante.heightCm,
          diameterCm: variante.diameterCm,
          weightKg: variante.weightKg,
          finish: variante.finish,
          priceCents: variante.priceCents,
          // Le giacenze non si copiano: quelle sono del pezzo originale.
          stock: 0,
          packageWeightKg: variante.packageWeightKg,
          packageVolumeL: variante.packageVolumeL,
          position: variante.position,
        })),
      )
    }

    if (originale.images.length > 0) {
      await tx.insert(productImages).values(
        originale.images.map((immagine) => ({
          productId: copia.id,
          url: immagine.url,
          alt: immagine.alt,
          position: immagine.position,
          type: immagine.type,
        })),
      )
    }

    revalidatePath('/admin/prodotti')
    return { ok: true, id: copia.id, messaggio: 'Duplicato. La copia è in bozza.' }
  })
}

export async function aggiungiImmagine(dati: {
  productId: string
  url: string
  alt: string
  tipo: 'studio' | 'ambientata' | 'dettaglio' | 'scala' | 'video'
}): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({
      productId: z.uuid(),
      url: z.url(),
      alt: z.string().trim().min(3).max(300),
      tipo: z.enum(['studio', 'ambientata', 'dettaglio', 'scala', 'video']),
    })
    .safeParse(dati)
  if (!lettura.success) return fallita('Serve un indirizzo valido e una descrizione della foto.')

  const [ultima] = await db
    .select({ posizione: sql<number>`coalesce(max(${productImages.position}), -1)::int` })
    .from(productImages)
    .where(eq(productImages.productId, lettura.data.productId))

  await db.insert(productImages).values({
    productId: lettura.data.productId,
    url: lettura.data.url,
    alt: lettura.data.alt,
    type: lettura.data.tipo,
    position: (ultima?.posizione ?? -1) + 1,
  })

  revalidatePath(`/admin/prodotti/${dati.productId}`)
  return riuscita('Foto aggiunta.')
}

export async function riordinaImmagini(productId: string, ordine: string[]): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({ productId: z.uuid(), ordine: z.array(z.uuid()).max(30) })
    .safeParse({ productId, ordine })
  if (!lettura.success) return fallita('Ordine non valido.')

  await db.transaction(async (tx) => {
    for (const [posizione, id] of lettura.data.ordine.entries()) {
      await tx
        .update(productImages)
        .set({ position: posizione })
        .where(and(eq(productImages.id, id), eq(productImages.productId, lettura.data.productId)))
    }
  })

  revalidatePath(`/admin/prodotti/${productId}`)
  return riuscita()
}

export async function eliminaImmagine(immagineId: string, productId: string): Promise<EsitoAzione> {
  await autorizza()
  if (!z.uuid().safeParse(immagineId).success) return fallita('Foto non valida.')

  await db.delete(productImages).where(eq(productImages.id, immagineId))
  revalidatePath(`/admin/prodotti/${productId}`)
  return riuscita('Foto tolta.')
}

/* ------------------------------------------------------------------ *
 * Collezioni
 * ------------------------------------------------------------------ */

const schemaCollezione = z.object({
  id: z.uuid().optional(),
  nome: z.string().trim().min(2).max(180),
  slug: z.string().trim().max(140).optional().or(z.literal('')),
  descrizione: z.string().max(2000).optional().or(z.literal('')),
  heroImageUrl: z.string().trim().max(2000).optional().or(z.literal('')),
  posizione: z.number().int().min(0).max(99).default(0),
  seoTitle: z.string().max(180).optional().or(z.literal('')),
  seoDescription: z.string().max(320).optional().or(z.literal('')),
})

export async function salvaCollezione(
  dati: z.input<typeof schemaCollezione>,
): Promise<EsitoAzione> {
  await autorizza()
  const lettura = schemaCollezione.safeParse(dati)
  if (!lettura.success) return fallita('Controlla i campi della collezione.')
  const d = lettura.data

  const valori = {
    name: d.nome,
    slug: d.slug || slugify(d.nome),
    description: d.descrizione || null,
    heroImageUrl: d.heroImageUrl || null,
    position: d.posizione,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
    updatedAt: new Date(),
  }

  try {
    if (d.id) await db.update(collections).set(valori).where(eq(collections.id, d.id))
    else await db.insert(collections).values(valori)

    revalidatePath('/admin/collezioni')
    revalidatePath('/collezioni')
    return riuscita('Collezione salvata.')
  } catch {
    return fallita('Esiste già una collezione con questo indirizzo.')
  }
}

export async function riordinaCollezioni(ordine: string[]): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z.array(z.uuid()).max(50).safeParse(ordine)
  if (!lettura.success) return fallita('Ordine non valido.')

  await db.transaction(async (tx) => {
    for (const [posizione, id] of lettura.data.entries()) {
      await tx.update(collections).set({ position: posizione }).where(eq(collections.id, id))
    }
  })

  revalidatePath('/admin/collezioni')
  revalidatePath('/collezioni')
  return riuscita('Ordine salvato.')
}

export async function archiviaCollezione(collezioneId: string): Promise<EsitoAzione> {
  await autorizza()
  if (!z.uuid().safeParse(collezioneId).success) return fallita('Collezione non valida.')

  await db
    .update(collections)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(eq(collections.id, collezioneId))

  revalidatePath('/admin/collezioni')
  revalidatePath('/collezioni')
  return riuscita('Collezione archiviata. I prodotti restano dove sono.')
}

/* ------------------------------------------------------------------ *
 * Contenuti, sconti, spedizioni, recensioni
 * ------------------------------------------------------------------ */

export async function salvaContenuto(dati: {
  id?: string
  chiave: string
  gruppo: string
  titolo: string
  corpo: string
  posizione: number
  pubblicato: boolean
}): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({
      id: z.uuid().optional(),
      chiave: z
        .string()
        .trim()
        .min(2)
        .max(120)
        .regex(/^[a-z0-9.\-]+$/, 'Usa lettere minuscole, numeri, punti e trattini.'),
      gruppo: z.string().trim().min(2).max(60),
      titolo: z.string().trim().max(200),
      corpo: z.string().max(20000),
      posizione: z.number().int().min(0).max(999),
      pubblicato: z.boolean(),
    })
    .safeParse(dati)

  if (!lettura.success) {
    return fallita(lettura.error.issues[0]?.message ?? 'Controlla i campi.')
  }
  const d = lettura.data

  const valori = {
    key: d.chiave,
    group: d.gruppo,
    title: d.titolo || null,
    body: d.corpo,
    position: d.posizione,
    published: d.pubblicato,
    updatedAt: new Date(),
  }

  if (d.id) await db.update(contentBlocks).set(valori).where(eq(contentBlocks.id, d.id))
  else {
    await db
      .insert(contentBlocks)
      .values(valori)
      .onConflictDoUpdate({ target: contentBlocks.key, set: valori })
  }

  revalidatePath('/admin/contenuti')
  revalidatePath('/faq')
  return riuscita('Testo salvato.')
}

export async function salvaSconto(dati: {
  id?: string
  codice: string
  tipo: 'percent' | 'fixed'
  valore: number
  minimoOrdineCents: number
  limiteUtilizzi: number | null
  scadenza: string | null
  attivo: boolean
}): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({
      id: z.uuid().optional(),
      codice: z
        .string()
        .trim()
        .toUpperCase()
        .min(3)
        .max(40)
        .regex(/^[A-Z0-9_-]+$/, 'Il codice può avere lettere, numeri, trattini.'),
      tipo: z.enum(['percent', 'fixed']),
      valore: z.number().int().min(1),
      minimoOrdineCents: z.number().int().min(0),
      limiteUtilizzi: z.number().int().min(1).nullable(),
      scadenza: z.string().nullable(),
      attivo: z.boolean(),
    })
    .safeParse(dati)

  if (!lettura.success) {
    return fallita(lettura.error.issues[0]?.message ?? 'Controlla i campi dello sconto.')
  }
  const d = lettura.data

  if (d.tipo === 'percent' && d.valore > 100) {
    return fallita('Una percentuale non può superare 100.')
  }

  const valori = {
    code: d.codice,
    type: d.tipo,
    value: d.valore,
    minOrderCents: d.minimoOrdineCents,
    usageLimit: d.limiteUtilizzi,
    expiresAt: d.scadenza ? new Date(d.scadenza) : null,
    active: d.attivo,
  }

  try {
    if (d.id) await db.update(discountCodes).set(valori).where(eq(discountCodes.id, d.id))
    else await db.insert(discountCodes).values(valori)

    revalidatePath('/admin/sconti')
    return riuscita('Codice salvato.')
  } catch {
    return fallita('Questo codice esiste già.')
  }
}

export async function disattivaSconto(scontoId: string): Promise<EsitoAzione> {
  await autorizza()
  if (!z.uuid().safeParse(scontoId).success) return fallita('Codice non valido.')

  await db.update(discountCodes).set({ active: false }).where(eq(discountCodes.id, scontoId))
  revalidatePath('/admin/sconti')
  return riuscita('Codice disattivato.')
}

export async function salvaFascia(dati: {
  id?: string
  minPesoKg: number
  maxPesoKg: number
  metodo: 'courier' | 'pallet' | 'floor_delivery' | 'pickup'
  prezzoCents: number
  zona: 'italia' | 'isole' | 'estero'
  etaGiorni: number
  attiva: boolean
}): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({
      id: z.uuid().optional(),
      minPesoKg: z.number().min(0).max(9999),
      maxPesoKg: z.number().min(0).max(9999),
      metodo: z.enum(['courier', 'pallet', 'floor_delivery', 'pickup']),
      prezzoCents: z.number().int().min(0),
      zona: z.enum(['italia', 'isole', 'estero']),
      etaGiorni: z.number().int().min(1).max(120),
      attiva: z.boolean(),
    })
    .refine((d) => d.minPesoKg < d.maxPesoKg, {
      message: 'Il peso minimo deve essere inferiore al massimo.',
      path: ['maxPesoKg'],
    })
    .safeParse(dati)

  if (!lettura.success) {
    return fallita(lettura.error.issues[0]?.message ?? 'Controlla i campi della fascia.')
  }
  const d = lettura.data

  const valori = {
    minWeightKg: String(d.minPesoKg),
    maxWeightKg: String(d.maxPesoKg),
    method: d.metodo,
    priceCents: d.prezzoCents,
    zone: d.zona,
    etaDays: d.etaGiorni,
    active: d.attiva,
  }

  if (d.id) await db.update(shippingRates).set(valori).where(eq(shippingRates.id, d.id))
  else await db.insert(shippingRates).values(valori)

  revalidatePath('/admin/spedizioni')
  return riuscita('Fascia salvata.')
}

export async function disattivaFascia(fasciaId: string): Promise<EsitoAzione> {
  await autorizza()
  if (!z.uuid().safeParse(fasciaId).success) return fallita('Fascia non valida.')

  await db.update(shippingRates).set({ active: false }).where(eq(shippingRates.id, fasciaId))
  revalidatePath('/admin/spedizioni')
  return riuscita('Fascia disattivata.')
}

export async function decidiRecensione(
  recensioneId: string,
  approvata: boolean,
): Promise<EsitoAzione> {
  await autorizza()
  const lettura = z
    .object({ recensioneId: z.uuid(), approvata: z.boolean() })
    .safeParse({ recensioneId, approvata })
  if (!lettura.success) return fallita('Recensione non valida.')

  await db
    .update(reviews)
    .set({ approved: lettura.data.approvata })
    .where(eq(reviews.id, lettura.data.recensioneId))

  revalidatePath('/admin/recensioni')
  return riuscita(approvata ? 'Recensione pubblicata.' : 'Recensione tolta dalla vetrina.')
}
