import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { collezionePerSlug } from '@/db/queries/collezioni'
import { cercaProdotti, estremiCatalogo } from '@/db/queries/prodotti'
import { leggiFiltri, type ParametriGrezzi } from '@/lib/catalogo/parametri'
import { Briciole } from '@/components/layout/briciole'
import { CardProdotto } from '@/components/catalogo/card-prodotto'
import { BarraFiltri, PannelloFiltri } from '@/components/catalogo/filtri-catalogo'
import { CaricaAltri } from '@/components/catalogo/carica-altri'
import { BloccoProgetto } from '@/components/catalogo/blocco-progetto'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<ParametriGrezzi>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const collezione = await collezionePerSlug(slug)
  if (!collezione) return {}

  return {
    title: collezione.seoTitle ?? collezione.name,
    description: collezione.seoDescription ?? collezione.description ?? undefined,
    alternates: { canonical: `/collezioni/${collezione.slug}` },
    openGraph: {
      title: collezione.seoTitle ?? collezione.name,
      description: collezione.seoDescription ?? collezione.description ?? undefined,
      images: collezione.heroImageUrl ? [collezione.heroImageUrl] : undefined,
    },
  }
}

/** Dopo quante card infilare l'invito a mandare la foto. */
const POSIZIONE_INVITO = 6

export default async function PaginaCollezione({ params, searchParams }: Props) {
  const { slug } = await params
  const parametri = await searchParams

  const collezione = await collezionePerSlug(slug)
  if (!collezione) notFound()

  const filtri = leggiFiltri(parametri, slug)
  const [esito, estremi] = await Promise.all([cercaProdotti(filtri), estremiCatalogo(slug)])

  const percorsoBase = `/collezioni/${slug}`
  const prima = esito.prodotti.slice(0, POSIZIONE_INVITO)
  const dopo = esito.prodotti.slice(POSIZIONE_INVITO)

  return (
    <>
      <div className="contenitore pt-8">
        <Briciole
          voci={[{ href: '/collezioni', etichetta: 'Collezioni' }, { etichetta: collezione.name }]}
        />
      </div>

      <section className="contenitore py-10 md:py-16">
        <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end md:gap-16">
          <div>
            <h1 className="font-display text-4xl font-light md:text-6xl">{collezione.name}</h1>
            {collezione.description ? (
              <p className="text-testo-tenue mt-5 max-w-xl text-base leading-relaxed">
                {collezione.description}
              </p>
            ) : null}
          </div>
          {collezione.heroImageUrl ? (
            <div className="bg-tufo relative hidden aspect-3/2 w-80 shrink-0 overflow-hidden md:block">
              <Image
                src={collezione.heroImageUrl}
                alt=""
                aria-hidden
                fill
                sizes="320px"
                className="object-cover"
              />
            </div>
          ) : null}
        </div>
      </section>

      <div className="contenitore">
        <BarraFiltri
          filtri={filtri}
          estremi={estremi}
          percorsoBase={percorsoBase}
          totale={esito.totale}
        />

        <div className="grid gap-10 py-10 lg:grid-cols-[16rem_1fr] lg:gap-14">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <PannelloFiltri filtri={filtri} estremi={estremi} percorsoBase={percorsoBase} />
            </div>
          </aside>

          <div>
            {esito.prodotti.length === 0 ? (
              <div className="border-bordo bg-tufo border px-6 py-16 text-center">
                <p className="font-display text-2xl font-light">
                  Con questi filtri non è rimasto niente.
                </p>
                <p className="text-testo-tenue mx-auto mt-3 max-w-md text-sm">
                  Allarga l’altezza o togli una finitura. Oppure mandami la foto del tuo spazio e ti
                  dico io cosa ci starebbe.
                </p>
              </div>
            ) : (
              <>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6">
                  {prima.map((prodotto, indice) => (
                    <li key={prodotto.id}>
                      <CardProdotto prodotto={prodotto} priorita={indice < 2} />
                    </li>
                  ))}
                </ul>

                {dopo.length > 0 || esito.haAltre ? (
                  <div className="my-14">
                    <BloccoProgetto
                      variante="chiaro"
                      titolo="Non trovi la misura giusta?"
                      testo="Inviami la foto del tuo spazio: valuterò esposizione e proporzioni e ti farò vedere quali pezzi farebbero al tuo caso."
                    />
                  </div>
                ) : null}

                {dopo.length > 0 ? (
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6">
                    {dopo.map((prodotto) => (
                      <li key={prodotto.id}>
                        <CardProdotto prodotto={prodotto} />
                      </li>
                    ))}
                  </ul>
                ) : null}

                <CaricaAltri
                  collezioneSlug={slug}
                  paginaIniziale={esito.pagina}
                  haAltreIniziale={esito.haAltre}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
