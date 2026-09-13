'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { salvaContenuto } from '@/lib/admin/azioni'

export type ContenutoEditor = {
  id: string
  chiave: string
  gruppo: string
  titolo: string
  corpo: string
  posizione: number
  pubblicato: boolean
}

export function EditorContenuti({ contenuti }: { contenuti: ContenutoEditor[] }) {
  const [nuovo, setNuovo] = useState(false)
  const gruppi = [...new Set(contenuti.map((voce) => voce.gruppo))]

  return (
    <div className="space-y-10">
      {gruppi.map((gruppo) => (
        <section key={gruppo}>
          <h2 className="occhiello">{gruppo}</h2>
          <ul className="mt-4 space-y-3">
            {contenuti
              .filter((voce) => voce.gruppo === gruppo)
              .map((voce) => (
                <li key={voce.id}>
                  <Blocco contenuto={voce} />
                </li>
              ))}
          </ul>
        </section>
      ))}

      {nuovo ? (
        <div className="border-antracite bg-calce border p-4">
          <Blocco
            contenuto={{
              id: '',
              chiave: '',
              gruppo: 'faq',
              titolo: '',
              corpo: '',
              posizione: contenuti.length,
              pubblicato: true,
            }}
            apertoDiDefault
            onChiudi={() => setNuovo(false)}
          />
        </div>
      ) : (
        <Button variant="secondario" size="sm" onClick={() => setNuovo(true)}>
          Nuovo testo
        </Button>
      )}
    </div>
  )
}

function Blocco({
  contenuto,
  apertoDiDefault = false,
  onChiudi,
}: {
  contenuto: ContenutoEditor
  apertoDiDefault?: boolean
  onChiudi?: () => void
}) {
  const [aperto, setAperto] = useState(apertoDiDefault)
  const [dati, setDati] = useState(contenuto)
  const [inCorso, avvia] = useTransition()

  if (!aperto) {
    return (
      <div className="border-bordo bg-calce flex items-center justify-between gap-4 border p-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{dati.titolo || dati.chiave}</p>
          <p className="text-testo-tenue mt-1 text-xs">
            {dati.chiave}
            {dati.pubblicato ? '' : ' · non pubblicato'}
          </p>
        </div>
        <Button variant="tenue" size="sm" onClick={() => setAperto(true)}>
          Modifica
        </Button>
      </div>
    )
  }

  return (
    <div className="border-antracite bg-calce space-y-4 border p-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor={`chiave-${contenuto.id}`}>Chiave</Label>
          <Input
            id={`chiave-${contenuto.id}`}
            value={dati.chiave}
            onChange={(evento) => setDati({ ...dati, chiave: evento.target.value })}
            placeholder="faq.tempi"
            className="mt-1.5"
            disabled={Boolean(contenuto.id)}
          />
        </div>
        <div>
          <Label htmlFor={`gruppo-${contenuto.id}`}>Gruppo</Label>
          <Input
            id={`gruppo-${contenuto.id}`}
            value={dati.gruppo}
            onChange={(evento) => setDati({ ...dati, gruppo: evento.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor={`posizione-${contenuto.id}`}>Ordine</Label>
          <Input
            id={`posizione-${contenuto.id}`}
            type="number"
            min={0}
            value={dati.posizione}
            onChange={(evento) =>
              setDati({ ...dati, posizione: Number.parseInt(evento.target.value, 10) || 0 })
            }
            className="mt-1.5"
          />
        </div>
      </div>

      <div>
        <Label htmlFor={`titolo-${contenuto.id}`}>Titolo</Label>
        <Input
          id={`titolo-${contenuto.id}`}
          value={dati.titolo}
          onChange={(evento) => setDati({ ...dati, titolo: evento.target.value })}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor={`corpo-${contenuto.id}`}>Testo</Label>
        <Textarea
          id={`corpo-${contenuto.id}`}
          rows={6}
          value={dati.corpo}
          onChange={(evento) => setDati({ ...dati, corpo: evento.target.value })}
          className="mt-1.5"
        />
      </div>

      <label htmlFor="contenuto-pubblicato" className="flex items-center gap-3">
        <Checkbox
          id="contenuto-pubblicato"
          checked={dati.pubblicato}
          onCheckedChange={(stato) => setDati({ ...dati, pubblicato: stato === true })}
        />
        <span className="text-sm">Pubblicato</span>
      </label>

      <div className="flex gap-3">
        <Button
          size="sm"
          disabled={inCorso || dati.chiave.trim().length < 2}
          onClick={() =>
            avvia(async () => {
              const { id: _id, ...campi } = dati
              const esito = await salvaContenuto({
                ...campi,
                id: contenuto.id || undefined,
              })
              if (esito.ok) {
                toast.success(esito.messaggio ?? 'Salvato.')
                setAperto(false)
                onChiudi?.()
              } else toast.error(esito.messaggio ?? 'Non ha funzionato.')
            })
          }
        >
          {inCorso ? 'Salvo…' : 'Salva'}
        </Button>
        <Button
          variant="fantasma"
          size="sm"
          onClick={() => {
            setDati(contenuto)
            setAperto(false)
            onChiudi?.()
          }}
        >
          Lascia stare
        </Button>
      </div>
    </div>
  )
}
