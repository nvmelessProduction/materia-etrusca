import Link from 'next/link'
import { riepilogo, SOGLIA_SCORTE } from '@/db/queries/admin'
import { Dato, Scheda, TitoloAdmin } from '@/components/admin/guscio'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function PaginaRiepilogo() {
  const dati = await riepilogo(30)

  return (
    <div className="space-y-10">
      <TitoloAdmin titolo="Come va" sottotitolo="Ultimi trenta giorni." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Scheda>
          <Dato etichetta="Incassato" valore={formatPrice(dati.venditeCents)} />
        </Scheda>
        <Scheda>
          <Dato
            etichetta="Ordini"
            valore={String(dati.ordini)}
            nota={
              dati.ordiniDaPreparare > 0
                ? `${dati.ordiniDaPreparare} da preparare`
                : 'Tutto spedito'
            }
          />
        </Scheda>
        <Scheda>
          <Dato
            etichetta="Richieste"
            valore={String(dati.richiesteTotali)}
            nota={
              dati.richiesteNuove > 0
                ? `${dati.richiesteNuove} ancora da guardare`
                : 'Nessuna in coda'
            }
          />
        </Scheda>
        <Scheda>
          <Dato
            etichetta="Conversione"
            valore={`${dati.tassoConversione.toLocaleString('it-IT')}%`}
            nota={`${dati.richiesteConvertite} richieste diventate ordini`}
          />
        </Scheda>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="occhiello">Da fare adesso</h2>
          <ul className="mt-4 space-y-3">
            {dati.richiesteNuove > 0 ? (
              <li>
                <Scheda href="/admin/progetti">
                  <p className="font-medium">
                    {dati.richiesteNuove}{' '}
                    {dati.richiesteNuove === 1 ? 'richiesta di progetto' : 'richieste di progetto'}{' '}
                    da guardare
                  </p>
                  <p className="text-testo-tenue mt-1 text-sm">
                    Ogni giorno che passa la proposta convince di meno.
                  </p>
                </Scheda>
              </li>
            ) : null}

            {dati.ordiniDaPreparare > 0 ? (
              <li>
                <Scheda href="/admin/ordini">
                  <p className="font-medium">
                    {dati.ordiniDaPreparare}{' '}
                    {dati.ordiniDaPreparare === 1 ? 'ordine da preparare' : 'ordini da preparare'}
                  </p>
                  <p className="text-testo-tenue mt-1 text-sm">Pagati, ancora da imballare.</p>
                </Scheda>
              </li>
            ) : null}

            {dati.recensioniDaApprovare > 0 ? (
              <li>
                <Scheda href="/admin/recensioni">
                  <p className="font-medium">
                    {dati.recensioniDaApprovare}{' '}
                    {dati.recensioniDaApprovare === 1 ? 'recensione' : 'recensioni'} da approvare
                  </p>
                </Scheda>
              </li>
            ) : null}

            {dati.richiesteNuove === 0 &&
            dati.ordiniDaPreparare === 0 &&
            dati.recensioniDaApprovare === 0 ? (
              <li>
                <Scheda>
                  <p className="text-testo-tenue text-sm">
                    Niente in sospeso. Puoi tornare in laboratorio.
                  </p>
                </Scheda>
              </li>
            ) : null}
          </ul>
        </section>

        <section>
          <h2 className="occhiello">Scorte sotto {SOGLIA_SCORTE + 1}</h2>
          {dati.scorteBasse.length === 0 ? (
            <Scheda className="mt-4">
              <p className="text-testo-tenue text-sm">Nessun pezzo in esaurimento.</p>
            </Scheda>
          ) : (
            <ul className="mt-4 space-y-2">
              {dati.scorteBasse.map((riga) => (
                <li key={riga.sku}>
                  <Scheda className="flex items-center justify-between gap-4 py-3">
                    <span className="min-w-0">
                      <Link
                        href={`/prodotti/${riga.slug}`}
                        className="text-sm underline underline-offset-4"
                      >
                        {riga.nome}
                      </Link>
                      <span className="text-testo-tenue block text-xs">{riga.sku}</span>
                    </span>
                    <span
                      className={
                        riga.giacenza === 0
                          ? 'text-errore shrink-0 text-sm'
                          : 'shrink-0 text-sm tabular-nums'
                      }
                    >
                      {riga.giacenza === 0 ? 'finito' : `${riga.giacenza} rimasti`}
                    </span>
                  </Scheda>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
