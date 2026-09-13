'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { EsitoAzione } from '@/lib/admin/azioni'

/** Appunto che vede solo chi entra nel pannello. Il cliente non lo legge mai. */
export function NotaInterna({
  valoreIniziale,
  salva,
  titolo = 'Appunti tuoi',
}: {
  valoreIniziale: string
  salva: (nota: string) => Promise<EsitoAzione>
  titolo?: string
}) {
  const [nota, setNota] = useState(valoreIniziale)
  const [inCorso, avvia] = useTransition()
  const cambiata = nota !== valoreIniziale

  return (
    <section>
      <h2 className="occhiello">{titolo}</h2>
      <Textarea
        rows={4}
        value={nota}
        onChange={(evento) => setNota(evento.target.value)}
        placeholder="Ha chiamato giovedì, richiamare dopo le 18…"
        className="mt-3 text-sm"
        aria-label={titolo}
      />
      <Button
        variant="tenue"
        size="sm"
        className="mt-3"
        disabled={inCorso || !cambiata}
        onClick={() =>
          avvia(async () => {
            const esito = await salva(nota)
            if (esito.ok) toast.success(esito.messaggio ?? 'Salvato.')
            else toast.error(esito.messaggio ?? 'Non ha funzionato.')
          })
        }
      >
        {inCorso ? 'Salvo…' : 'Salva l’appunto'}
      </Button>
    </section>
  )
}
