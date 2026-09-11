'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ImmagineGalleria = {
  id: string
  url: string
  alt: string
  tipo: string
  variantId: string | null
}

const ETICHETTE_TIPO: Record<string, string> = {
  studio: 'In studio',
  ambientata: 'In casa',
  dettaglio: 'Dettaglio',
  scala: 'Proporzioni',
  video: 'Video',
}

export function Galleria({
  immagini,
  nomeProdotto,
  variantIdSelezionata,
}: {
  immagini: ImmagineGalleria[]
  nomeProdotto: string
  variantIdSelezionata: string | null
}) {
  // Le foto della variante scelta vengono prima: se cambio finitura voglio vederla.
  const ordinate = [
    ...immagini.filter((immagine) => immagine.variantId === variantIdSelezionata),
    ...immagini.filter((immagine) => immagine.variantId !== variantIdSelezionata),
  ]

  const [indice, setIndice] = useState(0)
  const [ingrandita, setIngrandita] = useState(false)

  useEffect(() => {
    setIndice(0)
  }, [variantIdSelezionata])

  const totale = ordinate.length
  const corrente = ordinate[Math.min(indice, totale - 1)]

  const precedente = useCallback(
    () => setIndice((valore) => (valore - 1 + totale) % totale),
    [totale],
  )
  const successiva = useCallback(() => setIndice((valore) => (valore + 1) % totale), [totale])

  useEffect(() => {
    if (!ingrandita) return
    function tasti(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setIngrandita(false)
      if (evento.key === 'ArrowLeft') precedente()
      if (evento.key === 'ArrowRight') successiva()
    }
    window.addEventListener('keydown', tasti)
    return () => window.removeEventListener('keydown', tasti)
  }, [ingrandita, precedente, successiva])

  if (!corrente) {
    return <div className="bg-tufo aspect-4/5 w-full" aria-hidden />
  }

  return (
    <div className="md:flex md:gap-5">
      {/* Su desktop le miniature stanno di lato; su telefono sotto, scorrevoli. */}
      <ul className="order-first mt-3 flex gap-3 overflow-x-auto pb-1 md:mt-0 md:w-20 md:shrink-0 md:flex-col md:overflow-visible md:pb-0">
        {ordinate.map((immagine, posizione) => (
          <li key={immagine.id} className="shrink-0">
            <button
              type="button"
              onClick={() => setIndice(posizione)}
              aria-label={`Guarda: ${immagine.alt}`}
              aria-current={posizione === indice}
              className={cn(
                'relative block size-16 overflow-hidden border transition-colors duration-300 md:size-20',
                posizione === indice
                  ? 'border-antracite'
                  : 'hover:border-cemento border-transparent',
              )}
            >
              <Image src={immagine.url} alt="" fill sizes="80px" className="object-cover" />
              {immagine.tipo === 'video' ? (
                <span className="bg-antracite/30 text-calce absolute inset-0 flex items-center justify-center text-[0.6rem] tracking-wider uppercase">
                  Video
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <div className="relative flex-1">
        <div className="bg-tufo relative aspect-4/5 w-full overflow-hidden">
          {corrente.tipo === 'video' ? (
            <video
              src={corrente.url}
              controls
              playsInline
              preload="none"
              className="size-full object-cover"
              aria-label={corrente.alt}
            />
          ) : (
            <>
              <Image
                src={corrente.url}
                alt={corrente.alt}
                fill
                priority={indice === 0}
                sizes="(min-width: 1280px) 45vw, (min-width: 768px) 55vw, 100vw"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setIngrandita(true)}
                className="bg-calce/90 text-antracite hover:bg-calce absolute right-3 bottom-3 p-2.5 transition-colors duration-300"
                aria-label="Ingrandisci la foto"
              >
                <ZoomIn className="size-5" />
              </button>
            </>
          )}

          {corrente.tipo !== 'video' && ETICHETTE_TIPO[corrente.tipo] ? (
            <span className="bg-calce/90 text-testo-tenue absolute top-0 left-0 px-2.5 py-1.5 text-[0.7rem] tracking-[0.14em] uppercase">
              {ETICHETTE_TIPO[corrente.tipo]}
            </span>
          ) : null}
        </div>

        {totale > 1 ? (
          <div className="mt-3 flex items-center justify-between md:hidden">
            <button
              type="button"
              onClick={precedente}
              className="text-testo-tenue p-2"
              aria-label="Foto precedente"
            >
              <ChevronLeft className="size-5" />
            </button>
            <p className="text-testo-tenue text-xs tabular-nums">
              {indice + 1} / {totale}
            </p>
            <button
              type="button"
              onClick={successiva}
              className="text-testo-tenue p-2"
              aria-label="Foto successiva"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        ) : null}
      </div>

      {ingrandita ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${nomeProdotto}: foto ingrandita`}
          className="bg-antracite/95 fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            onClick={() => setIngrandita(false)}
            className="text-calce absolute top-4 right-4 p-3"
            aria-label="Chiudi"
            autoFocus
          >
            <X className="size-6" />
          </button>
          <div className="relative size-full max-h-[90vh] max-w-5xl">
            <Image
              src={corrente.url}
              alt={corrente.alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {totale > 1 ? (
            <>
              <button
                type="button"
                onClick={precedente}
                className="text-calce absolute left-2 p-4"
                aria-label="Foto precedente"
              >
                <ChevronLeft className="size-7" />
              </button>
              <button
                type="button"
                onClick={successiva}
                className="text-calce absolute right-2 p-4"
                aria-label="Foto successiva"
              >
                <ChevronRight className="size-7" />
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
