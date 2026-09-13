'use client'

import {
  cloneElement,
  isValidElement,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AzioneConConferma } from '@/components/admin/azione'
import { aggiornaGiacenza, archiviaVariante, salvaVariante } from '@/lib/admin/azioni'
import { ETICHETTE_FINITURA } from '@/lib/catalogo/etichette'
import type { Finitura } from '@/db/schema'
import { formatPrice } from '@/lib/utils'

export type VarianteEditor = {
  id: string
  sku: string
  altezzaCm: number
  diametroCm: number
  pesoKg: number
  finitura: Finitura
  prezzoCents: number
  giacenza: number
  pesoImballoKg: number
  volumeImballoL: number
  posizione: number
}

const FINITURE: Finitura[] = ['grezzo', 'levigato', 'ocra', 'antracite']

export function EditorVarianti({
  productId,
  varianti,
}: {
  productId: string
  varianti: VarianteEditor[]
}) {
  const [inModifica, setInModifica] = useState<string | 'nuova' | null>(null)

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {varianti.map((variante) => (
          <li key={variante.id} className="border-bordo bg-calce border p-4">
            {inModifica === variante.id ? (
              <ModuloVariante
                productId={productId}
                variante={variante}
                onChiudi={() => setInModifica(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {variante.altezzaCm} cm · {ETICHETTE_FINITURA[variante.finitura]}
                  </p>
                  <p className="text-testo-tenue mt-1 text-xs">
                    {variante.sku} · ø {variante.diametroCm} cm · {variante.pesoKg} kg ·{' '}
                    {variante.pesoImballoKg} kg imballata
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums">{formatPrice(variante.prezzoCents)}</span>
                  <GiacenzaRapida varianteId={variante.id} giacenza={variante.giacenza} />
                  <Button variant="tenue" size="sm" onClick={() => setInModifica(variante.id)}>
                    Modifica
                  </Button>
                  <AzioneConConferma
                    titolo="Archiviare questa variante?"
                    descrizione="Sparisce dalla vetrina e dal carrello. Gli ordini già fatti restano leggibili: qui non si cancella mai niente per davvero."
                    conferma="Archivia"
                    esegui={() => archiviaVariante(variante.id)}
                  >
                    Archivia
                  </AzioneConConferma>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {inModifica === 'nuova' ? (
        <div className="border-antracite bg-calce border p-4">
          <ModuloVariante productId={productId} onChiudi={() => setInModifica(null)} />
        </div>
      ) : (
        <Button variant="secondario" size="sm" onClick={() => setInModifica('nuova')}>
          Aggiungi una variante
        </Button>
      )}
    </div>
  )
}

function GiacenzaRapida({ varianteId, giacenza }: { varianteId: string; giacenza: number }) {
  const [valore, setValore] = useState(giacenza)
  const [inCorso, avvia] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor={`giacenza-${varianteId}`} className="text-testo-tenue text-xs font-normal">
        Pezzi
      </Label>
      <Input
        id={`giacenza-${varianteId}`}
        type="number"
        min={0}
        max={999}
        value={valore}
        onChange={(evento) => setValore(Math.max(0, Number.parseInt(evento.target.value, 10) || 0))}
        onBlur={() => {
          if (valore === giacenza) return
          avvia(async () => {
            const esito = await aggiornaGiacenza(varianteId, valore)
            if (esito.ok) toast.success('Giacenza aggiornata.')
            else toast.error(esito.messaggio ?? 'Non ha funzionato.')
          })
        }}
        className="h-10 w-20 text-center"
        disabled={inCorso}
      />
    </div>
  )
}

function ModuloVariante({
  productId,
  variante,
  onChiudi,
}: {
  productId: string
  variante?: VarianteEditor
  onChiudi: () => void
}) {
  const [dati, setDati] = useState({
    sku: variante?.sku ?? '',
    altezzaCm: variante?.altezzaCm ?? 40,
    diametroCm: variante?.diametroCm ?? 30,
    pesoKg: variante?.pesoKg ?? 20,
    finitura: variante?.finitura ?? ('grezzo' as Finitura),
    prezzoEuro: (variante?.prezzoCents ?? 0) / 100,
    giacenza: variante?.giacenza ?? 0,
    pesoImballoKg: variante?.pesoImballoKg ?? 0,
    volumeImballoL: variante?.volumeImballoL ?? 0,
    posizione: variante?.posizione ?? 0,
  })
  const [inCorso, avvia] = useTransition()

  function numero(valore: string): number {
    return Number.parseFloat(valore.replace(',', '.')) || 0
  }

  /** Se non lo compili tu, lo stimo: peso del pezzo più un imballo abbondante. */
  const pesoImballoStimato = Math.round((dati.pesoKg * 1.12 + 2.5) * 100) / 100

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo etichetta="SKU">
          <Input
            value={dati.sku}
            onChange={(evento) => setDati({ ...dati, sku: evento.target.value.toUpperCase() })}
            placeholder="ME-KYA-40-GRE"
          />
        </Campo>
        <Campo etichetta="Finitura">
          <Select
            value={dati.finitura}
            onChange={(evento) => setDati({ ...dati, finitura: evento.target.value as Finitura })}
          >
            {FINITURE.map((finitura) => (
              <option key={finitura} value={finitura}>
                {ETICHETTE_FINITURA[finitura]}
              </option>
            ))}
          </Select>
        </Campo>
        <Campo etichetta="Prezzo (€)">
          <Input
            inputMode="decimal"
            value={String(dati.prezzoEuro)}
            onChange={(evento) => setDati({ ...dati, prezzoEuro: numero(evento.target.value) })}
          />
        </Campo>
        <Campo etichetta="Altezza (cm)">
          <Input
            inputMode="decimal"
            value={String(dati.altezzaCm)}
            onChange={(evento) => setDati({ ...dati, altezzaCm: numero(evento.target.value) })}
          />
        </Campo>
        <Campo etichetta="Diametro (cm)">
          <Input
            inputMode="decimal"
            value={String(dati.diametroCm)}
            onChange={(evento) => setDati({ ...dati, diametroCm: numero(evento.target.value) })}
          />
        </Campo>
        <Campo etichetta="Peso (kg)">
          <Input
            inputMode="decimal"
            value={String(dati.pesoKg)}
            onChange={(evento) => setDati({ ...dati, pesoKg: numero(evento.target.value) })}
          />
        </Campo>
        <Campo etichetta="Peso imballata (kg)" nota={`stima: ${pesoImballoStimato}`}>
          <Input
            inputMode="decimal"
            value={String(dati.pesoImballoKg)}
            onChange={(evento) => setDati({ ...dati, pesoImballoKg: numero(evento.target.value) })}
          />
        </Campo>
        <Campo etichetta="Volume imballo (L)">
          <Input
            inputMode="decimal"
            value={String(dati.volumeImballoL)}
            onChange={(evento) => setDati({ ...dati, volumeImballoL: numero(evento.target.value) })}
          />
        </Campo>
        <Campo etichetta="Pezzi in magazzino">
          <Input
            type="number"
            min={0}
            value={dati.giacenza}
            onChange={(evento) =>
              setDati({
                ...dati,
                giacenza: Math.max(0, Number.parseInt(evento.target.value, 10) || 0),
              })
            }
          />
        </Campo>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          size="sm"
          disabled={inCorso || dati.sku.trim().length < 2}
          onClick={() =>
            avvia(async () => {
              const esito = await salvaVariante({
                id: variante?.id,
                productId,
                sku: dati.sku,
                altezzaCm: dati.altezzaCm,
                diametroCm: dati.diametroCm,
                pesoKg: dati.pesoKg,
                finitura: dati.finitura,
                prezzoCents: Math.round(dati.prezzoEuro * 100),
                giacenza: dati.giacenza,
                pesoImballoKg: dati.pesoImballoKg > 0 ? dati.pesoImballoKg : pesoImballoStimato,
                volumeImballoL: dati.volumeImballoL,
                posizione: dati.posizione,
              })
              if (esito.ok) {
                toast.success(esito.messaggio ?? 'Salvata.')
                onChiudi()
              } else {
                toast.error(esito.messaggio ?? 'Non ha funzionato.')
              }
            })
          }
        >
          {inCorso ? 'Salvo…' : 'Salva la variante'}
        </Button>
        <Button variant="fantasma" size="sm" onClick={onChiudi}>
          Lascia stare
        </Button>
      </div>
    </div>
  )
}

function Campo({
  etichetta,
  nota,
  children,
}: {
  etichetta: string
  nota?: string
  children: ReactNode
}) {
  const id = `variante-${slugSemplice(etichetta)}`

  // L'identificativo lo mette il contenitore: l'etichetta deve puntare
  // sempre al campo giusto, anche quando il modulo si riusa.
  const campo = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, { id })
    : children

  return (
    <div>
      <Label htmlFor={id} className="text-testo-tenue text-xs">
        {etichetta}
      </Label>
      <div className="mt-1.5">{campo}</div>
      {nota ? <p className="text-testo-tenue mt-1 text-xs">{nota}</p> : null}
    </div>
  )
}

function slugSemplice(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
