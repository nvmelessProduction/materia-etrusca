import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock } from 'lucide-react'
import { ordinePerId } from '@/db/queries/ordini'
import { bonificoConfigurato } from '@/lib/ordini/notifiche'
import { ETICHETTE_METODO } from '@/lib/spedizioni/motore'
import { ETICHETTE_PAGAMENTO } from '@/lib/validazioni/checkout'
import { accessoDisponibile } from '@/lib/auth'
import type { IndirizzoOrdine } from '@/db/queries/ordini'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Il tuo ordine',
  // La pagina è raggiungibile con un identificativo non indovinabile: fuori dagli indici.
  robots: { index: false, follow: false },
}

type SnapshotVariante = { altezzaCm?: number; finitura?: string; giorniDiAttesa?: number }

export default async function PaginaOrdine({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ pagamento?: string }>
}) {
  const [{ id }, { pagamento }] = await Promise.all([params, searchParams])

  const ordine = await ordinePerId(id)
  if (!ordine) notFound()

  const indirizzo = ordine.shippingAddress as IndirizzoOrdine
  const inAttesaDiBonifico = ordine.paymentMethod === 'bank_transfer' && ordine.status === 'pending'
  const bonifico = inAttesaDiBonifico ? bonificoConfigurato() : null
  const attesaMassima = Math.max(
    0,
    ...ordine.items.map((voce) => (voce.variantSnapshot as SnapshotVariante).giorniDiAttesa ?? 0),
  )

  return (
    <div className="contenitore max-w-3xl py-14 md:py-20">
      {pagamento === 'annullato' || pagamento === 'errore' ? (
        <div className="border-errore/40 bg-errore/5 border p-5">
          <p className="text-errore font-medium">Il pagamento non è andato a buon fine.</p>
          <p className="mt-2 text-sm">
            Non ho addebitato nulla. L’ordine {ordine.orderNumber} è registrato ma in attesa: se
            vuoi riprovare,{' '}
            <Link href="/checkout" className="underline underline-offset-4">
              torna al pagamento
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          <p className="text-oliva flex items-center gap-2 text-sm">
            {inAttesaDiBonifico ? (
              <Clock aria-hidden className="size-4" />
            ) : (
              <CheckCircle2 aria-hidden className="size-4" />
            )}
            Ordine {ordine.orderNumber}
          </p>
          <h1 className="font-display mt-5 text-4xl font-light md:text-5xl">
            {inAttesaDiBonifico ? 'Ho messo il pezzo da parte.' : 'Grazie, è tutto a posto.'}
          </h1>
          <p className="text-testo-tenue mt-5 max-w-xl leading-relaxed">
            {inAttesaDiBonifico
              ? 'Ti ho mandato gli estremi per il bonifico via email. Appena lo vedo arrivare preparo l’imballo e ti scrivo.'
              : attesaMassima > 0
                ? `Questo pezzo lo colo apposta per te: ci vogliono ${attesaMassima} giorni prima che parta. Ti avviso io quando è pronto.`
                : 'Ti ho mandato la conferma via email. Preparo l’imballo nei prossimi due giorni lavorativi e ti scrivo appena parte, con il numero per seguirlo.'}
          </p>
        </>
      )}

      {bonifico ? (
        <div className="border-bordo bg-tufo mt-10 border p-6">
          <h2 className="occhiello">Estremi per il bonifico</h2>
          <dl className="mt-4 space-y-1.5 text-sm">
            <Voce etichetta="Intestatario" valore={bonifico.intestatario} />
            <Voce etichetta="IBAN" valore={bonifico.iban} />
            {bonifico.banca ? <Voce etichetta="Banca" valore={bonifico.banca} /> : null}
            <Voce etichetta="Causale" valore={ordine.orderNumber} />
            <Voce etichetta="Importo" valore={formatPrice(ordine.totalCents)} />
          </dl>
        </div>
      ) : null}

      <section className="border-bordo mt-12 border-t pt-8">
        <h2 className="occhiello">Cosa hai preso</h2>
        <ul className="mt-5 space-y-4">
          {ordine.items.map((voce) => {
            const snapshot = voce.variantSnapshot as SnapshotVariante
            return (
              <li key={voce.id} className="flex justify-between gap-4 text-sm">
                <span>
                  {voce.quantity} × {voce.productNameSnapshot}
                  <span className="text-testo-tenue block text-xs">
                    {snapshot.altezzaCm ? `${snapshot.altezzaCm} cm` : null}
                    {snapshot.finitura ? ` · ${snapshot.finitura}` : null}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatPrice(voce.totalCents)}</span>
              </li>
            )
          })}
        </ul>

        <dl className="border-bordo mt-6 space-y-1.5 border-t pt-5 text-sm">
          <Voce etichetta="Merce" valore={formatPrice(ordine.subtotalCents)} />
          {ordine.discountCents > 0 ? (
            <Voce
              etichetta={`Sconto ${ordine.discountCode ?? ''}`}
              valore={`−${formatPrice(ordine.discountCents)}`}
            />
          ) : null}
          <Voce
            etichetta={ETICHETTE_METODO[ordine.shippingMethod]}
            valore={ordine.shippingCents === 0 ? 'gratis' : formatPrice(ordine.shippingCents)}
          />
          <Voce etichetta="Pagamento" valore={ETICHETTE_PAGAMENTO[ordine.paymentMethod]} />
        </dl>

        <div className="border-bordo mt-5 flex items-baseline justify-between gap-4 border-t pt-5">
          <span className="font-medium">Totale</span>
          <span className="text-xl tabular-nums">{formatPrice(ordine.totalCents)}</span>
        </div>
      </section>

      <section className="border-bordo mt-12 border-t pt-8">
        <h2 className="occhiello">Dove te lo mando</h2>
        <address className="mt-4 text-sm leading-relaxed not-italic">
          {indirizzo.nome}
          <br />
          {indirizzo.indirizzo}
          {indirizzo.indirizzo2 ? (
            <>
              <br />
              {indirizzo.indirizzo2}
            </>
          ) : null}
          <br />
          {indirizzo.cap} {indirizzo.citta} ({indirizzo.provincia})
          <br />
          {ordine.phone}
        </address>
        {ordine.deliveryNotes ? (
          <p className="text-testo-tenue mt-4 text-sm">Note: {ordine.deliveryNotes}</p>
        ) : null}
      </section>

      {accessoDisponibile && !ordine.customerId ? null : accessoDisponibile ? (
        <section className="border-bordo mt-12 border p-6">
          <p className="font-medium">Vuoi ritrovare questo ordine senza cercare l’email?</p>
          <p className="text-testo-tenue mt-2 text-sm">
            Ti mando un link a {ordine.email} e da lì vedi lo storico. Nessuna password da
            inventare.
          </p>
          <Link
            href={`/accedi?email=${encodeURIComponent(ordine.email)}`}
            className="border-antracite hover:bg-antracite hover:text-calce mt-5 inline-flex h-12 items-center border px-6 text-sm transition-colors duration-300"
          >
            Creami l’account
          </Link>
        </section>
      ) : null}

      <p className="text-testo-tenue mt-12 text-sm leading-relaxed">
        Ogni pezzo è colato e rifinito a mano: le piccole variazioni sono la firma, non un difetto.
        Se qualcosa non va, rispondi alla mia email: legge una persona sola, e sono io.
      </p>
    </div>
  )
}

function Voce({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-testo-tenue">{etichetta}</dt>
      <dd className="tabular-nums">{valore}</dd>
    </div>
  )
}
