import { redirect } from 'next/navigation'
import { ordinePerId, registraEvento, segnaOrdinePagato } from '@/db/queries/ordini'
import { catturaOrdinePaypal } from '@/lib/pagamenti/paypal'
import { inviaEmailOrdine } from '@/lib/ordini/notifiche'

export const dynamic = 'force-dynamic'

/**
 * Ritorno da PayPal: si cattura il pagamento e si torna alla conferma.
 * Il webhook fa lo stesso lavoro se il cliente chiude il browser prima;
 * entrambe le strade passano per `segnaOrdinePagato`, che è idempotente.
 */
export default async function RitornoPaypal({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams

  const ordine = await ordinePerId(id)
  if (!ordine) redirect('/carrello')

  if (ordine.status !== 'pending') redirect(`/ordine/${id}?pagamento=ok`)

  const idPaypal = token ?? ordine.paypalOrderId
  if (!idPaypal) redirect(`/ordine/${id}?pagamento=annullato`)

  try {
    const cattura = await catturaOrdinePaypal(idPaypal)
    if (!cattura.pagato) redirect(`/ordine/${id}?pagamento=annullato`)

    await registraEvento(`paypal-ritorno-${idPaypal}`, 'paypal', 'ritorno')
    const esito = await segnaOrdinePagato({ ordineId: id, paypalOrderId: idPaypal })
    if (esito.ok && !esito.giaLavorato) {
      await inviaEmailOrdine(esito.ordine)
    }
  } catch (errore) {
    // `redirect` lavora sollevando: non va scambiata per un errore vero.
    if (errore instanceof Error && errore.message === 'NEXT_REDIRECT') throw errore
    console.error('Cattura PayPal fallita:', errore)
    redirect(`/ordine/${id}?pagamento=errore`)
  }

  redirect(`/ordine/${id}?pagamento=ok`)
}
