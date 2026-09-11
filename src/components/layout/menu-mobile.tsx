'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { vociPrincipali, vociAssistenza } from '@/components/layout/navigazione'
import { cn } from '@/lib/utils'

export function MenuMobile() {
  const [aperto, setAperto] = useState(false)
  const pathname = usePathname()

  // Cambiando pagina il pannello si chiude da sé.
  useEffect(() => {
    setAperto(false)
  }, [pathname])

  return (
    <Sheet open={aperto} onOpenChange={setAperto}>
      <SheetTrigger
        className="text-antracite hover:text-terracotta -ml-2 p-2 transition-colors duration-300 lg:hidden"
        aria-label="Apri il menu"
      >
        <Menu className="size-6" />
      </SheetTrigger>
      <SheetContent lato="sinistra" titolo="Menu">
        <nav
          className="flex flex-1 flex-col overflow-y-auto px-5 py-8"
          aria-label="Menu principale"
        >
          <ul className="space-y-1">
            {vociPrincipali.map((voce) => (
              <li key={voce.href}>
                <Link
                  href={voce.href}
                  className={cn(
                    'font-display hover:text-terracotta block py-3 text-3xl font-light transition-colors duration-300',
                    pathname.startsWith(voce.href) && 'text-terracotta',
                  )}
                >
                  {voce.etichetta}
                </Link>
              </li>
            ))}
          </ul>

          <ul className="border-bordo mt-10 space-y-2 border-t pt-8">
            {vociAssistenza.map((voce) => (
              <li key={voce.href}>
                <Link
                  href={voce.href}
                  className="text-testo-tenue hover:text-antracite block py-1.5 text-sm transition-colors duration-300"
                >
                  {voce.etichetta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
