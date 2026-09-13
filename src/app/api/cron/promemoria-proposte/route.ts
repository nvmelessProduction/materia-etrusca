import { NextResponse } from 'next/server'
import {
  proposteInScadenza,
  scadiRichiesteVecchie,
  segnaPromemoriaScadenza,
  urlProposta,
} from '@/db/queries/progetti'
import { inviaEmail } from '@/lib/email/invia'
import PromemoriaScadenza from '@/emails/promemoria-scadenza'
import { cronAutorizzato } from '@/lib/cron'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

const GIORNI_PRIMA = 7

/** Promemoria a una settimana dalla scadenza, e chiusura di quelle già scadute. */
async function esegui(richiesta: Request): Promise<Response> {
  if (!cronAutorizzato(richiesta)) {
    return NextResponse.json({ errore: 'Non autorizzato.' }, { status: 401 })
  }

  const candidate = await proposteInScadenza(GIORNI_PRIMA)
  let inviati = 0

  for (const proposta of candidate) {
    if (!proposta.expiresAt) continue

    const giorniRimasti = Math.max(
      0,
      Math.ceil((proposta.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    )
    // Già scaduta: se ne occupa il passaggio successivo, non il promemoria.
    if (giorniRimasti === 0) continue

    await inviaEmail({
      a: proposta.email,
      oggetto: `La tua proposta scade fra ${giorniRimasti} giorni`,
      contenuto: PromemoriaScadenza({
        nomeCliente: proposta.name.split(' ')[0] ?? proposta.name,
        giorniRimasti,
        urlProposta: urlProposta(proposta.publicToken),
        urlSito: site.url,
      }),
    })

    await segnaPromemoriaScadenza(proposta.id)
    inviati += 1
  }

  const scadute = await scadiRichiesteVecchie()

  return NextResponse.json({ ok: true, inviati, scadute })
}

// Vercel Cron chiama in GET e manda da sé `Authorization: Bearer $CRON_SECRET`.
// In POST si può invocare a mano, con lo stesso segreto.
export const GET = esegui
export const POST = esegui
