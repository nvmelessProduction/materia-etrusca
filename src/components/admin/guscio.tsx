import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function TitoloAdmin({
  titolo,
  sottotitolo,
  azione,
}: {
  titolo: string
  sottotitolo?: string
  azione?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-light md:text-4xl">{titolo}</h1>
        {sottotitolo ? <p className="text-testo-tenue mt-2 text-sm">{sottotitolo}</p> : null}
      </div>
      {azione}
    </div>
  )
}

export function Scheda({
  children,
  className,
  href,
}: {
  children: ReactNode
  className?: string
  href?: string
}) {
  const classi = cn('border border-bordo bg-calce p-4 md:p-5', className)
  if (href) {
    return (
      <Link
        href={href}
        className={cn(classi, 'hover:border-antracite block transition-colors duration-300')}
      >
        {children}
      </Link>
    )
  }
  return <div className={classi}>{children}</div>
}

export function Dato({
  etichetta,
  valore,
  nota,
}: {
  etichetta: string
  valore: string
  nota?: string
}) {
  return (
    <div>
      <p className="occhiello">{etichetta}</p>
      <p className="font-display mt-2 text-3xl font-light tabular-nums md:text-4xl">{valore}</p>
      {nota ? <p className="text-testo-tenue mt-1 text-xs">{nota}</p> : null}
    </div>
  )
}

const COLORI_STATO: Record<string, string> = {
  pending: 'border-cemento text-testo-tenue',
  paid: 'border-oliva text-oliva',
  processing: 'border-terracotta text-terracotta',
  shipped: 'border-antracite text-antracite',
  delivered: 'border-oliva bg-oliva text-calce',
  cancelled: 'border-cemento text-testo-tenue line-through',
  refunded: 'border-cemento text-testo-tenue',
  new: 'border-terracotta text-terracotta',
  in_progress: 'border-antracite text-antracite',
  sent: 'border-oliva text-oliva',
  converted: 'border-oliva bg-oliva text-calce',
  expired: 'border-cemento text-testo-tenue',
  draft: 'border-cemento text-testo-tenue',
  active: 'border-oliva text-oliva',
  archived: 'border-cemento text-testo-tenue',
}

export const ETICHETTE_STATO: Record<string, string> = {
  pending: 'In attesa',
  paid: 'Pagato',
  processing: 'In preparazione',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
  refunded: 'Rimborsato',
  new: 'Nuova',
  in_progress: 'In lavorazione',
  sent: 'Inviata',
  converted: 'Convertita',
  expired: 'Scaduta',
  draft: 'Bozza',
  active: 'In vetrina',
  archived: 'Archiviato',
}

export function Stato({ stato }: { stato: string }) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 border px-2 py-0.5 text-[0.7rem] tracking-[0.12em] uppercase',
        COLORI_STATO[stato] ?? 'border-cemento text-testo-tenue',
      )}
    >
      {ETICHETTE_STATO[stato] ?? stato}
    </span>
  )
}
