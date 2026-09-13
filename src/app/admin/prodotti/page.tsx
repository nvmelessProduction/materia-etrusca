import Image from 'next/image'
import Link from 'next/link'
import { elencoProdottiAdmin } from '@/db/queries/admin'
import { Scheda, Stato, TitoloAdmin } from '@/components/admin/guscio'
import { Azione } from '@/components/admin/azione'
import { Button } from '@/components/ui/button'
import { duplicaProdotto } from '@/lib/admin/azioni'
import { formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Prodotti' }

export default async function PaginaProdotti() {
  const prodotti = await elencoProdottiAdmin()

  return (
    <div className="space-y-8">
      <TitoloAdmin
        titolo="Prodotti"
        sottotitolo="Quello che c’è in vetrina e quello che sta ancora in bozza."
        azione={
          <Button asChild size="sm">
            <Link href="/admin/prodotti/nuovo">Nuovo pezzo</Link>
          </Button>
        }
      />

      <ul className="space-y-3">
        {prodotti.map((prodotto) => (
          <li key={prodotto.id}>
            <Scheda className="flex items-start gap-4">
              <Link
                href={`/admin/prodotti/${prodotto.id}`}
                className="bg-tufo relative size-16 shrink-0 overflow-hidden"
              >
                {prodotto.copertina ? (
                  <Image
                    src={prodotto.copertina}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link href={`/admin/prodotti/${prodotto.id}`} className="min-w-0">
                    <p className="font-medium">{prodotto.nome}</p>
                    <p className="text-testo-tenue mt-1 text-xs">
                      {prodotto.collezione ?? 'Fuori collezione'} · {prodotto.varianti}{' '}
                      {prodotto.varianti === 1 ? 'variante' : 'varianti'} ·{' '}
                      {formatPrice(prodotto.prezzoMin)}
                    </p>
                  </Link>
                  <Stato stato={prodotto.stato} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <span
                    className={
                      prodotto.giacenza === 0 && !prodotto.suOrdinazione
                        ? 'text-errore text-xs'
                        : 'text-testo-tenue text-xs'
                    }
                  >
                    {prodotto.suOrdinazione
                      ? 'Su ordinazione'
                      : prodotto.giacenza === 0
                        ? 'Esaurito'
                        : `${prodotto.giacenza} in magazzino`}
                  </span>
                  <Azione
                    esegui={async () => {
                      'use server'
                      return duplicaProdotto(prodotto.id)
                    }}
                  >
                    Duplica
                  </Azione>
                  <Link
                    href={`/prodotti/${prodotto.slug}`}
                    target="_blank"
                    className="text-testo-tenue text-xs underline underline-offset-4"
                  >
                    Vedi in vetrina
                  </Link>
                </div>
              </div>
            </Scheda>
          </li>
        ))}
      </ul>
    </div>
  )
}
