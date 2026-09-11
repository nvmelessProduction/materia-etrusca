import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  aggregatoRecensioni,
  prodottiCorrelati,
  prodottoPerSlug,
  recensioniProdotto,
} from '@/db/queries/prodotti'
import { Briciole } from '@/components/layout/briciole'
import { CardProdotto } from '@/components/catalogo/card-prodotto'
import { DettagliProdotto } from '@/components/prodotto/dettagli'
import { Recensioni } from '@/components/prodotto/recensioni'
import { SchedaInterattiva, type VarianteScheda } from '@/components/prodotto/scheda-interattiva'
import { BloccoProgetto } from '@/components/catalogo/blocco-progetto'
import { DatiStrutturati } from '@/lib/seo/dati-strutturati'
import { schemaBriciole, schemaProdotto } from '@/lib/seo/schemi'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const prodotto = await prodottoPerSlug(slug)
  if (!prodotto) return {}

  const descrizione =
    prodotto.seoDescription ?? prodotto.descrizione.slice(0, 300) ?? site.shortDescription
  const immagine = prodotto.immagini[0]?.url

  return {
    title: prodotto.seoTitle ?? prodotto.nome,
    description: descrizione,
    alternates: { canonical: `/prodotti/${prodotto.slug}` },
    openGraph: {
      type: 'website',
      title: prodotto.seoTitle ?? prodotto.nome,
      description: descrizione,
      url: `/prodotti/${prodotto.slug}`,
      images: immagine ? [{ url: immagine, alt: prodotto.immagini[0]?.alt }] : undefined,
    },
  }
}

export default async function PaginaProdotto({ params, searchParams }: Props) {
  const { slug } = await params
  await searchParams

  const prodotto = await prodottoPerSlug(slug)
  if (!prodotto) notFound()

  const [recensioni, aggregato, correlati] = await Promise.all([
    recensioniProdotto(prodotto.id),
    aggregatoRecensioni(prodotto.id),
    prodottiCorrelati(prodotto.id, prodotto.collezione?.slug ?? null),
  ])

  const varianti: VarianteScheda[] = prodotto.varianti.map((variante) => ({
    id: variante.id,
    sku: variante.sku,
    altezzaCm: variante.altezzaCm,
    diametroCm: variante.diametroCm,
    pesoKg: variante.pesoKg,
    pesoImballoKg: variante.pesoImballoKg,
    finitura: variante.finitura,
    prezzoCents: variante.prezzoCentsEffettivo,
    acquistabile: variante.disponibilita.acquistabile,
    quantitaMassima: variante.disponibilita.quantitaMassima,
    etichettaDisponibilita: variante.disponibilita.etichetta,
    giorniDiAttesa: variante.disponibilita.giorniDiAttesa,
  }))

  const briciole = [
    ...(prodotto.collezione
      ? [{ nome: prodotto.collezione.nome, percorso: `/collezioni/${prodotto.collezione.slug}` }]
      : []),
    { nome: prodotto.nome, percorso: `/prodotti/${prodotto.slug}` },
  ]

  return (
    <>
      <DatiStrutturati
        dati={schemaProdotto({
          nome: prodotto.nome,
          descrizione: prodotto.seoDescription ?? prodotto.descrizione,
          slug: prodotto.slug,
          immagini: prodotto.immagini
            .filter((immagine) => immagine.tipo !== 'video')
            .map((immagine) => immagine.url),
          offerte: varianti.map((variante) => ({
            sku: variante.sku,
            prezzoCents: variante.prezzoCents,
            disponibile: variante.acquistabile,
            url: `${site.url}/prodotti/${prodotto.slug}?v=${variante.sku}`,
          })),
          recensioni: aggregato,
          collezione: prodotto.collezione?.nome ?? null,
        })}
      />
      <DatiStrutturati
        dati={schemaBriciole([{ nome: 'Collezioni', percorso: '/collezioni' }, ...briciole])}
      />

      <div className="contenitore pt-8">
        <Briciole
          voci={[
            { href: '/collezioni', etichetta: 'Collezioni' },
            ...(prodotto.collezione
              ? [
                  {
                    href: `/collezioni/${prodotto.collezione.slug}`,
                    etichetta: prodotto.collezione.nome,
                  },
                ]
              : []),
            { etichetta: prodotto.nome },
          ]}
        />
      </div>

      <div className="contenitore py-10 pb-28 md:py-14 lg:pb-14">
        <SchedaInterattiva
          slug={prodotto.slug}
          nome={prodotto.nome}
          pezzoUnico={prodotto.pezzoUnico}
          collezione={prodotto.collezione}
          immagini={prodotto.immagini}
          varianti={varianti}
        />
      </div>

      <div className="contenitore grid gap-14 pb-(--spacing-sezione) lg:grid-cols-2 lg:gap-20">
        <div>
          {prodotto.storia ? (
            <>
              <p className="occhiello">Da dove viene</p>
              <p className="font-display mt-5 text-2xl leading-snug font-light md:text-3xl">
                {prodotto.storia}
              </p>
            </>
          ) : null}
          <div className="text-testo-tenue mt-8 space-y-4 text-base leading-relaxed">
            {prodotto.descrizione
              .split('\n')
              .filter(Boolean)
              .map((paragrafo, indice) => (
                <p key={indice}>{paragrafo}</p>
              ))}
          </div>
        </div>

        <DettagliProdotto
          misure={prodotto.varianti.map((variante) => ({
            altezzaCm: variante.altezzaCm,
            diametroCm: variante.diametroCm,
            pesoKg: variante.pesoKg,
            pesoImballoKg: variante.pesoImballoKg,
            finitura: variante.finitura,
          }))}
          cura={prodotto.cura}
          interno={prodotto.interno}
          esterno={prodotto.esterno}
          resistenteGelo={prodotto.resistenteGelo}
          suOrdinazione={prodotto.suOrdinazione}
          giorniDiAttesa={prodotto.giorniDiAttesa}
        />
      </div>

      {recensioni.length > 0 ? (
        <div className="contenitore pb-(--spacing-sezione)">
          <Recensioni recensioni={recensioni} aggregato={aggregato} />
        </div>
      ) : null}

      {correlati.length > 0 ? (
        <div className="contenitore pb-(--spacing-sezione)">
          <h2 className="font-display text-3xl font-light md:text-4xl">Dalla stessa mano</h2>
          <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-4 md:gap-x-6">
            {correlati.map((correlato) => (
              <li key={correlato.id}>
                <CardProdotto prodotto={correlato} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="contenitore">
        <BloccoProgetto />
      </div>
    </>
  )
}
