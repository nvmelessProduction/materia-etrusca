'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { salvaProdotto, type DatiProdotto } from '@/lib/admin/azioni'

export type CollezioneScelta = { id: string; nome: string }

export function EditorProdotto({
  iniziale,
  collezioni,
}: {
  iniziale: Partial<DatiProdotto>
  collezioni: CollezioneScelta[]
}) {
  const router = useRouter()
  const [dati, setDati] = useState<DatiProdotto>({
    id: iniziale.id,
    nome: iniziale.nome ?? '',
    slug: iniziale.slug ?? '',
    collezioneId: iniziale.collezioneId ?? null,
    descrizione: iniziale.descrizione ?? '',
    storia: iniziale.storia ?? '',
    prezzoBaseCents: iniziale.prezzoBaseCents ?? 0,
    pezzoUnico: iniziale.pezzoUnico ?? false,
    suOrdinazione: iniziale.suOrdinazione ?? false,
    giorniDiAttesa: iniziale.giorniDiAttesa ?? 0,
    interno: iniziale.interno ?? true,
    esterno: iniziale.esterno ?? true,
    resistenteGelo: iniziale.resistenteGelo ?? false,
    cura: iniziale.cura ?? '',
    stato: iniziale.stato ?? 'draft',
    seoTitle: iniziale.seoTitle ?? '',
    seoDescription: iniziale.seoDescription ?? '',
  })
  const [inCorso, avvia] = useTransition()

  function imposta<K extends keyof DatiProdotto>(chiave: K, valore: DatiProdotto[K]) {
    setDati((precedenti) => ({ ...precedenti, [chiave]: valore }))
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nome-prodotto">Nome</Label>
          <Input
            id="nome-prodotto"
            value={dati.nome}
            onChange={(evento) => imposta('nome', evento.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="slug-prodotto" className="flex items-baseline gap-2">
            Indirizzo
            <span className="text-testo-tenue text-xs font-normal">si compila da sé</span>
          </Label>
          <Input
            id="slug-prodotto"
            value={dati.slug ?? ''}
            onChange={(evento) => imposta('slug', evento.target.value)}
            placeholder="kyathos"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="collezione">Collezione</Label>
          <Select
            id="collezione"
            value={dati.collezioneId ?? ''}
            onChange={(evento) => imposta('collezioneId', evento.target.value || null)}
            className="mt-1.5"
          >
            <option value="">Fuori collezione</option>
            {collezioni.map((collezione) => (
              <option key={collezione.id} value={collezione.id}>
                {collezione.nome}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="prezzo-base">Prezzo base (€)</Label>
          <Input
            id="prezzo-base"
            inputMode="decimal"
            value={(dati.prezzoBaseCents / 100).toString()}
            onChange={(evento) =>
              imposta(
                'prezzoBaseCents',
                Math.round((Number.parseFloat(evento.target.value.replace(',', '.')) || 0) * 100),
              )
            }
            className="mt-1.5"
          />
          <p className="text-testo-tenue mt-1.5 text-xs">
            Vale solo se una variante non ha un prezzo suo.
          </p>
        </div>

        <div>
          <Label htmlFor="stato-prodotto">Stato</Label>
          <Select
            id="stato-prodotto"
            value={dati.stato}
            onChange={(evento) => imposta('stato', evento.target.value as DatiProdotto['stato'])}
            className="mt-1.5"
          >
            <option value="draft">Bozza</option>
            <option value="active">In vetrina</option>
            <option value="archived">Archiviato</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="descrizione">Descrizione</Label>
        <Textarea
          id="descrizione"
          rows={6}
          value={dati.descrizione}
          onChange={(evento) => imposta('descrizione', evento.target.value)}
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="storia">Da dove viene</Label>
        <p className="text-testo-tenue mt-1.5 text-xs">
          Due righe sull’ispirazione etrusca. Compaiono in grande sulla scheda.
        </p>
        <Textarea
          id="storia"
          rows={3}
          value={dati.storia ?? ''}
          onChange={(evento) => imposta('storia', evento.target.value)}
          className="mt-3"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="occhiello">Com’è fatto</legend>
        <Spunta
          id="pezzo-unico"
          attiva={dati.pezzoUnico ?? false}
          onChange={(valore) => imposta('pezzoUnico', valore)}
          etichetta="Pezzo unico"
          nota="Ne esiste uno solo. Non potrà mai essere venduto due volte."
        />
        <Spunta
          id="su-ordinazione"
          attiva={dati.suOrdinazione ?? false}
          onChange={(valore) => imposta('suOrdinazione', valore)}
          etichetta="Su ordinazione"
          nota="Si vende anche a giacenza zero, dichiarando l’attesa."
        />
        {dati.suOrdinazione ? (
          <div className="w-40 pl-8">
            <Label htmlFor="attesa">Giorni di attesa</Label>
            <Input
              id="attesa"
              type="number"
              min={0}
              max={365}
              value={dati.giorniDiAttesa ?? 0}
              onChange={(evento) =>
                imposta('giorniDiAttesa', Number.parseInt(evento.target.value, 10) || 0)
              }
              className="mt-1.5"
            />
          </div>
        ) : null}
        <Spunta
          id="interno"
          attiva={dati.interno ?? true}
          onChange={(valore) => imposta('interno', valore)}
          etichetta="Sta bene dentro"
        />
        <Spunta
          id="esterno"
          attiva={dati.esterno ?? true}
          onChange={(valore) => imposta('esterno', valore)}
          etichetta="Sta bene fuori"
        />
        <Spunta
          id="gelo"
          attiva={dati.resistenteGelo ?? false}
          onChange={(valore) => imposta('resistenteGelo', valore)}
          etichetta="Resiste al gelo"
          nota="Si può lasciare fuori d’inverno, sollevato da terra."
        />
      </fieldset>

      <div>
        <Label htmlFor="cura">Come si tiene</Label>
        <Textarea
          id="cura"
          rows={5}
          value={dati.cura ?? ''}
          onChange={(evento) => imposta('cura', evento.target.value)}
          className="mt-1.5"
        />
      </div>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="occhiello sm:col-span-2">Per i motori di ricerca</legend>
        <div>
          <Label htmlFor="seo-title">Titolo</Label>
          <Input
            id="seo-title"
            value={dati.seoTitle ?? ''}
            onChange={(evento) => imposta('seoTitle', evento.target.value)}
            className="mt-1.5"
            maxLength={180}
          />
        </div>
        <div>
          <Label htmlFor="seo-description">Descrizione</Label>
          <Input
            id="seo-description"
            value={dati.seoDescription ?? ''}
            onChange={(evento) => imposta('seoDescription', evento.target.value)}
            className="mt-1.5"
            maxLength={320}
          />
        </div>
      </fieldset>

      <div className="border-bordo border-t pt-6">
        <Button
          disabled={inCorso || dati.nome.trim().length < 2}
          onClick={() =>
            avvia(async () => {
              const esito = await salvaProdotto(dati)
              if (!esito.ok) {
                toast.error(esito.messaggio ?? 'Non ha funzionato.')
                return
              }
              toast.success(esito.messaggio ?? 'Salvato.')
              if (!dati.id && esito.id) router.push(`/admin/prodotti/${esito.id}`)
              else router.refresh()
            })
          }
        >
          {inCorso ? 'Salvo…' : 'Salva'}
        </Button>
      </div>
    </div>
  )
}

function Spunta({
  id,
  attiva,
  onChange,
  etichetta,
  nota,
}: {
  id: string
  attiva: boolean
  onChange: (valore: boolean) => void
  etichetta: string
  nota?: string
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <Checkbox
        id={id}
        checked={attiva}
        onCheckedChange={(stato) => onChange(stato === true)}
        className="mt-0.5"
      />
      <span>
        <span className="block text-sm">{etichetta}</span>
        {nota ? <span className="text-testo-tenue mt-0.5 block text-xs">{nota}</span> : null}
      </span>
    </label>
  )
}
