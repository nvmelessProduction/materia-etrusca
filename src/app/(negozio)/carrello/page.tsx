import type { Metadata } from 'next'
import Link from 'next/link'
import { leggiCarrello } from '@/lib/carrello/server'
import { ContenutoCarrello } from '@/components/carrello/contenuto-carrello'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Carrello',
  robots: { index: false, follow: false },
}

export default async function PaginaCarrello() {
  const carrello = await leggiCarrello()

  return (
    <div className="contenitore py-12 md:py-20">
      <h1 className="font-display text-4xl font-light md:text-5xl">Carrello</h1>

      {carrello.righe.length === 0 ? (
        <div className="border-bordo bg-tufo mt-12 border px-6 py-20 text-center">
          <p className="font-display text-2xl font-light">Non hai ancora scelto nulla.</p>
          <p className="text-testo-tenue mx-auto mt-3 max-w-md text-sm">
            Se non sai da dove cominciare, mandami la foto del tuo spazio: ti dico io quali pezzi ci
            starebbero.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/collezioni"
              className="border-antracite hover:bg-antracite hover:text-calce inline-flex h-12 items-center border px-6 text-sm transition-colors duration-300"
            >
              Guarda le collezioni
            </Link>
            <Link
              href="/progetto"
              className="bg-terracotta text-calce hover:bg-terracotta-scuro inline-flex h-12 items-center px-6 text-sm transition-colors duration-300"
            >
              Mandami la foto
            </Link>
          </div>
        </div>
      ) : (
        <ContenutoCarrello />
      )}
    </div>
  )
}
