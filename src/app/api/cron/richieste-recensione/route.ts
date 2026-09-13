import { NextResponse } from 'next/server'
import { ordiniDaRecensire, segnaRecensioneRichiesta } from '@/db/queries/ordini'
import { inviaEmail } from '@/lib/email/invia'
import RichiestaRecensione from '@/emails/richiesta-recensione'
import { cronAutorizzato } from '@/lib/cron'
import { site } from '@/lib/site'
import type { IndirizzoOrdine } from '@/db/queries/ordini'

export const dynamic = 'force-dynamic'

/** A quindici giorni dalla consegna: il tempo di averlo usato davvero. */
const GIORNI_ATTESA = 15

export async function POST(richiesta: Request): Promise<Response> {
  if (!cronAutorizzato(richiesta)) {
    return NextResponse.json({ errore: 'Non autorizzato.' }, { status: 401 })
  }

  const ordini = await ordiniDaRecensire(GIORNI_ATTESA)
  let inviate = 0

  for (const ordine of ordini) {
    const primo = ordine.items[0]
    if (!primo) continue

    const indirizzo = ordine.shippingAddress as IndirizzoOrdine
    const slug = (primo.variantSnapshot as { slug?: string }).slug

    await inviaEmail({
      a: ordine.email,
      oggetto: `Come sta il tuo ${primo.productNameSnapshot}?`,
      contenuto: RichiestaRecensione({
        nomeCliente: indirizzo.nome.split(' ')[0] ?? indirizzo.nome,
        nomeProdotto: primo.productNameSnapshot,
        urlRecensione: `${site.url}/recensione/${ordine.id}${slug ? `?prodotto=${slug}` : ''}`,
        urlSito: site.url,
      }),
    })

    await segnaRecensioneRichiesta(ordine.id)
    inviate += 1
  }

  return NextResponse.json({ ok: true, inviate })
}
