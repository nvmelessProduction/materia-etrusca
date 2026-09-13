import Image from 'next/image'
import Link from 'next/link'
import { codaProgetti } from '@/db/queries/admin'
import { Scheda, Stato, TitoloAdmin } from '@/components/admin/guscio'
import { formatDate } from '@/lib/utils'
import type { StatoRichiesta } from '@/db/schema'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Progetti' }

const FILTRI: { valore: StatoRichiesta | 'tutte'; etichetta: string }[] = [
  { valore: 'tutte', etichetta: 'Tutte' },
  { valore: 'new', etichetta: 'Nuove' },
  { valore: 'in_progress', etichetta: 'In lavorazione' },
  { valore: 'sent', etichetta: 'Inviate' },
  { valore: 'converted', etichetta: 'Convertite' },
]

export default async function PaginaProgetti({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string }>
}) {
  const { stato } = await searchParams
  const filtro = FILTRI.find((voce) => voce.valore === stato)?.valore
  const richieste = await codaProgetti(
    filtro && filtro !== 'tutte' ? (filtro as StatoRichiesta) : undefined,
  )

  return (
    <div className="space-y-8">
      <TitoloAdmin
        titolo="Richieste di progetto"
        sottotitolo="Chi ti ha mandato una foto e aspetta una risposta."
      />

      <nav aria-label="Filtra per stato">
        <ul className="flex flex-wrap gap-2">
          {FILTRI.map((voce) => {
            const attivo = (stato ?? 'tutte') === voce.valore
            return (
              <li key={voce.valore}>
                <Link
                  href={
                    voce.valore === 'tutte'
                      ? '/admin/progetti'
                      : `/admin/progetti?stato=${voce.valore}`
                  }
                  aria-current={attivo ? 'page' : undefined}
                  className={
                    attivo
                      ? 'border-antracite bg-antracite text-calce inline-block border px-3 py-1.5 text-sm'
                      : 'border-bordo bg-calce hover:border-antracite inline-block border px-3 py-1.5 text-sm transition-colors duration-300'
                  }
                >
                  {voce.etichetta}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {richieste.length === 0 ? (
        <Scheda>
          <p className="text-testo-tenue text-sm">Qui non c’è niente.</p>
        </Scheda>
      ) : (
        <ul className="space-y-3">
          {richieste.map((richiesta) => (
            <li key={richiesta.id}>
              <Scheda href={`/admin/progetti/${richiesta.id}`} className="flex gap-4">
                <div className="bg-tufo relative size-20 shrink-0 overflow-hidden md:size-24">
                  {richiesta.anteprima ? (
                    <Image
                      src={richiesta.anteprima}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="text-testo-tenue flex size-full items-center justify-center text-[0.65rem]">
                      senza foto
                    </span>
                  )}
                  {richiesta.numeroFoto > 1 ? (
                    <span className="bg-antracite text-calce absolute right-0 bottom-0 px-1.5 py-0.5 text-[0.65rem]">
                      {richiesta.numeroFoto}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{richiesta.nome}</p>
                    <Stato stato={richiesta.stato} />
                  </div>
                  <p className="text-testo-tenue mt-1 truncate text-sm">
                    {richiesta.tipoSpazio}
                    {richiesta.citta ? ` · ${richiesta.citta}` : ''}
                  </p>
                  <p className="text-testo-tenue mt-1 text-xs">{formatDate(richiesta.creataIl)}</p>
                </div>
              </Scheda>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
