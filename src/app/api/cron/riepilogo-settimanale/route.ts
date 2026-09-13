import { NextResponse } from 'next/server'
import { riepilogoSettimana } from '@/db/queries/admin'
import { inviaEmail, emailArtigiano } from '@/lib/email/invia'
import RiepilogoSettimanale from '@/emails/riepilogo-settimanale'
import { cronAutorizzato } from '@/lib/cron'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

/** Il riepilogo del lunedì mattina. */
async function esegui(richiesta: Request): Promise<Response> {
  if (!cronAutorizzato(richiesta)) {
    return NextResponse.json({ errore: 'Non autorizzato.' }, { status: 401 })
  }

  const dati = await riepilogoSettimana()

  await inviaEmail({
    a: emailArtigiano(),
    oggetto: `Settimana chiusa a ${(dati.venditeCents / 100).toFixed(2)} €`,
    contenuto: RiepilogoSettimanale({
      ...dati,
      urlAdmin: `${site.url}/admin`,
      urlSito: site.url,
    }),
  })

  return NextResponse.json({ ok: true, ...dati })
}

export const GET = esegui
export const POST = esegui
