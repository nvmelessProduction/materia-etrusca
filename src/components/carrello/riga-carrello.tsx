'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTransition } from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCarrello } from '@/components/carrello/contesto-carrello'
import { impostaQuantita, rimuoviDalCarrello } from '@/lib/carrello/azioni'
import type { RigaCarrello as Riga } from '@/lib/carrello/tipi'
import { cn, formatNumber, formatPrice } from '@/lib/utils'
import { toast } from 'sonner'

export function RigaCarrello({ riga, compatta = false }: { riga: Riga; compatta?: boolean }) {
  const { sincronizza } = useCarrello()
  const [inCorso, avvia] = useTransition()

  function cambia(quantita: number) {
    avvia(async () => {
      const esito = await impostaQuantita(riga.variantId, quantita)
      sincronizza(esito.carrello)
      if (!esito.ok && esito.messaggio) toast.error(esito.messaggio)
    })
  }

  function rimuovi() {
    avvia(async () => {
      const esito = await rimuoviDalCarrello(riga.variantId)
      sincronizza(esito.carrello)
      toast(`${riga.nomeProdotto} tolto dal carrello.`)
    })
  }

  const puoAumentare = riga.quantita < riga.disponibili && !riga.isUnique

  return (
    <article className={cn('flex gap-4', inCorso && 'opacity-60')}>
      <Link
        href={`/prodotti/${riga.slug}`}
        className={cn(
          'bg-tufo relative shrink-0 overflow-hidden',
          compatta ? 'size-20' : 'size-28 md:size-36',
        )}
      >
        {riga.immagineUrl ? (
          <Image
            src={riga.immagineUrl}
            alt={riga.immagineAlt}
            fill
            sizes="144px"
            className="object-cover"
          />
        ) : null}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl leading-tight font-light">
              <Link href={`/prodotti/${riga.slug}`} className="hover:text-terracotta">
                {riga.nomeProdotto}
              </Link>
            </h3>
            <p className="text-testo-tenue mt-1 text-xs">
              {formatNumber(riga.altezzaCm, 0)} cm · {riga.finitura} · {formatNumber(riga.pesoKg)}{' '}
              kg
            </p>
            {riga.isUnique ? (
              <p className="text-terracotta mt-1 text-xs">Pezzo unico</p>
            ) : riga.isMadeToOrder && riga.disponibili > 0 && riga.leadTimeDays > 0 ? (
              <p className="text-testo-tenue mt-1 text-xs">
                Lo colo per te: {riga.leadTimeDays} giorni
              </p>
            ) : null}
          </div>
          <p className="shrink-0 tabular-nums">{formatPrice(riga.totaleCents)}</p>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="border-bordo flex items-center border">
            <button
              type="button"
              onClick={() => cambia(riga.quantita - 1)}
              disabled={inCorso || riga.quantita <= 1}
              className="text-antracite hover:bg-tufo p-2.5 transition-colors duration-300 disabled:opacity-40"
              aria-label="Togline uno"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-8 text-center text-sm tabular-nums" aria-live="polite">
              {riga.quantita}
            </span>
            <button
              type="button"
              onClick={() => cambia(riga.quantita + 1)}
              disabled={inCorso || !puoAumentare}
              className="text-antracite hover:bg-tufo p-2.5 transition-colors duration-300 disabled:opacity-40"
              aria-label="Aggiungine uno"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={rimuovi}
            disabled={inCorso}
            className="text-testo-tenue hover:text-errore flex items-center gap-1.5 text-xs transition-colors duration-300"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Togli
          </button>
        </div>
      </div>
    </article>
  )
}
