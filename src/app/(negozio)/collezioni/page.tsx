import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { elencoCollezioni } from '@/db/queries/collezioni'
import { Briciole } from '@/components/layout/briciole'
import { BloccoProgetto } from '@/components/catalogo/blocco-progetto'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Collezioni',
  description:
    'Tre famiglie di forme, tutte nate dalla ceramica etrusca: buccheri neri, olle da terrazzo, cippi verticali. Cemento colato a mano a Cerveteri.',
  alternates: { canonical: '/collezioni' },
}

export default async function PaginaCollezioni() {
  const collezioni = await elencoCollezioni()

  return (
    <>
      <div className="contenitore pt-8">
        <Briciole voci={[{ etichetta: 'Collezioni' }]} />
      </div>

      <section className="contenitore py-12 md:py-20">
        <h1 className="font-display max-w-3xl text-4xl font-light md:text-6xl">
          Tre famiglie di forme, una sola materia.
        </h1>
        <p className="text-testo-tenue mt-6 max-w-xl text-base leading-relaxed">
          Qui troverai a breve le mie prossime sculture: pezzi inediti ispirati alla Necropoli, che
          arrivano a casa tua attraverso il mio artigianato vero.
        </p>
      </section>

      <div className="contenitore">
        <ul className="grid gap-12 md:gap-16">
          {collezioni.map((collezione, indice) => (
            <li key={collezione.id}>
              <Link
                href={`/collezioni/${collezione.slug}`}
                className="group grid items-center gap-8 md:grid-cols-2 md:gap-14"
              >
                <div className="bg-tufo relative aspect-4/3 w-full overflow-hidden md:aspect-3/2">
                  {collezione.heroImageUrl ? (
                    <Image
                      src={collezione.heroImageUrl}
                      alt={`Collezione ${collezione.name}`}
                      fill
                      priority={indice === 0}
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 md:group-hover:scale-[1.02]"
                    />
                  ) : null}
                </div>

                <div className={indice % 2 === 1 ? 'md:order-first' : undefined}>
                  <p className="occhiello">
                    {collezione.numeroProdotti}{' '}
                    {collezione.numeroProdotti === 1 ? 'pezzo' : 'pezzi'}
                  </p>
                  <h2 className="font-display group-hover:text-terracotta mt-4 text-3xl font-light transition-colors duration-300 md:text-5xl">
                    {collezione.name}
                  </h2>
                  <p className="text-testo-tenue mt-5 max-w-md text-base leading-relaxed">
                    {collezione.description}
                  </p>
                  <span className="border-antracite group-hover:border-terracotta group-hover:text-terracotta mt-7 inline-block border-b pb-1 text-sm transition-colors duration-300">
                    Guarda i pezzi
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="contenitore mt-(--spacing-sezione)">
        <BloccoProgetto />
      </div>
    </>
  )
}
