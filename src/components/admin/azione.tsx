'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import type { EsitoAzione } from '@/lib/admin/azioni'

/** Pulsante che chiama una azione del server e riferisce com'è andata. */
export function Azione({
  esegui,
  children,
  variant = 'tenue',
  size = 'sm',
  className,
  disabled,
}: {
  esegui: () => Promise<EsitoAzione>
  children: React.ReactNode
} & Pick<ButtonProps, 'variant' | 'size' | 'className' | 'disabled'>) {
  const [inCorso, avvia] = useTransition()

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || inCorso}
      onClick={() =>
        avvia(async () => {
          const esito = await esegui()
          if (esito.ok) {
            if (esito.messaggio) toast.success(esito.messaggio)
          } else {
            toast.error(esito.messaggio ?? 'Non ha funzionato.')
          }
        })
      }
    >
      {inCorso ? 'Un momento…' : children}
    </Button>
  )
}

/**
 * Ogni azione che toglie qualcosa dalla vetrina chiede conferma.
 * Nel pannello non si cancella mai davvero: si archivia.
 */
export function AzioneConConferma({
  esegui,
  children,
  titolo,
  descrizione,
  conferma = 'Sì, procedi',
  variant = 'tenue',
  size = 'sm',
  className,
}: {
  esegui: () => Promise<EsitoAzione>
  children: React.ReactNode
  titolo: string
  descrizione: string
  conferma?: string
} & Pick<ButtonProps, 'variant' | 'size' | 'className'>) {
  const [aperto, setAperto] = useState(false)
  const [inCorso, avvia] = useTransition()

  return (
    <Dialog open={aperto} onOpenChange={setAperto}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          {children}
        </Button>
      </DialogTrigger>
      <DialogContent titolo={titolo} descrizione={descrizione}>
        <div className="flex flex-wrap justify-end gap-3">
          <DialogClose asChild>
            <Button variant="fantasma" size="sm">
              Lascia stare
            </Button>
          </DialogClose>
          <Button
            variant="distruttivo"
            size="sm"
            disabled={inCorso}
            onClick={() =>
              avvia(async () => {
                const esito = await esegui()
                if (esito.ok) {
                  if (esito.messaggio) toast.success(esito.messaggio)
                  setAperto(false)
                } else {
                  toast.error(esito.messaggio ?? 'Non ha funzionato.')
                }
              })
            }
          >
            {inCorso ? 'Un momento…' : conferma}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
