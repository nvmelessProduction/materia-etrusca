'use client'

import { useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCarrello } from '@/components/carrello/contesto-carrello'
import { impostaCapCarrello } from '@/lib/carrello/azioni'
import { stimaSpedizioneCarrello, type StimaSpedizione } from '@/lib/spedizioni/azioni'
import { ETICHETTE_ZONA } from '@/lib/spedizioni/zone'
import { formatNumber, formatPrice, isValidPostalCode } from '@/lib/utils'

/**
 * Peso totale e spedizione che ne consegue, calcolati nel carrello.
 * Su pezzi che pesano decine di chili, scoprire il costo al momento di pagare
 * è la ragione numero uno per cui un ordine non si chiude.
 */
export function SpedizioneCarrello() {
  const { carrello, sincronizza } = useCarrello()
  const [cap, setCap] = useState(carrello.cap ?? '')
  const [stima, setStima] = useState<StimaSpedizione | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  // Con un CAP già salvato la stima si mostra subito, senza chiederla di nuovo.
  useEffect(() => {
    if (!carrello.cap || carrello.righe.length === 0) return
    let annullato = false
    void stimaSpedizioneCarrello(carrello.cap).then((esito) => {
      if (!annullato) setStima(esito)
    })
    return () => {
      annullato = true
    }
  }, [carrello.cap, carrello.righe.length])

  function calcola(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const pulito = cap.trim()
    if (!isValidPostalCode(pulito)) {
      setErrore('Il CAP ha cinque cifre.')
      return
    }
    setErrore(null)
    avvia(async () => {
      const esitoCarrello = await impostaCapCarrello(pulito)
      sincronizza(esitoCarrello.carrello)
      setStima(await stimaSpedizioneCarrello(pulito))
    })
  }

  if (carrello.righe.length === 0) return null

  return (
    <div className="border-bordo border-t pt-5">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="text-testo-tenue">Peso totale con imballo</span>
        <span className="tabular-nums">{formatNumber(carrello.pesoTotaleKg)} kg</span>
      </div>

      <form onSubmit={calcola} className="mt-4 flex items-end gap-2">
        <div className="w-32">
          <Label htmlFor="cap-carrello" className="text-testo-tenue text-xs">
            Il tuo CAP
          </Label>
          <Input
            id="cap-carrello"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            placeholder="00052"
            value={cap}
            onChange={(evento) => setCap(evento.target.value.replace(/\D/g, '').slice(0, 5))}
            aria-invalid={errore !== null}
            className="mt-1.5 h-11"
          />
        </div>
        <Button type="submit" variant="tenue" size="sm" disabled={inCorso}>
          {inCorso ? 'Calcolo…' : 'Calcola'}
        </Button>
      </form>

      {errore ? (
        <p role="alert" className="text-errore mt-2 text-sm">
          {errore}
        </p>
      ) : null}

      {stima?.risultato ? (
        <div role="status" className="mt-4 space-y-2 text-sm">
          {stima.risultato.richiedePreventivo ? (
            <p className="text-testo-tenue">
              Sopra i 70 kg si va su pallet e il prezzo non è a listino: chiedo io la quota al
              trasportatore e te la scrivo prima che tu paghi. Il ritiro in laboratorio resta
              gratuito.
            </p>
          ) : null}
          {stima.risultato.opzioni.map((opzione) => (
            <div key={opzione.metodo} className="flex items-baseline justify-between gap-4">
              <span className="text-testo-tenue">
                {opzione.supplemento ? '+ ' : ''}
                {opzione.etichetta}
              </span>
              <span className="shrink-0 tabular-nums">
                {opzione.prezzoCents === null
                  ? 'su preventivo'
                  : opzione.prezzoCents === 0
                    ? 'gratis'
                    : formatPrice(opzione.prezzoCents)}
              </span>
            </div>
          ))}
          {stima.risultato.zona ? (
            <p className="text-testo-tenue pt-1 text-xs">
              Destinazione: {ETICHETTE_ZONA[stima.risultato.zona]}. Il metodo lo scegli al passo
              successivo.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
