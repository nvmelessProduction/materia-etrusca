'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { aggiungiImmagine, eliminaImmagine, riordinaImmagini } from '@/lib/admin/azioni'

export type ImmagineEditor = {
  id: string
  url: string
  alt: string
  tipo: string
}

const TIPI = [
  { valore: 'studio', etichetta: 'In studio' },
  { valore: 'ambientata', etichetta: 'In casa' },
  { valore: 'dettaglio', etichetta: 'Dettaglio' },
  { valore: 'scala', etichetta: 'Proporzioni' },
  { valore: 'video', etichetta: 'Video' },
] as const

export function EditorImmagini({
  productId,
  immagini,
}: {
  productId: string
  immagini: ImmagineEditor[]
}) {
  const [ordine, setOrdine] = useState(immagini)
  const [url, setUrl] = useState('')
  const [alt, setAlt] = useState('')
  const [tipo, setTipo] = useState<(typeof TIPI)[number]['valore']>('studio')
  const [inCorso, avvia] = useTransition()

  function sposta(indice: number, direzione: -1 | 1) {
    const prossimo = indice + direzione
    if (prossimo < 0 || prossimo >= ordine.length) return

    const copia = [...ordine]
    const [voce] = copia.splice(indice, 1)
    if (voce) copia.splice(prossimo, 0, voce)
    setOrdine(copia)

    avvia(async () => {
      const esito = await riordinaImmagini(
        productId,
        copia.map((immagine) => immagine.id),
      )
      if (!esito.ok) toast.error(esito.messaggio ?? 'Non ha funzionato.')
    })
  }

  return (
    <div className="space-y-6">
      {ordine.length > 0 ? (
        <ul className="space-y-2">
          {ordine.map((immagine, indice) => (
            <li
              key={immagine.id}
              className="border-bordo bg-calce flex items-center gap-3 border p-3"
            >
              <div className="bg-tufo relative size-14 shrink-0 overflow-hidden">
                {immagine.tipo === 'video' ? (
                  <span className="text-testo-tenue flex size-full items-center justify-center text-[0.6rem] uppercase">
                    video
                  </span>
                ) : (
                  <Image src={immagine.url} alt="" fill sizes="56px" className="object-cover" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{immagine.alt}</p>
                <p className="text-testo-tenue text-xs">
                  {TIPI.find((voce) => voce.valore === immagine.tipo)?.etichetta ?? immagine.tipo}
                  {indice === 0 ? ' · copertina' : ''}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => sposta(indice, -1)}
                  disabled={indice === 0 || inCorso}
                  className="text-testo-tenue p-2 disabled:opacity-30"
                  aria-label="Sposta su"
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => sposta(indice, 1)}
                  disabled={indice === ordine.length - 1 || inCorso}
                  className="text-testo-tenue p-2 disabled:opacity-30"
                  aria-label="Sposta giù"
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    avvia(async () => {
                      const esito = await eliminaImmagine(immagine.id, productId)
                      if (esito.ok) {
                        setOrdine((precedenti) =>
                          precedenti.filter((voce) => voce.id !== immagine.id),
                        )
                        toast.success(esito.messaggio ?? 'Tolta.')
                      } else toast.error(esito.messaggio ?? 'Non ha funzionato.')
                    })
                  }
                  className="text-testo-tenue hover:text-errore p-2 transition-colors duration-300"
                  aria-label="Togli la foto"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-cemento text-testo-tenue border border-dashed p-6 text-center text-sm">
          Nessuna foto. La prima diventa la copertina.
        </p>
      )}

      <div className="border-bordo bg-calce border p-4">
        <p className="text-sm font-medium">Aggiungi una foto</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="url-immagine">Indirizzo dell’immagine</Label>
            <Input
              id="url-immagine"
              value={url}
              onChange={(evento) => setUrl(evento.target.value)}
              placeholder="https://…"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="alt-immagine">Cosa si vede</Label>
            <Input
              id="alt-immagine"
              value={alt}
              onChange={(evento) => setAlt(evento.target.value)}
              placeholder="Olla in cemento grezzo su un terrazzo, accanto a un ulivo"
              className="mt-1.5"
            />
            <p className="text-testo-tenue mt-1.5 text-xs">
              Serve a chi non vede la foto. Descrivila come la racconteresti al telefono.
            </p>
          </div>
          <div>
            <Label htmlFor="tipo-immagine">Tipo</Label>
            <Select
              id="tipo-immagine"
              value={tipo}
              onChange={(evento) => setTipo(evento.target.value as (typeof TIPI)[number]['valore'])}
              className="mt-1.5"
            >
              {TIPI.map((voce) => (
                <option key={voce.valore} value={voce.valore}>
                  {voce.etichetta}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Button
          size="sm"
          className="mt-4"
          disabled={inCorso || url.trim().length < 8 || alt.trim().length < 3}
          onClick={() =>
            avvia(async () => {
              const esito = await aggiungiImmagine({ productId, url, alt, tipo })
              if (esito.ok) {
                toast.success(esito.messaggio ?? 'Aggiunta.')
                setUrl('')
                setAlt('')
              } else toast.error(esito.messaggio ?? 'Non ha funzionato.')
            })
          }
        >
          Aggiungi
        </Button>
      </div>
    </div>
  )
}
