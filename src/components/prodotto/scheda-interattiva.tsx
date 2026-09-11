'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Galleria, type ImmagineGalleria } from '@/components/prodotto/galleria'
import { StimaSpedizionePezzo } from '@/components/prodotto/stima-spedizione'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCarrello } from '@/components/carrello/contesto-carrello'
import { aggiungiAlCarrello } from '@/lib/carrello/azioni'
import { ETICHETTE_FINITURA } from '@/lib/catalogo/etichette'
import type { Finitura } from '@/db/schema'
import { cn, formatNumber, formatPrice } from '@/lib/utils'

export type VarianteScheda = {
  id: string
  sku: string
  altezzaCm: number
  diametroCm: number
  pesoKg: number
  pesoImballoKg: number
  finitura: Finitura
  prezzoCents: number
  acquistabile: boolean
  quantitaMassima: number
  etichettaDisponibilita: string
  giorniDiAttesa: number
}

type Props = {
  slug: string
  nome: string
  pezzoUnico: boolean
  collezione: { slug: string; nome: string } | null
  immagini: ImmagineGalleria[]
  varianti: VarianteScheda[]
}

export function SchedaInterattiva({
  slug,
  nome,
  pezzoUnico,
  collezione,
  immagini,
  varianti,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { sincronizza, apri } = useCarrello()
  const [inCorso, avvia] = useTransition()
  const pulsante = useRef<HTMLDivElement>(null)
  const [barraVisibile, setBarraVisibile] = useState(false)

  const skuRichiesto = searchParams.get('v')
  const selezionata = useMemo(() => {
    return (
      varianti.find((variante) => variante.sku === skuRichiesto) ??
      varianti.find((variante) => variante.acquistabile) ??
      varianti[0]
    )
  }, [skuRichiesto, varianti])

  // Su mobile la barra d'acquisto compare quando il pulsante vero esce dallo schermo.
  useEffect(() => {
    const nodo = pulsante.current
    if (!nodo) return
    const osservatore = new IntersectionObserver(
      (voci) => setBarraVisibile(voci.every((voce) => !voce.isIntersecting)),
      { threshold: 0 },
    )
    osservatore.observe(nodo)
    return () => osservatore.disconnect()
  }, [])

  if (!selezionata) return null

  const altezze = [...new Set(varianti.map((variante) => variante.altezzaCm))].sort((a, b) => a - b)
  const finiturePerAltezza = varianti.filter(
    (variante) => variante.altezzaCm === selezionata.altezzaCm,
  )

  function scegli(variante: VarianteScheda) {
    const parametri = new URLSearchParams(searchParams.toString())
    parametri.set('v', variante.sku)
    // L'URL riflette la variante: un link condiviso apre esattamente questo pezzo.
    router.replace(`/prodotti/${slug}?${parametri.toString()}`, { scroll: false })
  }

  function cambiaAltezza(altezza: number) {
    const stessaFinitura = varianti.find(
      (variante) => variante.altezzaCm === altezza && variante.finitura === selezionata?.finitura,
    )
    const prima = varianti.find((variante) => variante.altezzaCm === altezza)
    const scelta = stessaFinitura ?? prima
    if (scelta) scegli(scelta)
  }

  function aggiungi() {
    const variante = selezionata
    if (!variante) return
    avvia(async () => {
      const esito = await aggiungiAlCarrello(variante.id, 1)
      sincronizza(esito.carrello)
      if (esito.ok) {
        toast.success(`${nome} è nel carrello.`, {
          action: { label: 'Vai al carrello', onClick: () => router.push('/carrello') },
        })
        if (window.matchMedia('(min-width: 1024px)').matches) apri()
      } else {
        toast.error(esito.messaggio ?? 'Non sono riuscito ad aggiungerlo.')
      }
    })
  }

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
        <Galleria immagini={immagini} nomeProdotto={nome} variantIdSelezionata={selezionata.id} />

        <div className="lg:pt-2">
          {collezione ? (
            <Link
              href={`/collezioni/${collezione.slug}`}
              className="occhiello hover:text-antracite transition-colors duration-300"
            >
              {collezione.nome}
            </Link>
          ) : null}

          <h1 className="font-display mt-4 text-4xl font-light md:text-6xl">{nome}</h1>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <p className="text-2xl tabular-nums">{formatPrice(selezionata.prezzoCents)}</p>
            {pezzoUnico ? <Badge variant="pieno">Pezzo unico</Badge> : null}
            <span
              className={cn(
                'text-sm',
                selezionata.acquistabile ? 'text-oliva' : 'text-testo-tenue',
              )}
            >
              {selezionata.etichettaDisponibilita}
            </span>
          </div>

          {/* Peso e misure a vista, senza aprire niente: è la prima domanda di tutti. */}
          <dl className="border-bordo mt-7 grid grid-cols-3 border-y">
            <Misura etichetta="Altezza" valore={`${formatNumber(selezionata.altezzaCm, 0)} cm`} />
            <Misura
              etichetta="Diametro"
              valore={`${formatNumber(selezionata.diametroCm, 0)} cm`}
              bordi
            />
            <Misura etichetta="Peso" valore={`${formatNumber(selezionata.pesoKg)} kg`} />
          </dl>

          {altezze.length > 1 ? (
            <fieldset className="mt-8">
              <legend className="occhiello">Altezza</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {altezze.map((altezza) => (
                  <button
                    key={altezza}
                    type="button"
                    onClick={() => cambiaAltezza(altezza)}
                    aria-pressed={altezza === selezionata.altezzaCm}
                    className={cn(
                      'min-w-16 border px-4 py-2.5 text-sm tabular-nums transition-colors duration-300',
                      altezza === selezionata.altezzaCm
                        ? 'border-antracite bg-antracite text-calce'
                        : 'border-bordo hover:border-antracite',
                    )}
                  >
                    {formatNumber(altezza, 0)} cm
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {finiturePerAltezza.length > 1 ? (
            <fieldset className="mt-7">
              <legend className="occhiello">Finitura</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {finiturePerAltezza.map((variante) => (
                  <button
                    key={variante.id}
                    type="button"
                    onClick={() => scegli(variante)}
                    aria-pressed={variante.id === selezionata.id}
                    className={cn(
                      'border px-4 py-2.5 text-left text-sm transition-colors duration-300',
                      variante.id === selezionata.id
                        ? 'border-antracite bg-antracite text-calce'
                        : 'border-bordo hover:border-antracite',
                      !variante.acquistabile && 'opacity-50',
                    )}
                  >
                    <span className="block">{ETICHETTE_FINITURA[variante.finitura]}</span>
                    {variante.prezzoCents !== selezionata.prezzoCents ? (
                      <span className="block text-xs tabular-nums opacity-80">
                        {formatPrice(variante.prezzoCents)}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div ref={pulsante} className="mt-9">
            <Button
              className="w-full"
              size="lg"
              onClick={aggiungi}
              disabled={!selezionata.acquistabile || inCorso}
            >
              {!selezionata.acquistabile
                ? 'Non disponibile'
                : inCorso
                  ? 'Aggiungo…'
                  : 'Aggiungi al carrello'}
            </Button>
          </div>

          {/* La frase sulle imperfezioni sta qui, in chiaro, non nascosta in un accordion. */}
          <p className="text-testo-tenue mt-6 text-sm leading-relaxed">
            Ogni pezzo è colato e rifinito a mano: le piccole variazioni sono la firma, non un
            difetto.
          </p>

          <div className="mt-8">
            <StimaSpedizionePezzo
              variantId={selezionata.id}
              pesoImballoKg={selezionata.pesoImballoKg}
            />
          </div>

          <div className="border-bordo mt-6 border p-5">
            <p className="text-sm font-medium">Non sei sicuro che stia bene nel tuo spazio?</p>
            <p className="text-testo-tenue mt-1.5 text-sm">
              Mandami la foto. Guardo luce e proporzioni e ti dico se questo è il pezzo giusto o se
              ne serve un altro.
            </p>
            <Link
              href="/progetto"
              className="border-antracite hover:border-terracotta hover:text-terracotta mt-4 inline-block border-b pb-0.5 text-sm transition-colors duration-300"
            >
              Mandami la foto
            </Link>
          </div>
        </div>
      </div>

      {/* Barra ancorata in basso su telefono: il prezzo e il pulsante restano sempre a portata. */}
      <div
        className={cn(
          'border-bordo bg-calce/95 fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur transition-transform duration-300 lg:hidden',
          barraVisibile ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="contenitore flex items-center gap-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{nome}</p>
            <p className="text-testo-tenue text-sm tabular-nums">
              {formatPrice(selezionata.prezzoCents)} · {formatNumber(selezionata.altezzaCm, 0)} cm
            </p>
          </div>
          <Button onClick={aggiungi} disabled={!selezionata.acquistabile || inCorso}>
            {selezionata.acquistabile ? 'Aggiungi' : 'Esaurito'}
          </Button>
        </div>
      </div>
    </>
  )
}

function Misura({
  etichetta,
  valore,
  bordi = false,
}: {
  etichetta: string
  valore: string
  bordi?: boolean
}) {
  return (
    <div className={cn('py-4 text-center', bordi && 'border-bordo border-x')}>
      <dt className="text-testo-tenue text-xs tracking-[0.14em] uppercase">{etichetta}</dt>
      <dd className="mt-1 text-lg tabular-nums">{valore}</dd>
    </div>
  )
}
