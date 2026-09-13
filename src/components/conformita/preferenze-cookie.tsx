'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { leggiConsenso, scriviConsenso, type Consenso } from '@/lib/conformita/consenso'

/** Il pannello nella pagina dei cookie: si può cambiare idea in qualunque momento. */
export function PreferenzeCookie() {
  const [consenso, setConsenso] = useState<Consenso | null>(null)
  const [montato, setMontato] = useState(false)

  useEffect(() => {
    setConsenso(leggiConsenso())
    setMontato(true)
  }, [])

  if (!montato) return null

  function scegli(nuovo: Consenso) {
    scriviConsenso(nuovo)
    setConsenso(nuovo)
  }

  return (
    <div className="border-bordo bg-tufo mt-6 border p-5">
      <p className="text-sm">
        {consenso === 'tutti'
          ? 'Adesso hai accettato anche la misurazione delle visite.'
          : consenso === 'necessari'
            ? 'Adesso stai usando solo i cookie necessari.'
            : 'Non hai ancora scelto: per ora è attivo solo il minimo indispensabile.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          variant={consenso === 'necessari' ? 'scuro' : 'secondario'}
          size="sm"
          onClick={() => scegli('necessari')}
        >
          Solo i necessari
        </Button>
        <Button
          variant={consenso === 'tutti' ? 'scuro' : 'secondario'}
          size="sm"
          onClick={() => scegli('tutti')}
        >
          Accetta anche la misurazione
        </Button>
      </div>
    </div>
  )
}
