import type { ReactNode } from 'react'
import { Briciole } from '@/components/layout/briciole'

/** Impaginazione condivisa delle pagine di testo: una colonna, molto respiro. */
export function PaginaTesto({
  titolo,
  occhiello,
  introduzione,
  aggiornata,
  children,
}: {
  titolo: string
  occhiello?: string
  introduzione?: string
  aggiornata?: string
  children: ReactNode
}) {
  return (
    <>
      <div className="contenitore pt-8">
        <Briciole voci={[{ etichetta: titolo }]} />
      </div>

      <article className="contenitore max-w-2xl py-12 md:py-20">
        {occhiello ? <p className="occhiello">{occhiello}</p> : null}
        <h1 className="font-display mt-5 text-4xl font-light md:text-6xl">{titolo}</h1>
        {introduzione ? (
          <p className="text-testo-tenue mt-7 text-lg leading-relaxed">{introduzione}</p>
        ) : null}

        <div className="[&_h2]:font-display mt-12 space-y-6 leading-relaxed [&_h2]:mt-14 [&_h2]:text-2xl [&_h2]:font-light [&_h2]:md:text-3xl [&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-medium [&_li]:leading-relaxed [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:[list-style:disc]">
          {children}
        </div>

        {aggiornata ? (
          <p className="border-bordo text-testo-tenue mt-16 border-t pt-6 text-sm">
            Ultimo aggiornamento: {aggiornata}.
          </p>
        ) : null}
      </article>
    </>
  )
}
