import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ordineCompleto } from '@/db/queries/admin'
import { ControlliOrdine } from '@/components/admin/controlli-ordine'
import { NotaInterna } from '@/components/admin/nota-interna'
import { Scheda, Stato, TitoloAdmin } from '@/components/admin/guscio'
import { salvaNotaOrdine } from '@/lib/admin/azioni'
import { ETICHETTE_METODO } from '@/lib/spedizioni/motore'
import { ETICHETTE_PAGAMENTO } from '@/lib/validazioni/checkout'
import type { IndirizzoOrdine } from '@/db/queries/ordini'
import { formatDateTime, formatNumber, formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ordine' }

type Snapshot = {
  altezzaCm?: number
  diametroCm?: number
  finitura?: string
  pesoKg?: number
  pesoImballoKg?: number
  slug?: string
  pezzoUnico?: boolean
}

export default async function PaginaOrdine({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ordine = await ordineCompleto(id)
  if (!ordine) notFound()

  const indirizzo = ordine.shippingAddress as IndirizzoOrdine
  const pesoTotale = ordine.items.reduce(
    (somma, voce) =>
      somma + ((voce.variantSnapshot as Snapshot).pesoImballoKg ?? 0) * voce.quantity,
    0,
  )

  return (
    <div className="space-y-10">
      <TitoloAdmin
        titolo={ordine.orderNumber}
        sottotitolo={`${formatDateTime(ordine.createdAt)} · ${ETICHETTE_PAGAMENTO[ordine.paymentMethod]}`}
        azione={<Stato stato={ordine.status} />}
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:gap-12">
        <div className="space-y-10">
          <section>
            <h2 className="occhiello">Da imballare</h2>
            <ul className="mt-4 space-y-3">
              {ordine.items.map((voce) => {
                const snapshot = voce.variantSnapshot as Snapshot
                return (
                  <li key={voce.id}>
                    <Scheda className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {voce.quantity} × {voce.productNameSnapshot}
                          {snapshot.pezzoUnico ? (
                            <span className="text-terracotta ml-2 text-xs">pezzo unico</span>
                          ) : null}
                        </p>
                        <p className="text-testo-tenue mt-1 text-sm">
                          {snapshot.altezzaCm ? `${snapshot.altezzaCm} cm` : null}
                          {snapshot.diametroCm ? ` · ø ${snapshot.diametroCm} cm` : null}
                          {snapshot.finitura ? ` · ${snapshot.finitura}` : null}
                        </p>
                        <p className="text-testo-tenue mt-1 text-xs">
                          {snapshot.pesoImballoKg
                            ? `${formatNumber(snapshot.pesoImballoKg)} kg imballato`
                            : null}
                          {snapshot.slug ? (
                            <>
                              {' · '}
                              <Link
                                href={`/prodotti/${snapshot.slug}`}
                                className="underline underline-offset-4"
                              >
                                scheda
                              </Link>
                            </>
                          ) : null}
                        </p>
                      </div>
                      <p className="shrink-0 tabular-nums">{formatPrice(voce.totalCents)}</p>
                    </Scheda>
                  </li>
                )
              })}
            </ul>

            <dl className="border-bordo mt-5 space-y-1.5 border-t pt-4 text-sm">
              <Riga etichetta="Merce" valore={formatPrice(ordine.subtotalCents)} />
              {ordine.discountCents > 0 ? (
                <Riga
                  etichetta={`Sconto ${ordine.discountCode ?? ''}`}
                  valore={`−${formatPrice(ordine.discountCents)}`}
                />
              ) : null}
              <Riga
                etichetta={ETICHETTE_METODO[ordine.shippingMethod]}
                valore={formatPrice(ordine.shippingCents)}
              />
              <Riga etichetta="Peso totale a imballo" valore={`${formatNumber(pesoTotale)} kg`} />
            </dl>
            <div className="border-bordo mt-4 flex items-baseline justify-between gap-4 border-t pt-4">
              <span className="font-medium">Totale</span>
              <span className="text-xl tabular-nums">{formatPrice(ordine.totalCents)}</span>
            </div>
          </section>

          <ControlliOrdine
            ordineId={ordine.id}
            stato={ordine.status}
            corriereIniziale={ordine.trackingCarrier ?? ''}
            trackingIniziale={ordine.trackingNumber ?? ''}
            attesaBonifico={ordine.paymentMethod === 'bank_transfer' && ordine.status === 'pending'}
          />
        </div>

        <aside className="space-y-8">
          <section>
            <h2 className="occhiello">Spedire a</h2>
            <address className="mt-3 text-sm leading-relaxed not-italic">
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
              {indirizzo.paese !== 'IT' ? (
                <>
                  <br />
                  {indirizzo.paese}
                </>
              ) : null}
            </address>
            <p className="mt-3 text-sm">
              <a href={`tel:${ordine.phone}`} className="underline underline-offset-4">
                {ordine.phone}
              </a>
              <br />
              <a href={`mailto:${ordine.email}`} className="underline underline-offset-4">
                {ordine.email}
              </a>
            </p>
          </section>

          {ordine.deliveryNotes ? (
            <section>
              <h2 className="occhiello">Note del cliente</h2>
              <p className="border-terracotta mt-3 border-l-2 pl-4 text-sm leading-relaxed">
                {ordine.deliveryNotes}
              </p>
            </section>
          ) : null}

          {ordine.invoiceRequested ? (
            <section>
              <h2 className="occhiello">Fattura</h2>
              <p className="mt-3 text-sm">
                P. IVA {ordine.vatNumber ?? '—'}
                <br />
                SDI {ordine.sdiCode ?? '—'}
              </p>
            </section>
          ) : null}

          {ordine.projectId ? (
            <section>
              <h2 className="occhiello">Nasce da un progetto</h2>
              <Link
                href={`/admin/progetti/${ordine.projectId}`}
                className="mt-3 inline-block text-sm underline underline-offset-4"
              >
                Apri la richiesta
              </Link>
            </section>
          ) : null}

          <NotaInterna
            valoreIniziale={ordine.notes ?? ''}
            salva={async (nota: string) => {
              'use server'
              return salvaNotaOrdine(ordine.id, nota)
            }}
          />
        </aside>
      </div>
    </div>
  )
}

function Riga({ etichetta, valore }: { etichetta: string; valore: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-testo-tenue">{etichetta}</dt>
      <dd className="tabular-nums">{valore}</dd>
    </div>
  )
}
