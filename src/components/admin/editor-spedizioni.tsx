'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AzioneConConferma } from '@/components/admin/azione'
import { disattivaFascia, salvaFascia } from '@/lib/admin/azioni'
import { ETICHETTE_METODO, SOGLIA_PREVENTIVO_KG } from '@/lib/spedizioni/motore'
import { ETICHETTE_ZONA } from '@/lib/spedizioni/zone'
import type { MetodoSpedizione, ZonaSpedizione } from '@/db/schema'
import { formatNumber, formatPrice } from '@/lib/utils'

export type FasciaEditor = {
  id: string
  minPesoKg: number
  maxPesoKg: number
  metodo: MetodoSpedizione
  prezzoCents: number
  zona: ZonaSpedizione
  etaGiorni: number
  attiva: boolean
}

const METODI: MetodoSpedizione[] = ['courier', 'pallet', 'floor_delivery', 'pickup']
const ZONE: ZonaSpedizione[] = ['italia', 'isole', 'estero']

export function EditorSpedizioni({ fasce }: { fasce: FasciaEditor[] }) {
  const [nuova, setNuova] = useState(false)
  const [inModifica, setInModifica] = useState<string | null>(null)

  const perZona = ZONE.map((zona) => ({
    zona,
    righe: fasce.filter((fascia) => fascia.zona === zona),
  }))

  return (
    <div className="space-y-10">
      <p className="border-bordo bg-calce text-testo-tenue border p-4 text-sm leading-relaxed">
        Sopra i {SOGLIA_PREVENTIVO_KG} kg il sito smette di fare prezzo da solo e passa a
        “preventivo su richiesta”: è una regola del motore, non una fascia, e non si cambia da qui.
        Il ritiro in laboratorio è sempre gratuito.
      </p>

      {perZona.map(({ zona, righe }) => (
        <section key={zona}>
          <h2 className="occhiello">{ETICHETTE_ZONA[zona]}</h2>
          <ul className="mt-4 space-y-3">
            {righe.map((fascia) => (
              <li key={fascia.id} className="border-bordo bg-calce border p-4">
                {inModifica === fascia.id ? (
                  <ModuloFascia fascia={fascia} onChiudi={() => setInModifica(null)} />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {ETICHETTE_METODO[fascia.metodo]} · da {formatNumber(fascia.minPesoKg)} a{' '}
                        {formatNumber(fascia.maxPesoKg)} kg
                        {!fascia.attiva ? (
                          <span className="text-testo-tenue ml-2 text-xs font-normal">spenta</span>
                        ) : null}
                      </p>
                      <p className="text-testo-tenue mt-1 text-xs">
                        {fascia.etaGiorni} giorni di consegna
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm tabular-nums">
                        {fascia.prezzoCents === 0 ? 'gratis' : formatPrice(fascia.prezzoCents)}
                      </span>
                      <Button variant="tenue" size="sm" onClick={() => setInModifica(fascia.id)}>
                        Modifica
                      </Button>
                      {fascia.attiva ? (
                        <AzioneConConferma
                          titolo="Spegnere questa fascia?"
                          descrizione="Smette di essere proposta al checkout. Se resta un buco nei pesi, quella combinazione passerà a preventivo."
                          conferma="Spegni"
                          esegui={() => disattivaFascia(fascia.id)}
                        >
                          Spegni
                        </AzioneConConferma>
                      ) : null}
                    </div>
                  </div>
                )}
              </li>
            ))}
            {righe.length === 0 ? (
              <li className="border-cemento text-testo-tenue border border-dashed p-4 text-sm">
                Nessuna fascia: qui si spedisce solo su preventivo.
              </li>
            ) : null}
          </ul>
        </section>
      ))}

      {nuova ? (
        <div className="border-antracite bg-calce border p-4">
          <ModuloFascia onChiudi={() => setNuova(false)} />
        </div>
      ) : (
        <Button variant="secondario" size="sm" onClick={() => setNuova(true)}>
          Nuova fascia
        </Button>
      )}
    </div>
  )
}

