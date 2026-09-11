import 'server-only'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { shippingRates } from '@/db/schema'
import { numero } from '@/db/queries/mappatori'
import type { FasciaSpedizione } from '@/lib/spedizioni/motore'

export async function fasceSpedizione(): Promise<FasciaSpedizione[]> {
  const righe = await db
    .select()
    .from(shippingRates)
    .where(eq(shippingRates.active, true))
    .orderBy(asc(shippingRates.zone), asc(shippingRates.minWeightKg))

  return righe.map((riga) => ({
    id: riga.id,
    minPesoKg: numero(riga.minWeightKg),
    maxPesoKg: numero(riga.maxWeightKg),
    metodo: riga.method,
    prezzoCents: riga.priceCents,
    zona: riga.zone,
    etaGiorni: riga.etaDays,
  }))
}
