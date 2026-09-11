import Link from 'next/link'
import { vociPrincipali } from '@/components/layout/navigazione'
import { MenuMobile } from '@/components/layout/menu-mobile'
import { PulsanteCarrello } from '@/components/carrello/pulsante-carrello'
import { site } from '@/lib/site'

export function Intestazione() {
  return (
    <header className="border-bordo bg-calce/95 supports-[backdrop-filter]:bg-calce/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="contenitore flex h-16 items-center justify-between gap-4 md:h-20">
        <div className="flex items-center gap-2 lg:hidden">
          <MenuMobile />
        </div>

        <Link
          href="/"
          className="font-display hover:text-terracotta text-xl font-light tracking-[0.2em] uppercase transition-colors duration-300 md:text-2xl"
        >
          {site.name}
        </Link>

        <nav className="hidden lg:block" aria-label="Menu principale">
          <ul className="flex items-center gap-8">
            {vociPrincipali.map((voce) => (
              <li key={voce.href}>
                <Link
                  href={voce.href}
                  className="hover:text-terracotta text-sm transition-colors duration-300"
                >
                  {voce.etichetta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center justify-end gap-1">
          <PulsanteCarrello />
        </div>
      </div>
    </header>
  )
}
