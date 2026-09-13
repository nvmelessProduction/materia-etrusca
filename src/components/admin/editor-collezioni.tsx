'use client'

import { useState, useTransition } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { AzioneConConferma } from '@/components/admin/azione'
import { archiviaCollezione, riordinaCollezioni, salvaCollezione } from '@/lib/admin/azioni'

export type CollezioneEditor = {
  id: string
  nome: string
  slug: string
  descrizione: string
  heroImageUrl: string
  posizione: number
  prodotti: number
  archiviata: boolean
  seoTitle: string
  seoDescription: string
}

export function EditorCollezioni({ collezioni }: { collezioni: CollezioneEditor[] }) {
  const [ordine, setOrdine] = useState(collezioni)
  const [inModifica, setInModifica] = useState<string | 'nuova' | null>(null)
  const [inCorso, avvia] = useTransition()

  function sposta(indice: number, direzione: -1 | 1) {
    const prossimo = indice + direzione
    if (prossimo < 0 || prossimo >= ordine.length) return

    const copia = [...ordine]
    const [voce] = copia.splice(indice, 1)
    if (voce) copia.splice(prossimo, 0, voce)
    setOrdine(copia)

    avvia(async () => {
      const esito = await riordinaCollezioni(copia.map((collezione) => collezione.id))
      if (!esito.ok) toast.error(esito.messaggio ?? 'Non ha funzionato.')
    })
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {ordine.map((collezione, indice) => (
          <li key={collezione.id} className="border-bordo bg-calce border p-4">
            {inModifica === collezione.id ? (
              <ModuloCollezione collezione={collezione} onChiudi={() => setInModifica(null)} />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => sposta(indice, -1)}
                      disabled={indice === 0 || inCorso}
                      className="text-testo-tenue p-1 disabled:opacity-30"
                      aria-label="Sposta su"
                    >
                      <ArrowUp className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => sposta(indice, 1)}
                      disabled={indice === ordine.length - 1 || inCorso}
                      className="text-testo-tenue p-1 disabled:opacity-30"
                      aria-label="Sposta giù"
                    >
                      <ArrowDown className="size-4" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">
                      {collezione.nome}
                      {collezione.archiviata ? (
                        <span className="text-testo-tenue ml-2 text-xs">archiviata</span>
                      ) : null}
                    </p>
                    <p className="text-testo-tenue mt-1 text-xs">
                      /collezioni/{collezione.slug} · {collezione.prodotti}{' '}
                      {collezione.prodotti === 1 ? 'pezzo' : 'pezzi'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="tenue" size="sm" onClick={() => setInModifica(collezione.id)}>
                    Modifica
                  </Button>
                  {!collezione.archiviata ? (
                    <AzioneConConferma
                      titolo="Archiviare la collezione?"
                      descrizione="Sparisce dalla vetrina. I prodotti restano dove sono e si possono spostare in un'altra collezione."
                      conferma="Archivia"
                      esegui={() => archiviaCollezione(collezione.id)}
                    >
                      Archivia
                    </AzioneConConferma>
                  ) : null}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {inModifica === 'nuova' ? (
        <div className="border-antracite bg-calce border p-4">
          <ModuloCollezione onChiudi={() => setInModifica(null)} />
        </div>
      ) : (
        <Button variant="secondario" size="sm" onClick={() => setInModifica('nuova')}>
          Nuova collezione
        </Button>
      )}
    </div>
  )
}

function ModuloCollezione({
  collezione,
  onChiudi,
}: {
  collezione?: CollezioneEditor
  onChiudi: () => void
}) {
  const [dati, setDati] = useState({
    nome: collezione?.nome ?? '',
    slug: collezione?.slug ?? '',
    descrizione: collezione?.descrizione ?? '',
    heroImageUrl: collezione?.heroImageUrl ?? '',
    posizione: collezione?.posizione ?? 0,
    seoTitle: collezione?.seoTitle ?? '',
    seoDescription: collezione?.seoDescription ?? '',
  })
  const [inCorso, avvia] = useTransition()

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="nome-collezione">Nome</Label>
          <Input
            id="nome-collezione"
            value={dati.nome}
            onChange={(evento) => setDati({ ...dati, nome: evento.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="slug-collezione">Indirizzo</Label>
          <Input
            id="slug-collezione"
            value={dati.slug}
            onChange={(evento) => setDati({ ...dati, slug: evento.target.value })}
            placeholder="buccheri"
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="hero-collezione">Foto d’apertura</Label>
          <Input
            id="hero-collezione"
            value={dati.heroImageUrl}
            onChange={(evento) => setDati({ ...dati, heroImageUrl: evento.target.value })}
            placeholder="https://…"
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="descrizione-collezione">Descrizione</Label>
          <Textarea
            id="descrizione-collezione"
            rows={3}
            value={dati.descrizione}
            onChange={(evento) => setDati({ ...dati, descrizione: evento.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="seo-title-collezione">Titolo SEO</Label>
          <Input
            id="seo-title-collezione"
            value={dati.seoTitle}
            onChange={(evento) => setDati({ ...dati, seoTitle: evento.target.value })}
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="seo-desc-collezione">Descrizione SEO</Label>
          <Input
            id="seo-desc-collezione"
            value={dati.seoDescription}
            onChange={(evento) => setDati({ ...dati, seoDescription: evento.target.value })}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          size="sm"
          disabled={inCorso || dati.nome.trim().length < 2}
          onClick={() =>
            avvia(async () => {
              const esito = await salvaCollezione({ id: collezione?.id, ...dati })
              if (esito.ok) {
                toast.success(esito.messaggio ?? 'Salvata.')
                onChiudi()
              } else toast.error(esito.messaggio ?? 'Non ha funzionato.')
            })
          }
        >
          {inCorso ? 'Salvo…' : 'Salva'}
        </Button>
        <Button variant="fantasma" size="sm" onClick={onChiudi}>
          Lascia stare
        </Button>
      </div>
    </div>
  )
}
