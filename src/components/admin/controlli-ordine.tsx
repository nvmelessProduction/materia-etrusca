'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AzioneConConferma } from '@/components/admin/azione'
import { cambiaStatoOrdine, salvaTracking, segnaBonificoIncassato } from '@/lib/admin/azioni'

const STATI = [
  { valore: 'pending', etichetta: 'In attesa' },
  { valore: 'paid', etichetta: 'Pagato' },
  { valore: 'processing', etichetta: 'In preparazione' },
  { valore: 'shipped', etichetta: 'Spedito' },
  { valore: 'delivered', etichetta: 'Consegnato' },
  { valore: 'cancelled', etichetta: 'Annullato' },
  { valore: 'refunded', etichetta: 'Rimborsato' },
] as const

const CORRIERI = ['BRT', 'GLS', 'DHL', 'SDA', 'Poste Italiane', 'Trasportatore locale', 'Ritirato']

export function ControlliOrdine({
  ordineId,
  stato,
  corriereIniziale,
  trackingIniziale,
  attesaBonifico,
}: {
  ordineId: string
  stato: string
  corriereIniziale: string
  trackingIniziale: string
  attesaBonifico: boolean
}) {
  const [nuovoStato, setNuovoStato] = useState(stato)
  const [corriere, setCorriere] = useState(corriereIniziale || CORRIERI[0] || 'BRT')
  const [tracking, setTracking] = useState(trackingIniziale)
  const [inCorso, avvia] = useTransition()

  return (
    <div className="space-y-8">
      {attesaBonifico ? (
        <section className="border-terracotta bg-terracotta/5 border p-4">
          <p className="text-sm font-medium">Bonifico non ancora incassato</p>
          <p className="text-testo-tenue mt-1.5 text-sm">
            Quando lo vedi arrivare, segnalo qui: è il momento in cui scalo le giacenze e mando la
            conferma al cliente.
          </p>
          <AzioneConConferma
            variant="scuro"
            className="mt-4"
            titolo="Hai visto il bonifico?"
            descrizione="Segnando l'ordine come pagato scalo le giacenze e mando la conferma al cliente. Se nel frattempo un pezzo unico è stato venduto, te lo dico e non faccio niente."
            conferma="Sì, l'ho ricevuto"
            esegui={() => segnaBonificoIncassato(ordineId)}
          >
            Ho ricevuto il bonifico
          </AzioneConConferma>
        </section>
      ) : null}

      <section>
        <h2 className="occhiello">Spedizione</h2>
        <p className="text-testo-tenue mt-2 text-sm">
          Inserendo il tracking l’ordine passa a “spedito” e parte l’email al cliente.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="corriere">Corriere</Label>
            <Select
              id="corriere"
              value={corriere}
              onChange={(evento) => setCorriere(evento.target.value)}
              className="mt-1.5"
            >
              {CORRIERI.map((voce) => (
                <option key={voce} value={voce}>
                  {voce}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="tracking">Codice di spedizione</Label>
            <Input
              id="tracking"
              value={tracking}
              onChange={(evento) => setTracking(evento.target.value)}
              className="mt-1.5"
              autoComplete="off"
            />
          </div>
        </div>
        <Button
          className="mt-4"
          disabled={inCorso || tracking.trim().length < 3}
          onClick={() =>
            avvia(async () => {
              const esito = await salvaTracking(ordineId, corriere, tracking)
              if (esito.ok) toast.success(esito.messaggio ?? 'Salvato.')
              else toast.error(esito.messaggio ?? 'Non ha funzionato.')
            })
          }
        >
          Segna spedito e avvisa
        </Button>
      </section>

      <section>
        <h2 className="occhiello">Cambia stato a mano</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="w-56">
            <Label htmlFor="stato-ordine" className="sr-only">
              Stato
            </Label>
            <Select
              id="stato-ordine"
              value={nuovoStato}
              onChange={(evento) => setNuovoStato(evento.target.value)}
            >
              {STATI.map((voce) => (
                <option key={voce.valore} value={voce.valore}>
                  {voce.etichetta}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="secondario"
            disabled={inCorso || nuovoStato === stato}
            onClick={() =>
              avvia(async () => {
                const esito = await cambiaStatoOrdine(
                  ordineId,
                  nuovoStato as (typeof STATI)[number]['valore'],
                )
                if (esito.ok) toast.success(esito.messaggio ?? 'Fatto.')
                else toast.error(esito.messaggio ?? 'Non ha funzionato.')
              })
            }
          >
            Applica
          </Button>
        </div>
        <p className="text-testo-tenue mt-2 text-xs">
          Cambiare stato qui non manda email al cliente, tranne quando inserisci il tracking.
        </p>
      </section>
    </div>
  )
}
