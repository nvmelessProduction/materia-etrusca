'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { leggiConsenso, scriviConsenso, type Consenso } from '@/lib/conformita/consenso'

/**
 * Banner del consenso. Rifiutare costa **un clic**, esattamente come accettare:
 * i due pulsanti hanno lo stesso peso e nessuno dei due è nascosto.
 * Finché non si sceglie, gli script di misurazione non vengono caricati.
 */
export function BannerCookie() {
  const [visibile, setVisibile] = useState(false)

  useEffect(() => {
    // Si legge dopo il montaggio: il server non sa cosa ha scelto questo browser.
    setVisibile(leggiConsenso() === null)

    function suCambio() {
      setVisibile(leggiConsenso() === null)
    }
    window.addEventListener('materia-etrusca:consenso', suCambio)
    return () => window.removeEventListener('materia-etrusca:consenso', suCambio)
  }, [])

  if (!visibile) return null

  function scegli(consenso: Consenso) {
    scriviConsenso(consenso)
    setVisibile(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Preferenze sui cookie"
      className="border-bordo bg-calce fixed inset-x-0 bottom-0 z-50 border-t"
    >
      <div className="contenitore flex flex-col gap-5 py-5 md:flex-row md:items-center md:justify-between md:gap-10">
        <p className="max-w-2xl text-sm leading-relaxed">
          Uso i cookie tecnici che servono al carrello e all’accesso: quelli non si possono
          togliere. Posso anche contare le visite in forma aggregata, ma solo se me lo permetti.{' '}
          <Link href="/cookie" className="underline underline-offset-4">
            Come funziona
          </Link>
        </p>

        <div className="flex shrink-0 gap-3">
          <Button variant="secondario" onClick={() => scegli('necessari')}>
            Solo i necessari
          </Button>
          <Button variant="scuro" onClick={() => scegli('tutti')}>
            Va bene tutto
          </Button>
        </div>
      </div>
    </div>
  )
}
