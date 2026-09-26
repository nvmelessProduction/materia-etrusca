import Image from 'next/image'
import Link from 'next/link'
import { elencoCollezioni } from '@/db/queries/collezioni'
import { prodottiInEvidenza } from '@/db/queries/prodotti'
import { esempiPrimaDopo } from '@/db/queries/contenuti'
import { CardProdotto } from '@/components/catalogo/card-prodotto'
import { BloccoProgetto } from '@/components/catalogo/blocco-progetto'
import { ModuloNewsletter } from '@/components/marketing/modulo-newsletter'
import { Button } from '@/components/ui/button'
import { DatiStrutturati } from '@/lib/seo/dati-strutturati'
import { schemaAttivitaLocale, schemaOrganizzazione } from '@/lib/seo/schemi'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [collezioni, evidenza, esempi] = await Promise.all([
    elencoCollezioni(),
    prodottiInEvidenza(4),
    esempiPrimaDopo(),
  ])

  return (
    <>
      <DatiStrutturati dati={schemaOrganizzazione()} />
      <DatiStrutturati dati={schemaAttivitaLocale()} />

      {/* Apertura: una foto grande, la frase manifesto, un solo pulsante. */}
      <section className="relative">
        <div className="bg-tufo relative aspect-4/5 w-full overflow-hidden md:aspect-21/9">
          <Image
            src="https://picsum.photos/seed/materia-etrusca-apertura/2400/1030"
            alt="Un vaso in cemento grezzo appena sformato, ancora nel laboratorio"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="bg-antracite/25 absolute inset-0" aria-hidden />
          <div className="absolute inset-0 flex items-end">
            <div className="contenitore pb-10 md:pb-16">
              <p className="occhiello text-calce/80">{site.laboratory.city}, laboratorio</p>
              <h1 className="font-display text-calce mt-5 max-w-4xl text-5xl font-light md:text-7xl lg:text-8xl">
                {site.manifesto}
              </h1>
            </div>
          </div>
        </div>

        <div className="contenitore py-12 md:py-16">
          <div className="grid gap-8 md:grid-cols-2 md:gap-16">
            <p className="text-testo-tenue max-w-xl text-lg leading-relaxed">
              Vasi-scultura ispirati alle forme etrusche, colati a due chilometri dalla necropoli
              della Banditaccia. Ogni pezzo è colato e rifinito a mano: le piccole variazioni sono
              la firma, non un difetto.
            </p>
            <div className="md:flex md:items-end md:justify-end">
              <Button asChild size="lg">
                <Link href="/collezioni">Guarda le collezioni</Link>
              </Button>
            </div>
          </div>
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

      {/* Il blocco del progetto, in fascia scura: è la funzione che regge il sito. */}
      <BloccoProgetto />

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

      {esempi.length > 0 ? (
        <section className="bg-tufo py-(--spacing-sezione)" aria-labelledby="titolo-prima-dopo">
          <div className="contenitore">
            <p className="occhiello">Com’è andata a finire</p>
            <h2
              id="titolo-prima-dopo"
              className="font-display mt-5 max-w-2xl text-3xl font-light md:text-5xl"
            >
              Foto che mi hanno mandato, e cosa ci abbiamo messo.
            </h2>

            <ul className="mt-12 space-y-16">
              {esempi.map((esempio) => (
                <li key={esempio.chiave}>
                  <div className="grid gap-3 md:grid-cols-2 md:gap-6">
                    <figure>
                      <div className="bg-cemento/30 relative aspect-4/3 w-full overflow-hidden">
                        <Image
                          src={esempio.prima}
                          alt={`${esempio.titolo}: com’era prima`}
                          fill
                          sizes="(min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                      <figcaption className="text-testo-tenue mt-2 text-xs tracking-[0.14em] uppercase">
                        Prima
                      </figcaption>
                    </figure>
                    <figure>
                      <div className="bg-cemento/30 relative aspect-4/3 w-full overflow-hidden">
                        <Image
                          src={esempio.dopo}
                          alt={`${esempio.titolo}: com’è diventato`}
                          fill
                          sizes="(min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                      <figcaption className="text-testo-tenue mt-2 text-xs tracking-[0.14em] uppercase">
                        Dopo
                      </figcaption>
                    </figure>
                  </div>
                  <p className="text-testo-tenue mt-5 max-w-2xl leading-relaxed">
                    <span className="text-antracite font-medium">{esempio.titolo}.</span>{' '}
                    {esempio.didascalia}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-14">
              <Button asChild variant="scuro" size="lg">
                <Link href="/progetto">Mandami la foto del tuo spazio</Link>
              </Button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="contenitore py-(--spacing-sezione)" aria-labelledby="titolo-laboratorio">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="bg-tufo relative aspect-4/3 w-full overflow-hidden">
            <Image
              src="https://picsum.photos/seed/laboratorio-cerveteri/1600/1200"
              alt="Il laboratorio: casseri di legno appoggiati al muro e pezzi in asciugatura"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="occhiello">Il laboratorio</p>
            <h2
              id="titolo-laboratorio"
              className="font-display mt-5 text-3xl font-light md:text-5xl"
            >
              Costruisco i casseri, colo, aspetto tre settimane.
            </h2>
            <p className="text-testo-tenue mt-6 max-w-md leading-relaxed">
              Il cemento ha bisogno dei suoi giorni per essere lavorato e fare presa. È il motivo
              per cui faccio pochi pezzi alla volta.
            </p>
            <Link
              href="/storia"
              className="border-antracite hover:border-terracotta hover:text-terracotta mt-8 inline-block border-b pb-0.5 text-sm transition-colors duration-300"
            >
              Come ho cominciato
            </Link>
          </div>
        </div>
      </section>

      <section className="contenitore pb-(--spacing-sezione)" aria-label="Resta in contatto">
        <div className="border-bordo border-t pt-12">
          <ModuloNewsletter idPrefisso="home-newsletter" />
        </div>
      </section>
    </>
  )
}
