import Image from 'next/image'
import { notFound } from 'next/navigation'
import { richiestaCompleta } from '@/db/queries/admin'
import { EditorProposta, type VoceEditor } from '@/components/admin/editor-proposta'
import { NotaInterna } from '@/components/admin/nota-interna'
import { Azione } from '@/components/admin/azione'
import { Scheda, Stato, TitoloAdmin } from '@/components/admin/guscio'
import { cambiaStatoRichiesta, salvaNotaRichiesta } from '@/lib/admin/azioni'
import { ESPOSIZIONI, FASCE_BUDGET, STILI, TIPI_SPAZIO } from '@/lib/validazioni/progetto'
import { ETICHETTE_FINITURA } from '@/lib/catalogo/etichette'
import { formatDate, formatNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Richiesta' }

function etichetta(
  elenco: readonly { valore: string; etichetta: string }[],
  valore: string | null,
): string | null {
  if (!valore) return null
  return elenco.find((voce) => voce.valore === valore)?.etichetta ?? valore
}

export default async function PaginaRichiesta({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const richiesta = await richiestaCompleta(id)
  if (!richiesta) notFound()

  const proposta = richiesta.proposals[0]
  const voci: VoceEditor[] = (proposta?.items ?? []).map((voce) => ({
    variantId: voce.variantId,
    etichetta: `${voce.variant.product.name} · ${formatNumber(Number.parseFloat(voce.variant.heightCm), 0)} cm · ${ETICHETTE_FINITURA[voce.variant.finish]}`,
    prezzoCents: voce.variant.priceCents || voce.variant.product.basePriceCents,
    quantita: voce.quantity,
    nota: voce.note ?? '',
  }))

  const misure =
    richiesta.widthM && richiesta.depthM
      ? `${formatNumber(Number.parseFloat(richiesta.widthM))} × ${formatNumber(Number.parseFloat(richiesta.depthM))} m`
      : null

  return (
    <div className="space-y-10">
      <TitoloAdmin
        titolo={richiesta.name}
        sottotitolo={`Arrivata il ${formatDate(richiesta.createdAt)}`}
        azione={<Stato stato={richiesta.status} />}
      />

      <div className="grid gap-8 lg:grid-cols-[20rem_1fr] lg:gap-12">
        <aside className="space-y-6">
          {richiesta.photos.length > 0 ? (
            <section>
              <h2 className="occhiello">Le sue foto</h2>
              <ul className="mt-3 grid grid-cols-2 gap-2">
                {richiesta.photos.map((foto, indice) => (
                  <li key={foto.id}>
                    <a href={foto.url} target="_blank" rel="noreferrer noopener">
                      <span className="bg-tufo relative block aspect-square overflow-hidden">
                        <Image
                          src={foto.url}
                          alt={`Foto ${indice + 1} inviata da ${richiesta.name}`}
                          fill
                          sizes="200px"
                          className="object-cover transition-opacity duration-300 hover:opacity-85"
                        />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <Scheda>
              <p className="text-testo-tenue text-sm">Non ha mandato foto.</p>
            </Scheda>
          )}

          <section>
            <h2 className="occhiello">Cosa ha detto</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Voce etichetta="Spazio" valore={etichetta(TIPI_SPAZIO, richiesta.spaceType)} />
              <Voce etichetta="Misure" valore={misure} />
              <Voce etichetta="Luce" valore={etichetta(ESPOSIZIONI, richiesta.exposure)} />
              <Voce etichetta="Stile" valore={etichetta(STILI, richiesta.styleWanted)} />
              <Voce etichetta="Budget" valore={etichetta(FASCE_BUDGET, richiesta.budgetRange)} />
              <Voce
                etichetta="Dove"
                valore={[richiesta.city, richiesta.postalCode].filter(Boolean).join(' ') || null}
              />
            </dl>

            {richiesta.freeNotes ? (
              <blockquote className="border-cemento mt-4 border-l-2 pl-4 text-sm leading-relaxed">
                {richiesta.freeNotes}
              </blockquote>
            ) : null}
          </section>

          <section>
            <h2 className="occhiello">Contatti</h2>
            <p className="mt-3 text-sm">
              <a
                href={`mailto:${richiesta.email}`}
                className="hover:text-terracotta underline underline-offset-4"
              >
                {richiesta.email}
              </a>
              {richiesta.phone ? (
                <>
                  <br />
                  <a href={`tel:${richiesta.phone}`} className="underline underline-offset-4">
                    {richiesta.phone}
                  </a>
                </>
              ) : null}
            </p>
            <p className="text-testo-tenue mt-2 text-xs">
              {richiesta.marketingConsent
                ? 'Ha dato il consenso anche per le novità.'
                : 'Solo per questa richiesta: niente newsletter.'}
            </p>
          </section>

          <section>
            <h2 className="occhiello">Stato</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['new', 'in_progress', 'sent', 'converted', 'expired'] as const)
                .filter((stato) => stato !== richiesta.status)
                .map((stato) => (
                  <Azione
                    key={stato}
                    esegui={async () => {
                      'use server'
                      return cambiaStatoRichiesta(richiesta.id, stato)
                    }}
                  >
                    Segna {etichettaStato(stato)}
                  </Azione>
                ))}
            </div>
          </section>

          <NotaInterna
            valoreIniziale={richiesta.internalNotes ?? ''}
            salva={async (nota: string) => {
              'use server'
              return salvaNotaRichiesta(richiesta.id, nota)
            }}
          />
        </aside>

        <section>
          <h2 className="occhiello">La proposta</h2>
          <p className="text-testo-tenue mt-2 text-sm">
            {proposta?.publishedAt
              ? `Inviata il ${formatDate(proposta.publishedAt)}. Se la reinvii, la scadenza riparte da oggi.`
              : 'Non ancora inviata. Puoi salvarla come bozza e riprenderla domani.'}
          </p>

          <div className="mt-6">
            <EditorProposta
              richiestaId={richiesta.id}
              token={richiesta.publicToken}
              messaggioIniziale={proposta?.artisanMessage ?? ''}
              renderIniziale={proposta?.renderImageUrl ?? ''}
              vociIniziali={voci}
              giaInviata={Boolean(proposta?.publishedAt)}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

function Voce({ etichetta, valore }: { etichetta: string; valore: string | null }) {
  if (!valore) return null
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-testo-tenue">{etichetta}</dt>
      <dd className="text-right">{valore}</dd>
    </div>
  )
}

function etichettaStato(stato: string): string {
  const mappa: Record<string, string> = {
    new: 'nuova',
    in_progress: 'in lavorazione',
    sent: 'inviata',
    converted: 'convertita',
    expired: 'scaduta',
  }
  return mappa[stato] ?? stato
}
