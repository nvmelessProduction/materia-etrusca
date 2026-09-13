import { afterAll, beforeAll, describe, expect, it } from 'vitest'

/**
 * Prove contro un PostgreSQL vero. Senza DATABASE_URL vengono saltate, così
 * `pnpm test` resta eseguibile ovunque; in CI basta alzare un database.
 *
 * Qui si verifica la promessa più importante del negozio: **un pezzo unico
 * non può essere venduto due volte**, nemmeno se due persone pagano nello
 * stesso istante.
 */
const conDatabase = Boolean(process.env.DATABASE_URL)

describe.skipIf(!conDatabase)('segnaOrdinePagato — contro il database', () => {
  let db: typeof import('@/db').db
  let schema: typeof import('@/db/schema')
  let ordini: typeof import('@/db/queries/ordini')

  let collezioneId: string
  let prodottoUnicoId: string
  let varianteUnicaId: string
  let prodottoSerieId: string
  let varianteSerieId: string
  let prodottoOrdinazioneId: string
  let varianteOrdinazioneId: string

  const marcatore = `test-${Date.now()}`

  beforeAll(async () => {
    db = (await import('@/db')).db
    schema = await import('@/db/schema')
    ordini = await import('@/db/queries/ordini')

    const [collezione] = await db
      .insert(schema.collections)
      .values({ slug: `${marcatore}-coll`, name: 'Collezione di prova' })
      .returning({ id: schema.collections.id })
    collezioneId = collezione!.id

    const creaProdotto = async (
      suffisso: string,
      opzioni: { pezzoUnico?: boolean; suOrdinazione?: boolean; giacenza: number },
    ) => {
      const [prodotto] = await db
        .insert(schema.products)
        .values({
          slug: `${marcatore}-${suffisso}`,
          name: `Prova ${suffisso}`,
          collectionId: collezioneId,
          basePriceCents: 10000,
          isUnique: opzioni.pezzoUnico ?? false,
          isMadeToOrder: opzioni.suOrdinazione ?? false,
          leadTimeDays: opzioni.suOrdinazione ? 30 : 0,
          status: 'active',
        })
        .returning({ id: schema.products.id })

      const [variante] = await db
        .insert(schema.productVariants)
        .values({
          productId: prodotto!.id,
          sku: `${marcatore}-${suffisso}-sku`,
          heightCm: '50',
          diameterCm: '30',
          weightKg: '20',
          finish: 'grezzo',
          priceCents: 10000,
          stock: opzioni.giacenza,
          packageWeightKg: '24',
          packageVolumeL: '80',
        })
        .returning({ id: schema.productVariants.id })

      return { prodottoId: prodotto!.id, varianteId: variante!.id }
    }

    const unico = await creaProdotto('unico', { pezzoUnico: true, giacenza: 1 })
    prodottoUnicoId = unico.prodottoId
    varianteUnicaId = unico.varianteId

    const serie = await creaProdotto('serie', { giacenza: 3 })
    prodottoSerieId = serie.prodottoId
    varianteSerieId = serie.varianteId

    const ordinazione = await creaProdotto('ordinazione', { suOrdinazione: true, giacenza: 0 })
    prodottoOrdinazioneId = ordinazione.prodottoId
    varianteOrdinazioneId = ordinazione.varianteId
  })

  afterAll(async () => {
    if (!conDatabase) return
    const { inArray, like } = await import('drizzle-orm')
    await db
      .delete(schema.orderItems)
      .where(
        inArray(
          schema.orderItems.variantId,
          [varianteUnicaId, varianteSerieId, varianteOrdinazioneId].filter(Boolean),
        ),
      )
    await db.delete(schema.orders).where(like(schema.orders.email, `${marcatore}%`))
    await db
      .delete(schema.products)
      .where(inArray(schema.products.id, [prodottoUnicoId, prodottoSerieId, prodottoOrdinazioneId]))
    await db.delete(schema.collections).where(inArray(schema.collections.id, [collezioneId]))
  })

  async function creaOrdineDiProva(varianteId: string, quantita = 1, nome = 'Pezzo') {
    return ordini.creaOrdine({
      email: `${marcatore}-${Math.random().toString(36).slice(2)}@example.com`,
      customerId: null,
      subtotaleCents: 10000 * quantita,
      spedizioneCents: 0,
      scontoCents: 0,
      totaleCents: 10000 * quantita,
      codiceSconto: null,
      metodoSpedizione: 'pickup',
      metodoPagamento: 'stripe',
      indirizzo: {
        nome: 'Cliente Di Prova',
        indirizzo: 'Via del Tufo 1',
        indirizzo2: null,
        citta: 'Cerveteri',
        cap: '00052',
        provincia: 'RM',
        paese: 'IT',
      },
      telefono: '+39 340 0000000',
      noteConsegna: null,
      fatturaRichiesta: false,
      partitaIva: null,
      codiceSdi: null,
      progettoId: null,
      voci: [
        {
          variantId: varianteId,
          nomeProdotto: nome,
          snapshot: { altezzaCm: 50, finitura: 'Grezzo' },
          quantita,
          prezzoUnitarioCents: 10000,
          totaleCents: 10000 * quantita,
        },
      ],
    })
  }

  async function giacenza(varianteId: string): Promise<number> {
    const { eq } = await import('drizzle-orm')
    const [riga] = await db
      .select({ stock: schema.productVariants.stock })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, varianteId))
    return riga?.stock ?? -1
  }

  it('scala la giacenza e segna l’ordine pagato', async () => {
    const ordine = await creaOrdineDiProva(varianteSerieId, 2)
    const esito = await ordini.segnaOrdinePagato({ ordineId: ordine.id })

    expect(esito.ok).toBe(true)
    if (esito.ok) {
      expect(esito.giaLavorato).toBe(false)
      expect(esito.ordine.status).toBe('paid')
      expect(esito.ordine.paidAt).not.toBeNull()
    }
    expect(await giacenza(varianteSerieId)).toBe(1)
  })

  it('non scala due volte se il webhook arriva di nuovo', async () => {
    const primaDi = await giacenza(varianteSerieId)
    const ordine = await creaOrdineDiProva(varianteSerieId, 1)

    await ordini.segnaOrdinePagato({ ordineId: ordine.id })
    const ripetuto = await ordini.segnaOrdinePagato({ ordineId: ordine.id })

    expect(ripetuto.ok).toBe(true)
    if (ripetuto.ok) expect(ripetuto.giaLavorato).toBe(true)
    expect(await giacenza(varianteSerieId)).toBe(primaDi - 1)
  })

  it('registra un evento una volta sola: è questo a rendere idempotente il webhook', async () => {
    const id = `evt_${marcatore}`
    expect(await ordini.registraEvento(id, 'stripe', 'checkout.session.completed')).toBe(true)
    expect(await ordini.registraEvento(id, 'stripe', 'checkout.session.completed')).toBe(false)
  })

  it('vende il pezzo unico a chi paga per primo, e rifiuta il secondo', async () => {
    const primo = await creaOrdineDiProva(varianteUnicaId, 1, 'Pezzo unico')
    const secondo = await creaOrdineDiProva(varianteUnicaId, 1, 'Pezzo unico')

    // Due pagamenti nello stesso istante, esattamente come dai due webhook.
    const [esitoPrimo, esitoSecondo] = await Promise.all([
      ordini.segnaOrdinePagato({ ordineId: primo.id }),
      ordini.segnaOrdinePagato({ ordineId: secondo.id }),
    ])

    const riusciti = [esitoPrimo, esitoSecondo].filter((esito) => esito.ok)
    const falliti = [esitoPrimo, esitoSecondo].filter((esito) => !esito.ok)

    expect(riusciti).toHaveLength(1)
    expect(falliti).toHaveLength(1)
    expect(falliti[0]).toMatchObject({ ok: false, motivo: 'scorta-insufficiente' })

    // E soprattutto: la giacenza non è mai andata sotto zero.
    expect(await giacenza(varianteUnicaId)).toBe(0)
  })

  it('vende un pezzo su ordinazione anche a giacenza zero, senza andare in negativo', async () => {
    const ordine = await creaOrdineDiProva(varianteOrdinazioneId, 2, 'Su ordinazione')
    const esito = await ordini.segnaOrdinePagato({ ordineId: ordine.id })

    expect(esito.ok).toBe(true)
    expect(await giacenza(varianteOrdinazioneId)).toBe(0)
  })

  it('rifiuta un ordine che chiede più pezzi di quanti ne esistano', async () => {
    const ordine = await creaOrdineDiProva(varianteSerieId, 99)
    const esito = await ordini.segnaOrdinePagato({ ordineId: ordine.id })

    expect(esito).toMatchObject({ ok: false, motivo: 'scorta-insufficiente' })
  })
})
