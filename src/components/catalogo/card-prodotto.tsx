import Image from 'next/image'
import Link from 'next/link'
import type { ProdottoVetrina } from '@/lib/catalogo/tipi'
import { Badge } from '@/components/ui/badge'
import { cn, formatNumber, formatPrice } from '@/lib/utils'

/**
 * Card di catalogo. Volutamente senza JavaScript: è il componente che
 * compare più volte nella pagina, e lo scambio di immagine al passaggio
 * del mouse si fa benissimo in CSS.
 */
export function CardProdotto({
  prodotto,
  priorita = false,
  className,
}: {
  prodotto: ProdottoVetrina
  /** Solo per le prime immagini sopra la piega: il resto è pigro. */
  priorita?: boolean
  className?: string
}) {
  const altezza =
    prodotto.altezzaMinCm === prodotto.altezzaMaxCm
      ? `${formatNumber(prodotto.altezzaMinCm, 0)} cm`
      : `${formatNumber(prodotto.altezzaMinCm, 0)}–${formatNumber(prodotto.altezzaMaxCm, 0)} cm`

  const prezzo =
    prodotto.prezzoMinCents === prodotto.prezzoMaxCents
      ? formatPrice(prodotto.prezzoMinCents)
      : `da ${formatPrice(prodotto.prezzoMinCents)}`

  return (
    <article className={cn('group', className)}>
      <Link href={`/prodotti/${prodotto.slug}`} className="block">
        <div className="bg-tufo relative aspect-4/5 w-full overflow-hidden">
          {prodotto.immagine ? (
            <Image
              src={prodotto.immagine.url}
              alt={prodotto.immagine.alt}
              fill
              priority={priorita}
              sizes="(min-width: 1280px) 24vw, (min-width: 768px) 33vw, 50vw"
              className={cn(
                'object-cover transition-opacity duration-500',
                prodotto.immagineSecondaria && 'md:group-hover:opacity-0',
              )}
            />
          ) : (
            <div className="text-testo-tenue flex size-full items-center justify-center text-sm">
              Foto in arrivo
            </div>
          )}

          {prodotto.immagineSecondaria ? (
            <Image
              src={prodotto.immagineSecondaria.url}
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 1280px) 24vw, (min-width: 768px) 33vw, 50vw"
              className="hidden object-cover opacity-0 transition-opacity duration-500 md:block md:group-hover:opacity-100"
            />
          ) : null}

          {/* L'altezza è la prima cosa che si vuole sapere: sta sulla foto. */}
          <span className="bg-calce/90 absolute bottom-0 left-0 px-2.5 py-1.5 text-xs font-medium tracking-wide">
            {altezza}
          </span>

          {prodotto.pezzoUnico ? (
            <Badge variant="pieno" className="absolute top-0 left-0">
              Pezzo unico
            </Badge>
          ) : null}

          {!prodotto.acquistabile ? (
            <span className="bg-calce/70 absolute inset-0 flex items-center justify-center text-sm font-medium tracking-[0.18em] uppercase">
              Esaurito
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h3 className="font-display text-2xl leading-tight font-light">{prodotto.nome}</h3>
          <p className="shrink-0 text-sm tabular-nums">{prezzo}</p>
        </div>

        <p className="text-testo-tenue mt-1 text-xs">
          {prodotto.collezione ? prodotto.collezione.nome : 'Fuori collezione'}
          {prodotto.suOrdinazione && !prodotto.pezzoUnico
            ? ` · su ordinazione, ${prodotto.giorniDiAttesa} giorni`
            : ''}
        </p>
      </Link>
    </article>
  )
}
