'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { leggiConsenso } from '@/lib/conformita/consenso'

/**
 * Lo script di misurazione viene **montato solo dopo** il consenso: prima di
 * quel momento non esiste nel documento, non viene scaricato e non può
 * scrivere niente. Bloccarlo davvero è diverso da caricarlo e ignorarlo.
 *
 * Senza `NEXT_PUBLIC_ANALYTICS_SRC` configurata non si carica nulla, mai.
 */
export function ScriptMisurazione() {
  const indirizzo = process.env.NEXT_PUBLIC_ANALYTICS_SRC
  const dominio = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN
  const [consentito, setConsentito] = useState(false)

  useEffect(() => {
    function aggiorna() {
      setConsentito(leggiConsenso() === 'tutti')
    }
    aggiorna()
    window.addEventListener('materia-etrusca:consenso', aggiorna)
    return () => window.removeEventListener('materia-etrusca:consenso', aggiorna)
  }, [])

  if (!indirizzo || !consentito) return null

  return <Script src={indirizzo} data-domain={dominio} strategy="afterInteractive" defer />
}
