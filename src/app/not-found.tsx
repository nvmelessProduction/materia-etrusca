import Link from 'next/link'
import type { Metadata } from 'next'
import { Intestazione } from '@/components/layout/intestazione'
import { Piede } from '@/components/layout/piede'

export const metadata: Metadata = {
  title: 'Pagina non trovata',
  robots: { index: false, follow: true },
}

/** La 404 sta fuori dal gruppo (negozio): l'intestazione va rimessa a mano. */
export default function NonTrovata() {
  return (
    <>
      <Intestazione />
      <main className="flex-1">
        <div className="contenitore max-w-xl py-24 text-center md:py-36">
          <p className="occhiello">Errore 404</p>
          <h1 className="font-display mt-6 text-5xl font-light md:text-7xl">Qui non c’è niente.</h1>
          <p className="text-testo-tenue mt-7 leading-relaxed">
            Capita: un pezzo archiviato, un link vecchio, un indirizzo scritto male. Non è colpa
            tua, e non si è rotto niente.
          </p>

          <nav aria-label="Dove andare" className="mt-12">
            <ul className="flex flex-col items-center gap-4">
              <li>
                <Link
                  href="/collezioni"
                  className="bg-terracotta text-calce hover:bg-terracotta-scuro inline-flex h-12 items-center px-6 text-sm transition-colors duration-300"
                >
                  Guarda le collezioni
                </Link>
              </li>
              <li className="text-testo-tenue text-sm">
                oppure{' '}
                <Link
                  href="/progetto"
                  className="hover:text-antracite underline underline-offset-4"
                >
                  mandami la foto del tuo spazio
                </Link>{' '}
                e ti dico io cosa ci starebbe
              </li>
              <li className="text-testo-tenue text-sm">
                <Link
                  href="/contatti"
                  className="hover:text-antracite underline underline-offset-4"
                >
                  Scrivimi
                </Link>{' '}
                se stavi cercando qualcosa in particolare
              </li>
            </ul>
          </nav>
        </div>
      </main>
      <Piede />
    </>
  )
}
