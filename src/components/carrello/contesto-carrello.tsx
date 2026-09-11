'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { CarrelloPubblico } from '@/lib/carrello/tipi'
import { carrelloVuoto } from '@/lib/carrello/tipi'

type ValoreCarrello = {
  carrello: CarrelloPubblico
  numeroPezzi: number
  pannelloAperto: boolean
  apri: () => void
  chiudi: () => void
  /** Sostituisce lo stato con quello restituito dal server (unica fonte di verità sui prezzi). */
  sincronizza: (nuovo: CarrelloPubblico) => void
}

const ContestoCarrello = createContext<ValoreCarrello | null>(null)

export function ProviderCarrello({
  children,
  iniziale,
}: {
  children: React.ReactNode
  iniziale: CarrelloPubblico
}) {
  const [carrello, setCarrello] = useState<CarrelloPubblico>(iniziale)
  const [pannelloAperto, setPannelloAperto] = useState(false)

  const apri = useCallback(() => setPannelloAperto(true), [])
  const chiudi = useCallback(() => setPannelloAperto(false), [])
  const sincronizza = useCallback((nuovo: CarrelloPubblico) => setCarrello(nuovo), [])

  const valore = useMemo<ValoreCarrello>(
    () => ({
      carrello,
      numeroPezzi: carrello.righe.reduce((somma, riga) => somma + riga.quantita, 0),
      pannelloAperto,
      apri,
      chiudi,
      sincronizza,
    }),
    [carrello, pannelloAperto, apri, chiudi, sincronizza],
  )

  return <ContestoCarrello.Provider value={valore}>{children}</ContestoCarrello.Provider>
}

export function useCarrello(): ValoreCarrello {
  const valore = useContext(ContestoCarrello)
  if (!valore) {
    // Non si arriva mai qui: il provider avvolge tutto il sito nel layout radice.
    return {
      carrello: carrelloVuoto,
      numeroPezzi: 0,
      pannelloAperto: false,
      apri: () => {},
      chiudi: () => {},
      sincronizza: () => {},
    }
  }
  return valore
}
