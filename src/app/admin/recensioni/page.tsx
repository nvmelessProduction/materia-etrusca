import Image from 'next/image'
import Link from 'next/link'
import { recensioniDaApprovare } from '@/db/queries/admin'
import { Azione, AzioneConConferma } from '@/components/admin/azione'
import { Scheda, TitoloAdmin } from '@/components/admin/guscio'
import { decidiRecensione } from '@/lib/admin/azioni'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Recensioni' }

export default async function PaginaRecensioni() {
  const recensioni = await recensioniDaApprovare()
  const inAttesa = recensioni.filter((recensione) => !recensione.approvata)
  const pubblicate = recensioni.filter((recensione) => recensione.approvata)

  return (
    <div className="space-y-10">
      <TitoloAdmin
        titolo="Recensioni"
        sottotitolo="Niente compare in vetrina prima che tu l’abbia letto."
      />

      <section>
        <h2 className="occhiello">Da leggere ({inAttesa.length})</h2>
        {inAttesa.length === 0 ? (
          <Scheda className="mt-4">
            <p className="text-testo-tenue text-sm">Niente in attesa.</p>
          </Scheda>
        ) : (
          <ul className="mt-4 space-y-3">
            {inAttesa.map((recensione) => (
              <li key={recensione.id}>
                <Recensione recensione={recensione} inAttesa />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="occhiello">In vetrina ({pubblicate.length})</h2>
        <ul className="mt-4 space-y-3">
          {pubblicate.map((recensione) => (
            <li key={recensione.id}>
              <Recensione recensione={recensione} inAttesa={false} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

type RigaRecensione = Awaited<ReturnType<typeof recensioniDaApprovare>>[number]

function Recensione({ recensione, inAttesa }: { recensione: RigaRecensione; inAttesa: boolean }) {
  return (
    <Scheda className="flex gap-4">
      {recensione.fotoUrl ? (
        <div className="bg-tufo relative size-20 shrink-0 overflow-hidden">
          <Image
            src={recensione.fotoUrl}
            alt={`Foto inviata da ${recensione.nome}`}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-medium">
            {recensione.nome} · {'★'.repeat(recensione.voto)}
            <span className="text-cemento">{'★'.repeat(5 - recensione.voto)}</span>
          </p>
          <Link
            href={`/prodotti/${recensione.slug}`}
            target="_blank"
            className="text-testo-tenue text-xs underline underline-offset-4"
          >
            {recensione.prodotto}
          </Link>
        </div>

        {recensione.testo ? (
          <p className="mt-2 text-sm leading-relaxed">{recensione.testo}</p>
        ) : (
          <p className="text-testo-tenue mt-2 text-sm italic">Solo il voto, senza testo.</p>
        )}

        <p className="text-testo-tenue mt-2 text-xs">{formatDate(recensione.creataIl)}</p>

        <div className="mt-4 flex gap-2">
          {inAttesa ? (
            <Azione
              variant="scuro"
              esegui={async () => {
                'use server'
                return decidiRecensione(recensione.id, true)
              }}
            >
              Pubblica
            </Azione>
          ) : (
            <AzioneConConferma
              titolo="Togliere dalla vetrina?"
              descrizione="La recensione resta salvata, ma smette di comparire sulla scheda prodotto. Puoi rimetterla quando vuoi."
              conferma="Togli"
              esegui={async () => {
                'use server'
                return decidiRecensione(recensione.id, false)
              }}
            >
              Togli dalla vetrina
            </AzioneConConferma>
          )}
        </div>
      </div>
    </Scheda>
  )
}
