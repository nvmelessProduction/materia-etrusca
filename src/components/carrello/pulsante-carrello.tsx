'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCarrello } from '@/components/carrello/contesto-carrello'

export function PulsanteCarrello() {
  const { numeroPezzi, apri } = useCarrello()

  return (
    <>
      {/* Su schermi larghi il carrello si apre di lato, senza perdere la pagina. */}
      <button
        type="button"
        onClick={apri}
        className="text-antracite hover:text-terracotta relative hidden p-2 transition-colors duration-300 lg:inline-flex"
        aria-label={numeroPezzi > 0 ? `Carrello, ${numeroPezzi} pezzi` : 'Carrello, nessun pezzo'}
      >
        <ShoppingBag className="size-5" aria-hidden />
        <Contatore numero={numeroPezzi} />
      </button>

      {/* Su telefono si va alla pagina intera: più spazio, meno attrito. */}
      <Link
        href="/carrello"
        className="text-antracite hover:text-terracotta relative p-2 transition-colors duration-300 lg:hidden"
        aria-label={numeroPezzi > 0 ? `Carrello, ${numeroPezzi} pezzi` : 'Carrello, nessun pezzo'}
      >
        <ShoppingBag className="size-5" aria-hidden />
        <Contatore numero={numeroPezzi} />
      </Link>
    </>
  )
}

function Contatore({ numero }: { numero: number }) {
  if (numero <= 0) return null
  return (
    <span
      aria-hidden
      className="bg-terracotta text-calce absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center text-[0.625rem] leading-none font-medium"
    >
      {numero > 9 ? '9+' : numero}
    </span>
  )
}
