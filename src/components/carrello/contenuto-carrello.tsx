'use client'

import Link from 'next/link'
import { useCarrello } from '@/components/carrello/contesto-carrello'
import { RigaCarrello } from '@/components/carrello/riga-carrello'
import { CodiceSconto } from '@/components/carrello/codice-sconto'
import { SpedizioneCarrello } from '@/components/carrello/spedizione-carrello'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'

export function ContenutoCarrello() {
  const { carrello, numeroPezzi } = useCarrello()

  if (carrello.righe.length === 0) {
    // Svuotando il carrello dalla pagina stessa non si resta davanti a una lista vuota.
    return (
      <div className="border-bordo bg-tufo mt-12 border px-6 py-20 text-center">
        <p className="font-display text-2xl font-light">Hai tolto tutto.</p>
        <Button asChild variant="secondario" className="mt-7">
          <Link href="/collezioni">Torna alle collezioni</Link>
        </Button>
      </div>
    )
  }

  const totaleCents = carrello.subtotaleCents - carrello.scontoCents

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div className="space-y-10">
        {carrello.righe.map((riga) => (
          <RigaCarrello key={riga.variantId} riga={riga} />
        ))}
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border-bordo bg-tufo border p-6">
          <h2 className="occhiello">Riepilogo</h2>

          <div className="mt-5 space-y-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-testo-tenue">
                Subtotale · {numeroPezzi} {numeroPezzi === 1 ? 'pezzo' : 'pezzi'}
              </span>
              <span className="tabular-nums">{formatPrice(carrello.subtotaleCents)}</span>
            </div>
            {carrello.scontoCents > 0 ? (
              <div className="text-oliva flex items-baseline justify-between gap-4">
                <span>Sconto {carrello.codiceSconto}</span>
                <span className="tabular-nums">−{formatPrice(carrello.scontoCents)}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-5">
            <CodiceSconto />
          </div>

          <div className="mt-5">
            <SpedizioneCarrello />
          </div>

          <div className="border-cemento mt-6 flex items-baseline justify-between gap-4 border-t pt-5">
            <span className="font-medium">Totale merce</span>
            <span className="text-xl tabular-nums">{formatPrice(totaleCents)}</span>
          </div>
          <p className="text-testo-tenue mt-1 text-xs">
            La spedizione si somma al passo successivo, dopo che hai scelto come riceverlo.
          </p>

          <Button asChild className="mt-6 w-full" size="lg">
            <Link href="/checkout">Vai al pagamento</Link>
          </Button>

          <p className="text-testo-tenue mt-4 text-xs leading-relaxed">
            Puoi anche ritirarlo gratis in laboratorio a Cerveteri: lo scegli al passo successivo.
            Non serve registrarsi per comprare.
          </p>
        </div>
      </aside>
    </div>
  )
}
