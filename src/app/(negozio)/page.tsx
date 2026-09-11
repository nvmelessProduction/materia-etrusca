import Image from 'next/image'
import Link from 'next/link'
import { elencoCollezioni } from '@/db/queries/collezioni'
import { prodottiInEvidenza } from '@/db/queries/prodotti'
import { CardProdotto } from '@/components/catalogo/card-prodotto'
import { BloccoProgetto } from '@/components/catalogo/blocco-progetto'
import { Button } from '@/components/ui/button'
import { DatiStrutturati } from '@/lib/seo/dati-strutturati'
import { schemaAttivitaLocale, schemaOrganizzazione } from '@/lib/seo/schemi'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [collezioni, evidenza] = await Promise.all([elencoCollezioni(), prodottiInEvidenza(4)])

  return (
    <>
      <DatiStrutturati dati={schemaOrganizzazione()} />
      <DatiStrutturati dati={schemaAttivitaLocale()} />

      <section className="contenitore py-20 md:py-32">
        <p className="occhiello">Cerveteri, laboratorio</p>
        <h1 className="font-display mt-6 max-w-4xl text-5xl font-light md:text-7xl lg:text-8xl">
          {site.manifesto}
        </h1>
        <p className="text-testo-tenue mt-8 max-w-xl text-lg leading-relaxed">
          Vasi-scultura ispirati alle forme etrusche. Ogni pezzo è colato e rifinito a mano: le
          piccole variazioni sono la firma, non un difetto.
        </p>
        <div className="mt-12">
          <Button asChild size="lg">
            <Link href="/collezioni">Guarda le collezioni</Link>
          </Button>
        </div>
      </section>

      <section className="contenitore pb-(--spacing-sezione)" aria-labelledby="titolo-collezioni">
        <h2 id="titolo-collezioni" className="occhiello">
          Le collezioni
        </h2>
        <ul className="mt-8 grid gap-8 md:grid-cols-3 md:gap-6">
          {collezioni.map((collezione) => (
            <li key={collezione.id}>
              <Link href={`/collezioni/${collezione.slug}`} className="group block">
                <div className="bg-tufo relative aspect-3/4 w-full overflow-hidden">
                  {collezione.heroImageUrl ? (
                    <Image
                      src={collezione.heroImageUrl}
                      alt={`Collezione ${collezione.name}`}
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 md:group-hover:scale-[1.02]"
                    />
                  ) : null}
                </div>
                <h3 className="font-display group-hover:text-terracotta mt-5 text-3xl font-light transition-colors duration-300">
                  {collezione.name}
                </h3>
                <p className="text-testo-tenue mt-2 max-w-sm text-sm leading-relaxed">
                  {collezione.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="contenitore">
        <BloccoProgetto />
      </div>

      {evidenza.length > 0 ? (
        <section className="contenitore py-(--spacing-sezione)" aria-labelledby="titolo-evidenza">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="titolo-evidenza" className="font-display text-3xl font-light md:text-4xl">
              Usciti dal cassero da poco
            </h2>
            <Link
              href="/collezioni"
              className="border-antracite hover:border-terracotta hover:text-terracotta border-b pb-0.5 text-sm transition-colors duration-300"
            >
              Guarda tutto
            </Link>
          </div>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
            {evidenza.map((prodotto) => (
              <li key={prodotto.id}>
                <CardProdotto prodotto={prodotto} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  )
}
