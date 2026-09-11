'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import {
  ETICHETTE_ORDINAMENTO,
  ORDINAMENTI,
  type EstremiCatalogo,
  type FiltriCatalogo,
} from '@/lib/catalogo/tipi'
import { ETICHETTE_FINITURA } from '@/lib/catalogo/etichette'
import { contaFiltriAttivi, FINITURE, scriviParametri } from '@/lib/catalogo/parametri'
import { cn, formatPrice } from '@/lib/utils'
import type { Finitura } from '@/db/schema'

type Props = {
  filtri: FiltriCatalogo
  estremi: EstremiCatalogo
  percorsoBase: string
  totale: number
}

export function BarraFiltri({ filtri, estremi, percorsoBase, totale }: Props) {
  const [aperto, setAperto] = useState(false)
  const attivi = contaFiltriAttivi(filtri)

  return (
    <div className="border-bordo flex flex-wrap items-center justify-between gap-4 border-y py-4">
      <div className="flex items-center gap-4">
        {/* Su telefono i filtri stanno in un pannello: la griglia ha bisogno di tutto lo schermo. */}
        <Sheet open={aperto} onOpenChange={setAperto}>
          <SheetTrigger asChild>
            <Button variant="tenue" size="sm" className="lg:hidden">
              <SlidersHorizontal aria-hidden />
              Filtri
              {attivi > 0 ? (
                <span className="bg-terracotta text-calce ml-1 px-1.5 text-[0.7rem] leading-5">
                  {attivi}
                </span>
              ) : null}
            </Button>
          </SheetTrigger>
          <SheetContent lato="basso" titolo="Filtri" className="lg:hidden">
            <div className="flex-1 overflow-y-auto px-5 py-6">
              <PannelloFiltri
                filtri={filtri}
                estremi={estremi}
                percorsoBase={percorsoBase}
                onApplicato={() => setAperto(false)}
              />
            </div>
            <div className="border-bordo border-t p-4">
              <Button className="w-full" onClick={() => setAperto(false)}>
                Vedi {totale} {totale === 1 ? 'pezzo' : 'pezzi'}
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <p className="text-testo-tenue text-sm">
          {totale} {totale === 1 ? 'pezzo' : 'pezzi'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="ordinamento" className="text-testo-tenue text-sm font-normal">
          Ordina
        </Label>
        <SelettoreOrdinamento filtri={filtri} percorsoBase={percorsoBase} />
      </div>
    </div>
  )
}

function SelettoreOrdinamento({
  filtri,
  percorsoBase,
}: {
  filtri: FiltriCatalogo
  percorsoBase: string
}) {
  const router = useRouter()

  return (
    <Select
      id="ordinamento"
      className="h-10 w-48 border-transparent bg-transparent pl-0"
      value={filtri.ordinamento ?? 'novita'}
      onChange={(evento) => {
        const ordinamento = ORDINAMENTI.find((voce) => voce === evento.target.value) ?? 'novita'
        // Cambiando ordinamento si torna a pagina uno: tenerla sarebbe una lista a caso.
        router.replace(`${percorsoBase}${scriviParametri({ ...filtri, ordinamento, pagina: 1 })}`, {
          scroll: false,
        })
      }}
    >
      {ORDINAMENTI.map((voce) => (
        <option key={voce} value={voce}>
          {ETICHETTE_ORDINAMENTO[voce]}
        </option>
      ))}
    </Select>
  )
}

export function PannelloFiltri({
  filtri,
  estremi,
  percorsoBase,
  onApplicato,
  className,
}: Omit<Props, 'totale'> & { onApplicato?: () => void; className?: string }) {
  const router = useRouter()

  const [altezza, setAltezza] = useState<[number, number]>([
    filtri.altezzaMinCm ?? estremi.altezzaMinCm,
    filtri.altezzaMaxCm ?? estremi.altezzaMaxCm,
  ])
  const [prezzo, setPrezzo] = useState<[number, number]>([
    filtri.prezzoMinCents ?? estremi.prezzoMinCents,
    filtri.prezzoMaxCents ?? estremi.prezzoMaxCents,
  ])

  const applica = useCallback(
    (modifiche: Partial<FiltriCatalogo>) => {
      const nuovi: FiltriCatalogo = { ...filtri, ...modifiche, pagina: 1 }
      router.replace(`${percorsoBase}${scriviParametri(nuovi)}`, { scroll: false })
      onApplicato?.()
    },
    [filtri, onApplicato, percorsoBase, router],
  )

  const finitureAttive = useMemo(() => new Set(filtri.finiture ?? []), [filtri.finiture])

  function alternaFinitura(finitura: Finitura) {
    const prossime = new Set(finitureAttive)
    if (prossime.has(finitura)) prossime.delete(finitura)
    else prossime.add(finitura)
    applica({ finiture: prossime.size > 0 ? [...prossime] : undefined })
  }

  const passoPrezzo = 1000
  const qualcosaDaAzzerare = contaFiltriAttivi(filtri) > 0

  return (
    <div className={cn('space-y-10', className)}>
      <fieldset>
        <legend className="occhiello">Altezza</legend>
        <p className="mt-3 text-sm tabular-nums">
          da {altezza[0]} a {altezza[1]} cm
        </p>
        <Slider
          className="mt-2"
          min={estremi.altezzaMinCm}
          max={estremi.altezzaMaxCm}
          step={1}
          value={altezza}
          onValueChange={(valori) => setAltezza([valori[0] ?? 0, valori[1] ?? 0])}
          onValueCommit={(valori) => {
            const min = valori[0] ?? estremi.altezzaMinCm
            const max = valori[1] ?? estremi.altezzaMaxCm
            const tutto = min <= estremi.altezzaMinCm && max >= estremi.altezzaMaxCm
            applica({
              altezzaMinCm: tutto ? undefined : min,
              altezzaMaxCm: tutto ? undefined : max,
            })
          }}
          aria-label="Intervallo di altezza in centimetri"
        />
      </fieldset>

      <fieldset>
        <legend className="occhiello">Prezzo</legend>
        <p className="mt-3 text-sm tabular-nums">
          da {formatPrice(prezzo[0])} a {formatPrice(prezzo[1])}
        </p>
        <Slider
          className="mt-2"
          min={estremi.prezzoMinCents}
          max={estremi.prezzoMaxCents}
          step={passoPrezzo}
          value={prezzo}
          onValueChange={(valori) => setPrezzo([valori[0] ?? 0, valori[1] ?? 0])}
          onValueCommit={(valori) => {
            const min = valori[0] ?? estremi.prezzoMinCents
            const max = valori[1] ?? estremi.prezzoMaxCents
            const tutto = min <= estremi.prezzoMinCents && max >= estremi.prezzoMaxCents
            applica({
              prezzoMinCents: tutto ? undefined : min,
              prezzoMaxCents: tutto ? undefined : max,
            })
          }}
          aria-label="Intervallo di prezzo"
        />
      </fieldset>

      <fieldset>
        <legend className="occhiello">Finitura</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {FINITURE.filter((finitura) => estremi.finiture.includes(finitura)).map((finitura) => {
            const attiva = finitureAttive.has(finitura)
            return (
              <button
                key={finitura}
                type="button"
                onClick={() => alternaFinitura(finitura)}
                aria-pressed={attiva}
                className={cn(
                  'border px-3 py-2 text-sm transition-colors duration-300',
                  attiva
                    ? 'border-antracite bg-antracite text-calce'
                    : 'border-bordo text-antracite hover:border-antracite',
                )}
              >
                {ETICHETTE_FINITURA[finitura]}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="occhiello">Dove lo metti</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {(
            [
              { valore: undefined, etichetta: 'Ovunque' },
              { valore: 'interno' as const, etichetta: 'Interno' },
              { valore: 'esterno' as const, etichetta: 'Esterno' },
            ] satisfies { valore: 'interno' | 'esterno' | undefined; etichetta: string }[]
          ).map((voce) => {
            const attiva = filtri.ambiente === voce.valore
            return (
              <button
                key={voce.etichetta}
                type="button"
                onClick={() => applica({ ambiente: voce.valore })}
                aria-pressed={attiva}
                className={cn(
                  'border px-3 py-2 text-sm transition-colors duration-300',
                  attiva
                    ? 'border-antracite bg-antracite text-calce'
                    : 'border-bordo text-antracite hover:border-antracite',
                )}
              >
                {voce.etichetta}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex items-start gap-3">
        <Checkbox
          id="solo-disponibili"
          checked={filtri.soloDisponibili ?? false}
          onCheckedChange={(stato) =>
            applica({ soloDisponibili: stato === true ? true : undefined })
          }
          className="mt-0.5"
        />
        <Label htmlFor="solo-disponibili" className="font-normal">
          Solo quello che posso spedire subito o colare su ordinazione
        </Label>
      </div>

      {qualcosaDaAzzerare ? (
        <Button
          variant="collegamento"
          onClick={() => {
            setAltezza([estremi.altezzaMinCm, estremi.altezzaMaxCm])
            setPrezzo([estremi.prezzoMinCents, estremi.prezzoMaxCents])
            router.replace(
              `${percorsoBase}${scriviParametri({ ordinamento: filtri.ordinamento, pagina: 1 })}`,
              { scroll: false },
            )
            onApplicato?.()
          }}
        >
          <X aria-hidden />
          Azzera i filtri
        </Button>
      ) : null}
    </div>
  )
}
