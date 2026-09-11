'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { CardProdotto } from '@/components/catalogo/card-prodotto'
import { Button } from '@/components/ui/button'
import { caricaAltriProdotti } from '@/lib/catalogo/azioni'
import type { ProdottoVetrina } from '@/lib/catalogo/tipi'

/**
 * Caricamento progressivo. Si carica da sé quando la sentinella entra nello
 * schermo, ma il pulsante resta sempre lì: senza JavaScript, con lo scorrimento
 * ridotto o se l'osservatore non parte, il catalogo deve restare navigabile.
 */
export function CaricaAltri({
  collezioneSlug,
  paginaIniziale,
  haAltreIniziale,
}: {
  collezioneSlug: string | null
  paginaIniziale: number
  haAltreIniziale: boolean
}) {
  const searchParams = useSearchParams()
  const [aggiunti, setAggiunti] = useState<ProdottoVetrina[]>([])
  const [pagina, setPagina] = useState(paginaIniziale)
  const [haAltre, setHaAltre] = useState(haAltreIniziale)
  const [errore, setErrore] = useState(false)
  const [inCorso, avvia] = useTransition()
  const sentinella = useRef<HTMLDivElement>(null)

  const chiave = searchParams.toString()

  // Cambiando i filtri si riparte dalla prima pagina, che la rende il server.
  useEffect(() => {
    setAggiunti([])
    setPagina(paginaIniziale)
    setHaAltre(haAltreIniziale)
    setErrore(false)
  }, [chiave, paginaIniziale, haAltreIniziale])

  const carica = useCallback(() => {
    if (inCorso || !haAltre) return
    avvia(async () => {
      try {
        const esito = await caricaAltriProdotti(chiave, collezioneSlug, pagina + 1)
        setAggiunti((precedenti) => [...precedenti, ...esito.prodotti])
        setPagina(esito.pagina)
        setHaAltre(esito.haAltre)
        setErrore(false)
      } catch {
        setErrore(true)
      }
    })
  }, [chiave, collezioneSlug, haAltre, inCorso, pagina])

  useEffect(() => {
    const nodo = sentinella.current
    if (!nodo || !haAltre) return

    const osservatore = new IntersectionObserver(
      (voci) => {
        if (voci.some((voce) => voce.isIntersecting)) carica()
      },
      { rootMargin: '600px 0px' },
    )

    osservatore.observe(nodo)
    return () => osservatore.disconnect()
  }, [carica, haAltre])

  return (
    <>
      {aggiunti.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-x-6 xl:grid-cols-4">
          {aggiunti.map((prodotto) => (
            <li key={prodotto.id}>
              <CardProdotto prodotto={prodotto} />
            </li>
          ))}
        </ul>
      ) : null}

      <div ref={sentinella} className="mt-14 flex justify-center">
        {haAltre ? (
          <div className="text-center">
            <Button type="button" variant="secondario" onClick={carica} disabled={inCorso}>
              {inCorso ? 'Carico…' : 'Carica altri'}
            </Button>
            {errore ? (
              <p role="alert" className="text-errore mt-3 text-sm">
                Non sono riuscito a caricare il resto. Riprova.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-testo-tenue text-sm">Hai visto tutto.</p>
        )}
      </div>
    </>
  )
}
