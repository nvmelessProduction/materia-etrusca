import Link from 'next/link'
import { elencoOrdini } from '@/db/queries/admin'
import { Scheda, Stato, TitoloAdmin } from '@/components/admin/guscio'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, formatPrice } from '@/lib/utils'
import type { StatoOrdine } from '@/db/schema'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Ordini' }

const FILTRI: { valore: StatoOrdine | 'tutti'; etichetta: string }[] = [
  { valore: 'tutti', etichetta: 'Tutti' },
  { valore: 'pending', etichetta: 'In attesa' },
  { valore: 'paid', etichetta: 'Da preparare' },
  { valore: 'shipped', etichetta: 'Spediti' },
  { valore: 'delivered', etichetta: 'Consegnati' },
]

export default async function PaginaOrdini({
  searchParams,
}: {
  searchParams: Promise<{ stato?: string; cerca?: string }>
}) {
  const { stato, cerca } = await searchParams
  const filtro = FILTRI.find((voce) => voce.valore === stato)?.valore
  const ordini = await elencoOrdini({
    stato: filtro && filtro !== 'tutti' ? (filtro as StatoOrdine) : undefined,
    cerca,
  })

  return (
    <div className="space-y-8">
      <TitoloAdmin
        titolo="Ordini"
        sottotitolo="Cosa è entrato, cosa è da imballare."
        azione={
          <Button asChild variant="tenue" size="sm">
            <a href="/api/admin/ordini.csv" download>
              Esporta CSV
            </a>
          </Button>
        }
      />

      <form className="flex gap-2" action="/admin/ordini">
        <Input
          name="cerca"
          defaultValue={cerca ?? ''}
          placeholder="Numero ordine o email…"
          className="max-w-xs"
          aria-label="Cerca fra gli ordini"
        />
        <Button type="submit" variant="tenue" size="sm">
          Cerca
        </Button>
      </form>

      <nav aria-label="Filtra per stato">
        <ul className="flex flex-wrap gap-2">
          {FILTRI.map((voce) => {
            const attivo = (stato ?? 'tutti') === voce.valore
            return (
              <li key={voce.valore}>
                <Link
                  href={
                    voce.valore === 'tutti' ? '/admin/ordini' : `/admin/ordini?stato=${voce.valore}`
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

      {ordini.length === 0 ? (
        <Scheda>
          <p className="text-testo-tenue text-sm">Nessun ordine qui.</p>
        </Scheda>
      ) : (
        <ul className="space-y-3">
          {ordini.map((ordine) => (
            <li key={ordine.id}>
              <Scheda href={`/admin/ordini/${ordine.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums">{ordine.orderNumber}</p>
                    <p className="text-testo-tenue mt-1 truncate text-sm">{ordine.email}</p>
                    <p className="text-testo-tenue mt-1 text-xs">
                      {formatDate(ordine.createdAt)} · {ordine.items.length}{' '}
                      {ordine.items.length === 1 ? 'pezzo' : 'pezzi'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="tabular-nums">{formatPrice(ordine.totalCents)}</span>
                    <Stato stato={ordine.status} />
                  </div>
                </div>
              </Scheda>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
