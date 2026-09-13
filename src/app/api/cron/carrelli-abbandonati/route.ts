import { NextResponse } from 'next/server'
import { carrelliDaRicordare, segnaPromemoriaInviato } from '@/db/queries/carrelli-abbandonati'
import { componiCarrello, trovaCarrello } from '@/db/queries/carrello'
import { db } from '@/db'
import { carts } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { inviaEmail } from '@/lib/email/invia'
import CarrelloAbbandonato from '@/emails/carrello-abbandonato'
import { cronAutorizzato } from '@/lib/cron'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

/** Promemoria a 24 ore dall'ultimo tocco. Uno solo per carrello. */
async function esegui(richiesta: Request): Promise<Response> {
  if (!cronAutorizzato(richiesta)) {
    return NextResponse.json({ errore: 'Non autorizzato.' }, { status: 401 })
  }

  const candidati = await carrelliDaRicordare(24)
  let inviate = 0

  for (const candidato of candidati) {
    if (!candidato.email) continue

    const [riga] = await db.select().from(carts).where(eq(carts.id, candidato.id)).limit(1)
    const carrello = await componiCarrello(riga ?? (await trovaCarrello({ customerId: null })))
    if (carrello.righe.length === 0) continue

    await inviaEmail({
      a: candidato.email,
      oggetto: 'Hai lasciato qualcosa nel carrello',
      contenuto: CarrelloAbbandonato({
        nomeCliente: null,
        righe: carrello.righe.map((voce) => ({
          nome: `${voce.quantita} × ${voce.nomeProdotto}`,
          dettaglio: `${voce.altezzaCm} cm · ${voce.finitura}`,
          totaleCents: voce.totaleCents,
        })),
        urlCarrello: `${site.url}/carrello`,
        urlSito: site.url,
        contienePezzoUnico: carrello.righe.some((voce) => voce.isUnique),
      }),
    })

    await segnaPromemoriaInviato(candidato.id)
    inviate += 1
  }

  return NextResponse.json({ ok: true, inviate })
}

// Vercel Cron chiama in GET e manda da sé `Authorization: Bearer $CRON_SECRET`.
// In POST si può invocare a mano, con lo stesso segreto.
export const GET = esegui
export const POST = esegui
