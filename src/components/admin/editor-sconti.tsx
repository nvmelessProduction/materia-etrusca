'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { AzioneConConferma } from '@/components/admin/azione'
import { disattivaSconto, salvaSconto } from '@/lib/admin/azioni'
import { formatDate, formatPrice } from '@/lib/utils'

export type ScontoEditor = {
  id: string
  codice: string
  tipo: 'percent' | 'fixed'
  valore: number
  minimoOrdineCents: number
  limiteUtilizzi: number | null
  utilizzi: number
  scadenza: string | null
  attivo: boolean
}

export function EditorSconti({ sconti }: { sconti: ScontoEditor[] }) {
  const [nuovo, setNuovo] = useState(false)
  const [inModifica, setInModifica] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {sconti.map((sconto) => (
          <li key={sconto.id} className="border-bordo bg-calce border p-4">
            {inModifica === sconto.id ? (
              <ModuloSconto sconto={sconto} onChiudi={() => setInModifica(null)} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">
                    {sconto.codice}
                    {!sconto.attivo ? (
                      <span className="text-testo-tenue ml-2 text-xs font-normal">spento</span>
                    ) : null}
                  </p>
                  <p className="text-testo-tenue mt-1 text-xs">
                    {sconto.tipo === 'percent' ? `${sconto.valore}%` : formatPrice(sconto.valore)}
                    {sconto.minimoOrdineCents > 0
                      ? ` · da ${formatPrice(sconto.minimoOrdineCents)}`
                      : ''}
                    {sconto.limiteUtilizzi
                      ? ` · usato ${sconto.utilizzi} di ${sconto.limiteUtilizzi}`
                      : ` · usato ${sconto.utilizzi} volte`}
                    {sconto.scadenza ? ` · scade il ${formatDate(sconto.scadenza)}` : ''}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="tenue" size="sm" onClick={() => setInModifica(sconto.id)}>
                    Modifica
                  </Button>
                  {sconto.attivo ? (
                    <AzioneConConferma
                      titolo="Spegnere questo codice?"
                      descrizione="Da subito non funziona più. Gli ordini già fatti con questo codice restano come sono."
                      conferma="Spegni"
                      esegui={() => disattivaSconto(sconto.id)}
                    >
                      Spegni
                    </AzioneConConferma>
                  ) : null}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {nuovo ? (
        <div className="border-antracite bg-calce border p-4">
          <ModuloSconto onChiudi={() => setNuovo(false)} />
        </div>
      ) : (
        <Button variant="secondario" size="sm" onClick={() => setNuovo(true)}>
          Nuovo codice
        </Button>
      )}
    </div>
  )
}

function ModuloSconto({ sconto, onChiudi }: { sconto?: ScontoEditor; onChiudi: () => void }) {
  const [dati, setDati] = useState({
    codice: sconto?.codice ?? '',
    tipo: sconto?.tipo ?? ('percent' as const),
    valore: sconto?.tipo === 'fixed' ? (sconto.valore ?? 0) / 100 : (sconto?.valore ?? 10),
    minimoEuro: (sconto?.minimoOrdineCents ?? 0) / 100,
    limiteUtilizzi: sconto?.limiteUtilizzi ?? null,
    scadenza: sconto?.scadenza ? sconto.scadenza.slice(0, 10) : '',
    attivo: sconto?.attivo ?? true,
  })
  const [inCorso, avvia] = useTransition()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="codice-sconto-admin">Codice</Label>
          <Input
            id="codice-sconto-admin"
            value={dati.codice}
            onChange={(evento) => setDati({ ...dati, codice: evento.target.value.toUpperCase() })}
            placeholder="BENVENUTO10"
            className="mt-1.5 uppercase"
          />
        </div>
        <div>
          <Label htmlFor="tipo-sconto">Tipo</Label>
          <Select
            id="tipo-sconto"
            value={dati.tipo}
            onChange={(evento) =>
              setDati({ ...dati, tipo: evento.target.value as 'percent' | 'fixed' })
            }
            className="mt-1.5"
          >
            <option value="percent">Percentuale</option>
            <option value="fixed">Importo fisso</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="valore-sconto">
            {dati.tipo === 'percent' ? 'Percentuale' : 'Importo (€)'}
          </Label>
          <Input
            id="valore-sconto"
            inputMode="decimal"
            value={String(dati.valore)}
            onChange={(evento) =>
              setDati({
                ...dati,
                valore: Number.parseFloat(evento.target.value.replace(',', '.')) || 0,
              })
            }
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="minimo-sconto">Minimo ordine (€)</Label>
          <Input
            id="minimo-sconto"
            inputMode="decimal"
            value={String(dati.minimoEuro)}
            onChange={(evento) =>
              setDati({
                ...dati,
                minimoEuro: Number.parseFloat(evento.target.value.replace(',', '.')) || 0,
              })
            }
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="limite-sconto">Usi massimi</Label>
          <Input
            id="limite-sconto"
            type="number"
            min={1}
            value={dati.limiteUtilizzi ?? ''}
            onChange={(evento) =>
              setDati({
                ...dati,
                limiteUtilizzi: evento.target.value
                  ? Math.max(1, Number.parseInt(evento.target.value, 10))
                  : null,
              })
            }
            placeholder="senza limite"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="scadenza-sconto">Scade il</Label>
          <Input
            id="scadenza-sconto"
            type="date"
            value={dati.scadenza}
            onChange={(evento) => setDati({ ...dati, scadenza: evento.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>

      <label className="flex items-center gap-3">
        <Checkbox
          checked={dati.attivo}
          onCheckedChange={(stato) => setDati({ ...dati, attivo: stato === true })}
        />
        <span className="text-sm">Attivo</span>
      </label>

      <div className="flex gap-3">
        <Button
          size="sm"
          disabled={inCorso || dati.codice.trim().length < 3}
          onClick={() =>
            avvia(async () => {
              const esito = await salvaSconto({
                id: sconto?.id,
                codice: dati.codice,
                tipo: dati.tipo,
                valore:
                  dati.tipo === 'fixed' ? Math.round(dati.valore * 100) : Math.round(dati.valore),
                minimoOrdineCents: Math.round(dati.minimoEuro * 100),
                limiteUtilizzi: dati.limiteUtilizzi,
                scadenza: dati.scadenza || null,
                attivo: dati.attivo,
              })
              if (esito.ok) {
                toast.success(esito.messaggio ?? 'Salvato.')
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