function ModuloFascia({ fascia, onChiudi }: { fascia?: FasciaEditor; onChiudi: () => void }) {
  const [dati, setDati] = useState({
    minPesoKg: fascia?.minPesoKg ?? 0,
    maxPesoKg: fascia?.maxPesoKg ?? 5,
    metodo: fascia?.metodo ?? ('courier' as MetodoSpedizione),
    prezzoEuro: (fascia?.prezzoCents ?? 0) / 100,
    zona: fascia?.zona ?? ('italia' as ZonaSpedizione),
    etaGiorni: fascia?.etaGiorni ?? 4,
    attiva: fascia?.attiva ?? true,
  })
  const [inCorso, avvia] = useTransition()

  function numero(valore: string): number {
    return Number.parseFloat(valore.replace(',', '.')) || 0
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="zona-fascia">Zona</Label>
          <Select
            id="zona-fascia"
            value={dati.zona}
            onChange={(evento) => setDati({ ...dati, zona: evento.target.value as ZonaSpedizione })}
            className="mt-1.5"
          >
            {ZONE.map((zona) => (
              <option key={zona} value={zona}>
                {ETICHETTE_ZONA[zona]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="metodo-fascia">Metodo</Label>
          <Select
            id="metodo-fascia"
            value={dati.metodo}
            onChange={(evento) =>
              setDati({ ...dati, metodo: evento.target.value as MetodoSpedizione })
            }
            className="mt-1.5"
          >
            {METODI.map((metodo) => (
              <option key={metodo} value={metodo}>
                {ETICHETTE_METODO[metodo]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="prezzo-fascia">Prezzo (€)</Label>
          <Input
            id="prezzo-fascia"
            inputMode="decimal"
            value={String(dati.prezzoEuro)}
            onChange={(evento) => setDati({ ...dati, prezzoEuro: numero(evento.target.value) })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="min-fascia">Da (kg)</Label>
          <Input
            id="min-fascia"
            inputMode="decimal"
            value={String(dati.minPesoKg)}
            onChange={(evento) => setDati({ ...dati, minPesoKg: numero(evento.target.value) })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="max-fascia">A (kg)</Label>
          <Input
            id="max-fascia"
            inputMode="decimal"
            value={String(dati.maxPesoKg)}
            onChange={(evento) => setDati({ ...dati, maxPesoKg: numero(evento.target.value) })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="eta-fascia">Giorni</Label>
          <Input
            id="eta-fascia"
            type="number"
            min={1}
            max={120}
            value={dati.etaGiorni}
            onChange={(evento) =>
              setDati({ ...dati, etaGiorni: Number.parseInt(evento.target.value, 10) || 1 })
            }
            className="mt-1.5"
          />
        </div>
      </div>

      <label className="flex items-center gap-3">
        <Checkbox
          checked={dati.attiva}
          onCheckedChange={(stato) => setDati({ ...dati, attiva: stato === true })}
        />
        <span className="text-sm">Attiva</span>
      </label>

      <div className="flex gap-3">
        <Button
          size="sm"
          disabled={inCorso}
          onClick={() =>
            avvia(async () => {
              const esito = await salvaFascia({
                id: fascia?.id,
                minPesoKg: dati.minPesoKg,
                maxPesoKg: dati.maxPesoKg,
                metodo: dati.metodo,
                prezzoCents: Math.round(dati.prezzoEuro * 100),
                zona: dati.zona,
                etaGiorni: dati.etaGiorni,
                attiva: dati.attiva,
              })
              if (esito.ok) {
                toast.success(esito.messaggio ?? 'Salvata.')
                onChiudi()
              } else toast.error(esito.messaggio ?? 'Non ha funzionato.')
            })
          }
        >
          {inCorso ? 'Salvo…' : 'Salva'}
        </Button>
        <Button variant="fantasma" size="sm" onClick={onChiudi}>
          Lascia stare
        </Button>
      </div>
    </div>
  )
}
