'use client'

import { useState, useTransition } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCarrello } from '@/components/carrello/contesto-carrello'
import { applicaCodiceSconto, rimuoviCodiceSconto } from '@/lib/carrello/azioni'

export function CodiceSconto() {
  const { carrello, sincronizza } = useCarrello()
  const [codice, setCodice] = useState('')
  const [errore, setErrore] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  function applica(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    avvia(async () => {
      const esito = await applicaCodiceSconto(codice)
      sincronizza(esito.carrello)
      setErrore(esito.ok ? null : (esito.messaggio ?? 'Codice non valido.'))
      if (esito.ok) setCodice('')
    })
  }

  if (carrello.codiceSconto) {
    return (
      <div className="border-oliva bg-oliva/5 flex items-center justify-between gap-3 border px-3 py-2.5">
        <p className="text-sm">
          Codice <span className="font-medium">{carrello.codiceSconto}</span> applicato.
        </p>
        <button
          type="button"
          onClick={() =>
            avvia(async () => {
              const esito = await rimuoviCodiceSconto()
              sincronizza(esito.carrello)
            })
          }
          disabled={inCorso}
          className="text-testo-tenue hover:text-antracite p-1 transition-colors duration-300"
          aria-label="Togli il codice sconto"
        >
          <X className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={applica}>
      <Label htmlFor="codice-sconto" className="text-testo-tenue text-xs">
        Hai un codice?
      </Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id="codice-sconto"
          name="codice"
          value={codice}
          onChange={(evento) => setCodice(evento.target.value.toUpperCase())}
          placeholder="CODICE"
          autoComplete="off"
          className="h-11 flex-1 uppercase"
          aria-invalid={errore !== null}
        />
        <Button type="submit" variant="tenue" size="sm" disabled={inCorso || codice.trim() === ''}>
          Applica
        </Button>
      </div>
      {errore ? (
        <p role="alert" className="text-errore mt-2 text-sm">
          {errore}
        </p>
      ) : null}
    </form>
  )
}
