import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  BadgePercent,
  FileText,
  LayoutGrid,
  MessageSquareQuote,
  Package,
  PencilRuler,
  Receipt,
  Star,
  Truck,
} from 'lucide-react'
import { sessioneUtente } from '@/lib/auth'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: { default: 'Pannello', template: '%s — Pannello' },
  robots: { index: false, follow: false, nocache: true },
}

const VOCI = [
  { href: '/admin', etichetta: 'Riepilogo', Icona: LayoutGrid, esatta: true },
  { href: '/admin/progetti', etichetta: 'Progetti', Icona: PencilRuler },
  { href: '/admin/ordini', etichetta: 'Ordini', Icona: Receipt },
  { href: '/admin/prodotti', etichetta: 'Prodotti', Icona: Package },
  { href: '/admin/collezioni', etichetta: 'Collezioni', Icona: LayoutGrid },
  { href: '/admin/recensioni', etichetta: 'Recensioni', Icona: Star },
  { href: '/admin/contenuti', etichetta: 'Testi', Icona: FileText },
  { href: '/admin/sconti', etichetta: 'Sconti', Icona: BadgePercent },
  { href: '/admin/spedizioni', etichetta: 'Spedizioni', Icona: Truck },
] as const

/** Le voci che stanno nella barra in basso su telefono: le più usate. */
const VOCI_MOBILE = ['/admin', '/admin/progetti', '/admin/ordini', '/admin/prodotti']

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const utente = await sessioneUtente()
  if (!utente) redirect('/accedi')
  if (utente.ruolo !== 'admin') redirect('/')

  return (
    <div className="bg-tufo flex min-h-dvh flex-col lg:flex-row">
      <aside className="border-bordo bg-calce hidden w-60 shrink-0 border-r lg:block">
        <div className="sticky top-0 flex h-dvh flex-col p-6">
          <Link href="/" className="font-display text-lg tracking-[0.2em] uppercase">
            {site.name}
          </Link>
          <p className="text-testo-tenue mt-1 text-xs">Pannello</p>

          <nav className="mt-10 flex-1" aria-label="Sezioni del pannello">
            <ul className="space-y-1">
              {VOCI.map((voce) => (
                <li key={voce.href}>
                  <Link
                    href={voce.href}
                    className="hover:bg-tufo flex items-center gap-3 px-2 py-2 text-sm transition-colors duration-300"
                  >
                    <voce.Icona aria-hidden className="text-testo-tenue size-4" />
                    {voce.etichetta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="border-bordo text-testo-tenue border-t pt-4 text-xs">
            <p className="truncate">{utente.email}</p>
            <Link href="/" className="mt-2 inline-block underline underline-offset-4">
              Torna al sito
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Su telefono l'intestazione è minima: lo schermo serve ai contenuti. */}
        <header className="border-bordo bg-calce flex items-center justify-between border-b px-5 py-3 lg:hidden">
          <Link href="/admin" className="font-display text-base tracking-[0.18em] uppercase">
            {site.name}
          </Link>
          <Link href="/" className="text-testo-tenue text-xs underline underline-offset-4">
            Sito
          </Link>
        </header>

        <main className="flex-1 px-5 pt-6 pb-6 md:px-8 md:py-10">{children}</main>

        {/* Barra in basso: il pannello lo usa un artigiano dal telefono. */}
        <nav
          aria-label="Sezioni principali"
          className="border-bordo bg-calce fixed inset-x-0 bottom-0 z-30 border-t pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="grid grid-cols-4">
            {VOCI.filter((voce) => VOCI_MOBILE.includes(voce.href)).map((voce) => (
              <li key={voce.href}>
                <Link
                  href={voce.href}
                  className="text-testo-tenue hover:text-antracite flex flex-col items-center gap-1 py-3 text-[0.7rem] transition-colors duration-300"
                >
                  <voce.Icona aria-hidden className="size-5" />
                  {voce.etichetta}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Le sezioni meno frequenti restano raggiungibili anche da telefono. */}
        <div className="border-bordo bg-calce border-t px-5 pt-4 pb-[calc(5.5rem_+_env(safe-area-inset-bottom))] lg:hidden">
          <ul className="text-testo-tenue flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {VOCI.filter((voce) => !VOCI_MOBILE.includes(voce.href)).map((voce) => (
              <li key={voce.href}>
                <Link href={voce.href} className="underline underline-offset-4">
                  {voce.etichetta}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-1.5">
              <MessageSquareQuote aria-hidden className="size-3.5" />
              <span>{utente.email}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
