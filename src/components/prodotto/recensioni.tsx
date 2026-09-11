import Image from 'next/image'
import { Star } from 'lucide-react'
import type { AggregatoRecensioni, RecensionePubblica } from '@/db/queries/prodotti'
import { formatDate } from '@/lib/utils'

export function Recensioni({
  recensioni,
  aggregato,
}: {
  recensioni: RecensionePubblica[]
  aggregato: AggregatoRecensioni | null
}) {
  if (recensioni.length === 0) return null

  return (
    <section aria-labelledby="titolo-recensioni">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="titolo-recensioni" className="font-display text-3xl font-light md:text-4xl">
          Chi l’ha preso
        </h2>
        {aggregato ? (
          <p className="text-testo-tenue flex items-center gap-2 text-sm">
            <Stelle voto={Math.round(aggregato.media)} />
            <span className="tabular-nums">
              {aggregato.media.toLocaleString('it-IT', { minimumFractionDigits: 1 })} su{' '}
              {aggregato.numero} {aggregato.numero === 1 ? 'recensione' : 'recensioni'}
            </span>
          </p>
        ) : null}
      </div>

      <ul className="mt-10 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
        {recensioni.map((recensione) => (
          <li key={recensione.id} className="border-bordo border-t pt-6">
            {recensione.fotoUrl ? (
              <div className="bg-tufo relative mb-5 aspect-4/3 w-full overflow-hidden">
                <Image
                  src={recensione.fotoUrl}
                  alt={`Foto inviata da ${recensione.nome}`}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
            <Stelle voto={recensione.voto} />
            {recensione.testo ? (
              <blockquote className="mt-3 text-sm leading-relaxed">{recensione.testo}</blockquote>
            ) : null}
            <p className="text-testo-tenue mt-4 text-xs">
              {recensione.nome} · {formatDate(recensione.creataIl)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Stelle({ voto }: { voto: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${voto} stelle su 5`}>
      {[1, 2, 3, 4, 5].map((posizione) => (
        <Star
          key={posizione}
          aria-hidden
          className={
            posizione <= voto ? 'fill-terracotta text-terracotta size-4' : 'text-cemento size-4'
          }
        />
      ))}
    </span>
  )
}
