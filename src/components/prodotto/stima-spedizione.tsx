'use client'

import { useEffect, useState, useTransition } from 'react'
import { Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { stimaSpedizioneVariante, type StimaSpedizione } from '@/lib/spedizioni/azioni'
import { ETICHETTE_ZONA } from '@/lib/spedizioni/zone'
import { formatNumber, formatPrice, isValidPostalCode } from '@/lib/utils'

const CHIAVE_CAP = 'materia-etrusca:cap'

/**
 * Stima della spedizione dentro la scheda prodotto, prima del carrello.
 * Il CAP resta in memoria fra una pagina e l'altra: nessuno ha voglia di
 * riscriverlo cinque volte.
 */
export function StimaSpedizionePezzo({
  variantId,
  quantita = 1,
  pesoImballoKg,
}: {
  variantId: string
  quantita?: number
  pesoImballoKg: number
}) {
  const [cap, setCap] = useState('')
  const [stima, setStima] = useState<StimaSpedizione | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  useEffect(() => {
    try {
      const salvato = window.localStorage.getItem(CHIAVE_CAP)
      if (salvato) setCap(salvato)
    } catch {
      // Se la memoria del browser è bloccata si riparte semplicemente da vuoto.
    }
  }, [])

  // A ogni cambio di variante o quantità la stima precedente non vale più.
  useEffect(() => {
    setStima(null)
  }, [variantId, quantita])

  function calcola(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const pulito = cap.trim()

    if (!isValidPostalCode(pulito)) {
      setErrore('Il CAP ha cinque cifre.')
      return
    }

    setErrore(null)
    try {
      window.localStorage.setItem(CHIAVE_CAP, pulito)
    } catch {
      // Non poter salvare il CAP non è un motivo per non calcolare la stima.
    }

    avvia(async () => {
      setStima(await stimaSpedizioneVariante(variantId, quantita, pulito))
    })
  }

  return (
    <div className="border-bordo bg-tufo border p-5">
      <div className="flex items-start gap-3">
        <Truck aria-hidden className="text-testo-tenue mt-0.5 size-5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Quanto costa portartelo a casa</p>
          <p className="text-testo-tenue mt-1 text-sm">
            Pesa {formatNumber(pesoImballoKg)} kg con l’imballo. Dimmi il CAP e ti do il costo
            esatto adesso, non al momento di pagare.
          </p>

          <form onSubmit={calcola} className="mt-4 flex flex-wrap items-end gap-3">
            <div className="w-32">
              <Label htmlFor={`cap-${variantId}`} className="text-testo-tenue text-xs">
                Il tuo CAP
              </Label>
              <Input
                id={`cap-${variantId}`}
                name="cap"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                placeholder="00052"
                value={cap}
                onChange={(evento) => setCap(evento.target.value.replace(/\D/g, '').slice(0, 5))}
                aria-invalid={errore !== null}
                className="bg-calce mt-1.5 h-11"
              />
            </div>
            <Button type="submit" variant="secondario" size="sm" disabled={inCorso}>
              {inCorso ? 'Calcolo…' : 'Calcola'}
            </Button>
          </form>

          {errore ? (
            <p role="alert" className="text-errore mt-2 text-sm">
              {errore}
            </p>
          ) : null}

          {stima?.risultato ? <EsitoStima stima={stima} /> : null}
        </div>
      </div>
    </div>
  )
}

function EsitoStima({ stima }: { stima: StimaSpedizione }) {
  const risultato = stima.risultato
  if (!risultato) return null

  if (risultato.richiedePreventivo) {
    return (
      <div role="status" className="border-cemento mt-4 border-t pt-4 text-sm">
        <p className="font-medium">Questo pezzo viaggia su pallet.</p>
        <p className="text-testo-tenue mt-1.5">
          Sopra i 70 kg non c’è un prezzo a listino: chiedo io la quota al trasportatore e te la
          scrivo prima che tu paghi qualcosa. Se passi a ritirarlo in laboratorio, non paghi nulla.
        </p>
      </div>
    )
  }

  return (
    <dl role="status" className="border-cemento mt-4 space-y-2.5 border-t pt-4 text-sm">
      {risultato.opzioni.map((opzione) => (
        <div key={opzione.metodo} className="flex items-baseline justify-between gap-4">
          <dt className="text-testo-tenue">
            {opzione.supplemento ? '+ ' : ''}
            {opzione.etichetta}
            {opzione.etaGiorni > 0 ? (
              <span className="text-testo-tenue/80"> · {opzione.etaGiorni} giorni</span>
            ) : null}
          </dt>
          <dd className="shrink-0 tabular-nums">
            {opzione.prezzoCents === null
              ? 'su preventivo'
              : opzione.prezzoCents === 0
                ? 'gratis'
                : formatPrice(opzione.prezzoCents)}
          </dd>
        </div>
      ))}
      {risultato.zona ? (
        <p className="text-testo-tenue pt-1 text-xs">
          Destinazione: {ETICHETTE_ZONA[risultato.zona]}.
        </p>
      ) : null}
    </dl>
  )
}
