'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { RigaCarrello } from '@/components/carrello/riga-carrello'
import { useCarrello } from '@/components/carrello/contesto-carrello'
import { formatNumber, formatPrice } from '@/lib/utils'

/**
 * Pannello laterale, usato su schermi larghi: aggiungere un pezzo non deve
 * costare la pagina che si stava guardando.
 */
export function PannelloCarrello() {
  const { carrello, pannelloAperto, chiudi, numeroPezzi } = useCarrello()

  return (
    <Sheet open={pannelloAperto} onOpenChange={(aperto) => (aperto ? undefined : chiudi())}>
      <SheetContent lato="destra" titolo="Carrello">
        {carrello.righe.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <ShoppingBag aria-hidden className="text-cemento size-8" />
            <p className="font-display mt-5 text-2xl font-light">Non hai ancora scelto nulla.</p>
            <Button asChild variant="secondario" className="mt-7" onClick={chiudi}>
              <Link href="/collezioni">Guarda le collezioni</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
              {carrello.righe.map((riga) => (
                <RigaCarrello key={riga.variantId} riga={riga} compatta />
              ))}
            </div>

            <div className="border-bordo border-t px-5 py-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-testo-tenue text-sm">
                  Subtotale · {numeroPezzi} {numeroPezzi === 1 ? 'pezzo' : 'pezzi'}
                </span>
                <span className="text-lg tabular-nums">{formatPrice(carrello.subtotaleCents)}</span>
              </div>
              <p className="text-testo-tenue mt-1 text-xs">
                {formatNumber(carrello.pesoTotaleKg)} kg con l’imballo. La spedizione si calcola al
                passo successivo.
              </p>
              <Button asChild className="mt-5 w-full" size="lg" onClick={chiudi}>
                <Link href="/carrello">Vai al carrello</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
