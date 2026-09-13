import 'server-only'
import { and, gt, isNotNull, isNull, lt, sql } from 'drizzle-orm'
import { db } from '@/db'
import { cartItems, carts } from '@/db/schema'

/**
 * Carrelli fermi da un giorno, con un'email a cui scrivere e nessun
 * promemoria già mandato. Si scrive **una volta sola**: il secondo messaggio
 * non convince nessuno, infastidisce e basta.
 */
export async function carrelliDaRicordare(oreFerme = 24) {
  const soglia = new Date(Date.now() - oreFerme * 60 * 60 * 1000)
  // Oltre una settimana non ha più senso: il momento è passato.
  const limiteInferiore = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const righe = await db
    .select({ id: carts.id, email: carts.email })
    .from(carts)
    .innerJoin(cartItems, sql`${cartItems.cartId} = ${carts.id}`)
    .where(
      and(
        isNotNull(carts.email),
        isNull(carts.reminderSentAt),
        isNull(carts.convertedOrderId),
        lt(carts.updatedAt, soglia),
        gt(carts.updatedAt, limiteInferiore),
      ),
    )
    .groupBy(carts.id, carts.email)
    .limit(50)

  return righe
}

export async function segnaPromemoriaInviato(cartId: string): Promise<void> {
  await db
    .update(carts)
    .set({ reminderSentAt: new Date() })
    .where(sql`${carts.id} = ${cartId}`)
}
