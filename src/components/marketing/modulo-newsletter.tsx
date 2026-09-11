'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type Stato = 'inattivo' | 'invio' | 'fatto' | 'errore'

export function ModuloNewsletter() {
  const [stato, setStato] = useState<Stato>('inattivo')
  const [messaggio, setMessaggio] = useState('')

  async function invia(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const modulo = evento.currentTarget
    const dati = new FormData(modulo)

    setStato('invio')
    try {
      const risposta = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(dati.get('email') ?? ''),
          consenso: dati.get('consenso') === 'on',
          // Campo esca: se è pieno, è un robot.
          azienda: String(dati.get('azienda') ?? ''),
        }),
      })
      const esito = (await risposta.json()) as { ok?: boolean; errore?: string }
      if (!risposta.ok || !esito.ok) {
        setStato('errore')
        setMessaggio(esito.errore ?? 'Non sono riuscito a registrare l’indirizzo.')
        return
      }
      setStato('fatto')
      setMessaggio('Fatto. Ti scrivo quando esce qualcosa di nuovo.')
      modulo.reset()
    } catch {
      setStato('errore')
      setMessaggio('Non sono riuscito a registrare l’indirizzo. Riprova fra un momento.')
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 md:gap-12">
      <div>
        <p className="occhiello">Resta in contatto</p>
        <p className="font-display mt-4 text-2xl font-light md:text-3xl">
          Ti scrivo poco, solo quando esce qualcosa di nuovo.
        </p>
      </div>

      <form onSubmit={invia} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Label htmlFor="newsletter-email" className="sr-only">
            Indirizzo email
          </Label>
          <Input
            id="newsletter-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="La tua email"
            className="sm:flex-1"
            disabled={stato === 'invio'}
          />
          <Button type="submit" variant="scuro" disabled={stato === 'invio'}>
            {stato === 'invio' ? 'Invio…' : 'Iscriviti'}
          </Button>
        </div>

        {/* Esca invisibile per i robot: nessun captcha da risolvere. */}
        <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="newsletter-azienda">Azienda</label>
          <input
            id="newsletter-azienda"
            name="azienda"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <div className="flex items-start gap-3">
          <Checkbox id="newsletter-consenso" name="consenso" required className="mt-0.5" />
          <Label htmlFor="newsletter-consenso" className="text-testo-tenue text-xs font-normal">
            Acconsento a ricevere le novità via email. Posso cancellarmi quando voglio, il link è in
            fondo a ogni messaggio.
          </Label>
        </div>

        {messaggio ? (
          <p
            role="status"
            className={stato === 'errore' ? 'text-errore text-sm' : 'text-oliva text-sm'}
          >
            {messaggio}
          </p>
        ) : null}
      </form>
    </div>
  )
}
