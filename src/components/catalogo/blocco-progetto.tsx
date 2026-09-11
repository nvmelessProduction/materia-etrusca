import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * L'invito a mandare la foto. Compare a metà catalogo, sulla scheda prodotto
 * e in home: è la funzione che regge tutto il sito, va incontrata spesso.
 */
export function BloccoProgetto({
  variante = 'scuro',
  className,
  titolo = 'Non trovi la misura giusta?',
  testo = 'Mandami la foto del tuo spazio. Guardo esposizione, proporzioni e colori, e ti scrivo quali pezzi ci starebbero e perché. Ci metto tre giorni, non costa niente e non serve registrarsi.',
  azione = 'Mandami la foto',
}: {
  variante?: 'scuro' | 'chiaro'
  className?: string
  titolo?: string
  testo?: string
  azione?: string
}) {
  const scuro = variante === 'scuro'

  return (
    <section
      className={cn(
        'px-6 py-14 md:px-12 md:py-20',
        scuro ? 'bg-antracite text-calce' : 'border-bordo bg-tufo text-antracite border',
        className,
      )}
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className={cn('occhiello', scuro && 'text-cemento')}>Progetta il tuo angolo</p>
        <h2 className="font-display mt-5 text-3xl font-light md:text-5xl">{titolo}</h2>
        <p
          className={cn('mt-5 text-base leading-relaxed', scuro ? 'text-tufo' : 'text-testo-tenue')}
        >
          {testo}
        </p>
        <div className="mt-9">
          <Button asChild variant={scuro ? 'primario' : 'scuro'} size="lg">
            <Link href="/progetto">{azione}</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
