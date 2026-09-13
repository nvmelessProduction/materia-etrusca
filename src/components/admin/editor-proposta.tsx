'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { GripVertical, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  cercaPezzi,
  inviaProposta,
  salvaProposta,
  type VariantePerProposta,
} from '@/lib/admin/azioni'
import { ETICHETTE_FINITURA } from '@/lib/catalogo/etichette'
import type { Finitura } from '@/db/schema'
import { formatNumber, formatPrice } from '@/lib/utils'

export type VoceEditor = {
  variantId: string
  etichetta: string
  prezzoCents: number
  quantita: number
  nota: string
}

export function EditorProposta({
  richiestaId,
  token,
  messaggioIniziale,
  renderIniziale,
  vociIniziali,
  giaInviata,
}: {
  richiestaId: string
  token: string
  messaggioIniziale: string
  renderIniziale: string
  vociIniziali: VoceEditor[]
  giaInviata: boolean
}) {
  const [messaggio, setMessaggio] = useState(messaggioIniziale)
  const [render, setRender] = useState(renderIniziale)
  const [voci, setVoci] = useState<VoceEditor[]>(vociIniziali)
  const [ricerca, setRicerca] = useState('')
  const [risultati, setRisultati] = useState<VariantePerProposta[]>([])
  const [inRicerca, avviaRicerca] = useTransition()
  const [inSalvataggio, avviaSalvataggio] = useTransition()

  const stimaCents = voci.reduce((somma, voce) => somma + voce.prezzoCents * voce.quantita, 0)

  function cerca(testo: string) {
    setRicerca(testo)
    if (testo.trim().length < 2) {
      setRisultati([])
      return
    }
    avviaRicerca(async () => setRisultati(await cercaPezzi(testo)))
  }

  function aggiungi(variante: VariantePerProposta) {
    if (voci.some((voce) => voce.variantId === variante.variantId)) {
      toast('Questo pezzo c’è già nella proposta.')
      return
    }
    setVoci((precedenti) => [
      ...precedenti,
      {
        variantId: variante.variantId,
        etichetta: `${variante.nome} · ${formatNumber(variante.altezzaCm, 0)} cm · ${ETICHETTE_FINITURA[variante.finitura as Finitura] ?? variante.finitura}`,
        prezzoCents: variante.prezzoCents,
        quantita: 1,
        nota: '',
      },
    ])
    setRicerca('')
    setRisultati([])
  }

  function aggiorna(variantId: string, modifiche: Partial<VoceEditor>) {
    setVoci((precedenti) =>
      precedenti.map((voce) => (voce.variantId === variantId ? { ...voce, ...modifiche } : voce)),
    )
  }

  function sposta(indice: number, direzione: -1 | 1) {
    setVoci((precedenti) => {
      const prossimo = indice + direzione
      if (prossimo < 0 || prossimo >= precedenti.length) return precedenti
      const copia = [...precedenti]
      const [voce] = copia.splice(indice, 1)
      if (voce) copia.splice(prossimo, 0, voce)
      return copia
    })
  }

  function dati() {
    return {
      richiestaId,
      renderUrl: render,
      messaggio,
      voci: voci.map((voce) => ({
        variantId: voce.variantId,
        quantita: voce.quantita,
        nota: voce.nota,
      })),
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <Label htmlFor="render">Foto della proposta</Label>
        <p className="text-testo-tenue mt-1.5 text-sm">
          Il fotomontaggio o lo scatto che fa capire come verrebbe. Incolla l’indirizzo della
          immagine.
        </p>
        <Input
          id="render"
          value={render}
          onChange={(evento) => setRender(evento.target.value)}
          placeholder="https://…"
          className="mt-3"
        />
      </div>

      <div>
        <Label htmlFor="messaggio">Cosa gli scrivi</Label>
        <p className="text-testo-tenue mt-1.5 text-sm">
          È la parte che conta. Spiega perché proprio quei pezzi: la luce, le proporzioni, il
          pavimento. Parla in prima persona, come faresti in laboratorio.
        </p>
        <Textarea
          id="messaggio"
          rows={10}
          value={messaggio}
          onChange={(evento) => setMessaggio(evento.target.value)}
          className="mt-3"
        />
        <p className="text-testo-tenue mt-2 text-xs">
          {messaggio.trim().length} caratteri. Sotto i venti non lo mando.
        </p>
      </div>

      <div>
        <Label htmlFor="ricerca-pezzi">Aggiungi i pezzi</Label>
        <div className="relative mt-3">
          <Search
            aria-hidden
            className="text-testo-tenue pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            id="ricerca-pezzi"
            value={ricerca}
            onChange={(evento) => cerca(evento.target.value)}
            placeholder="Cerca per nome o SKU…"
            className="pl-9"
            autoComplete="off"
          />
        </div>

        {inRicerca ? <p className="text-testo-tenue mt-2 text-sm">Cerco…</p> : null}

        {risultati.length > 0 ? (
          <ul className="divide-bordo border-bordo bg-calce mt-2 max-h-72 divide-y overflow-y-auto border">
            {risultati.map((variante) => (
              <li key={variante.variantId}>
                <button
                  type="button"
                  onClick={() => aggiungi(variante)}
                  className="hover:bg-tufo flex w-full items-center justify-between gap-4 p-3 text-left transition-colors duration-300"
                >
                  <span className="min-w-0">
                    <span className="block text-sm">
                      {variante.nome} · {formatNumber(variante.altezzaCm, 0)} cm ·{' '}
                      {ETICHETTE_FINITURA[variante.finitura as Finitura] ?? variante.finitura}
                    </span>
                    <span className="text-testo-tenue block text-xs">
                      {variante.sku} ·{' '}
                      {variante.giacenza > 0
                        ? `${variante.giacenza} in magazzino`
                        : variante.suOrdinazione
                          ? 'su ordinazione'
                          : 'esaurito'}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm tabular-nums">
                    {formatPrice(variante.prezzoCents)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {voci.length > 0 ? (
        <ul className="space-y-3">
          {voci.map((voce, indice) => (
            <li key={voce.variantId} className="border-bordo bg-calce border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => sposta(indice, -1)}
                      disabled={indice === 0}
                      className="text-testo-tenue p-0.5 disabled:opacity-30"
                      aria-label="Sposta sopra"
                    >
                      ▲
                    </button>
                    <GripVertical aria-hidden className="text-cemento size-3" />
                    <button
                      type="button"
                      onClick={() => sposta(indice, 1)}
                      disabled={indice === voci.length - 1}
                      className="text-testo-tenue p-0.5 disabled:opacity-30"
                      aria-label="Sposta sotto"
                    >
                      ▼
                    </button>
                  </div>
                  <p className="min-w-0 text-sm font-medium">{voce.etichetta}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={voce.quantita}
                    onChange={(evento) =>
                      aggiorna(voce.variantId, {
                        quantita: Math.max(1, Number.parseInt(evento.target.value, 10) || 1),
                      })
                    }
                    className="h-10 w-16 text-center"
                    aria-label="Quantità"
                  />
                  <span className="text-sm tabular-nums">
                    {formatPrice(voce.prezzoCents * voce.quantita)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setVoci((precedenti) =>
                        precedenti.filter((altra) => altra.variantId !== voce.variantId),
                      )
                    }
                    className="text-testo-tenue hover:text-errore p-1.5 transition-colors duration-300"
                    aria-label="Togli dalla proposta"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              <Textarea
                rows={2}
                value={voce.nota}
                onChange={(evento) => aggiorna(voce.variantId, { nota: evento.target.value })}
                placeholder="Perché questo pezzo, in una riga. Il cliente la legge."
                className="mt-3 text-sm"
                aria-label={`Nota per ${voce.etichetta}`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-cemento text-testo-tenue border border-dashed p-6 text-center text-sm">
          Nessun pezzo ancora. Due o tre bastano: una lista lunga non aiuta a decidere.
        </p>
      )}

      <div className="border-bordo flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <div>
          <p className="occhiello">Stima</p>
          <p className="font-display mt-1 text-3xl font-light tabular-nums">
            {formatPrice(stimaCents)}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {giaInviata ? (
            <Button asChild variant="fantasma" size="sm">
              <Link href={`/progetto/${token}`} target="_blank">
                Vedi la pagina
              </Link>
            </Button>
          ) : null}

          <Button
            variant="secondario"
            disabled={inSalvataggio}
            onClick={() =>
              avviaSalvataggio(async () => {
                const esito = await salvaProposta(dati())
                if (esito.ok) toast.success(esito.messaggio ?? 'Salvato.')
                else toast.error(esito.messaggio ?? 'Non ha funzionato.')
              })
            }
          >
            Salva bozza
          </Button>

          <Button
            disabled={inSalvataggio || voci.length === 0 || messaggio.trim().length < 20}
            onClick={() =>
              avviaSalvataggio(async () => {
                const esito = await inviaProposta(dati())
                if (esito.ok) toast.success(esito.messaggio ?? 'Inviata.')
                else toast.error(esito.messaggio ?? 'Non ha funzionato.')
              })
            }
          >
            {giaInviata ? 'Reinvia al cliente' : 'Invia al cliente'}
          </Button>
        </div>
      </div>
    </div>
  )
}
