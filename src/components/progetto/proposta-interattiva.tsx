'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Printer } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { useCarrello } from '@/components/carrello/contesto-carrello'
import { aggiungiPropostaAlCarrello, chiediModifica } from '@/lib/progetto/azioni'
import type { VocePropostaPubblica } from '@/db/queries/progetti'
import { cn, formatNumber, formatPrice } from '@/lib/utils'

export function PropostaInterattiva({
  token,
  voci,
  scaduta,
  whatsapp,
  email,
}: {
  token: string
  voci: VocePropostaPubblica[]
  scaduta: boolean
  whatsapp: string
  email: string
}) {
  const router = useRouter()
  const { sincronizza } = useCarrello()
  const [inclusi, setInclusi] = useState<Set<string>>(
    () => new Set(voci.filter((voce) => voce.acquistabile).map((voce) => voce.variantId)),
  )
  const [inCorso, avvia] = useTransition()

  const totaleCents = useMemo(
    () =>
      voci
        .filter((voce) => inclusi.has(voce.variantId))
        .reduce((somma, voce) => somma + voce.prezzoCents * voce.quantita, 0),
    [voci, inclusi],
  )

  const pesoTotale = useMemo(
    () =>
      voci
        .filter((voce) => inclusi.has(voce.variantId))
        .reduce((somma, voce) => somma + voce.pesoKg * voce.quantita, 0),
    [voci, inclusi],
  )

  function alterna(variantId: string) {
    setInclusi((precedenti) => {
      const prossimi = new Set(precedenti)
      if (prossimi.has(variantId)) prossimi.delete(variantId)
      else prossimi.add(variantId)
      return prossimi
    })
  }

  function aggiungiTutto() {
    avvia(async () => {
      const esito = await aggiungiPropostaAlCarrello(token, [...inclusi])
      sincronizza(esito.carrello)
      if (esito.ok) {
        toast.success(`${esito.aggiunti} ${esito.aggiunti === 1 ? 'pezzo' : 'pezzi'} nel carrello.`)
        router.push('/carrello')
      } else {
        toast.error(esito.messaggio ?? 'Non sono riuscito ad aggiungerli.')
      }
    })
  }

  return (
    <>
      <ul className="space-y-8">
        {voci.map((voce) => {
          const incluso = inclusi.has(voce.variantId)
          return (
            <li
              key={voce.id}
              className={cn(
                'flex gap-5 border p-4 transition-colors duration-300 md:p-5',
                incluso ? 'border-antracite' : 'border-bordo opacity-60',
              )}
            >
              <div className="bg-tufo relative size-24 shrink-0 overflow-hidden md:size-32">
                {voce.immagineUrl ? (
                  <Image
                    src={voce.immagineUrl}
                    alt={voce.immagineAlt}
                    fill
                    sizes="128px"
                    className="object-cover"
                  />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl leading-tight font-light">
                      <Link
                        href={`/prodotti/${voce.slug}`}
                        className="hover:text-terracotta transition-colors duration-300"
                      >
                        {voce.nomeProdotto}
                      </Link>
                    </h3>
                    <p className="text-testo-tenue mt-1 text-xs">
                      {formatNumber(voce.altezzaCm, 0)} cm · {voce.finitura} ·{' '}
                      {formatNumber(voce.pesoKg)} kg
                      {voce.quantita > 1 ? ` · ${voce.quantita} pezzi` : ''}
                    </p>
                  </div>
                  <p className="shrink-0 tabular-nums">
                    {formatPrice(voce.prezzoCents * voce.quantita)}
                  </p>
                </div>

                {voce.nota ? (
                  <p className="text-testo-tenue mt-3 text-sm leading-relaxed">{voce.nota}</p>
                ) : null}

                <div className="mt-4 print:hidden">
                  {voce.acquistabile ? (
                    <label className="inline-flex cursor-pointer items-center gap-2.5">
                      <Checkbox
                        checked={incluso}
                        onCheckedChange={() => alterna(voce.variantId)}
                        disabled={scaduta}
                      />
                      <span className="text-sm">Includi</span>
                    </label>
                  ) : (
                    <p className="text-testo-tenue text-sm">
                      Questo pezzo nel frattempo è finito. Scrivimi: lo rifaccio o ne propongo un
                      altro.
                    </p>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <div className="border-bordo mt-10 border-t pt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div>
            <p className="occhiello">Così com’è adesso</p>
            <p className="text-testo-tenue mt-2 text-sm">
              {inclusi.size} {inclusi.size === 1 ? 'pezzo' : 'pezzi'} · {formatNumber(pesoTotale)}{' '}
              kg. La spedizione si calcola dopo, sul CAP.
            </p>
          </div>
          <p className="text-3xl tabular-nums">{formatPrice(totaleCents)}</p>
        </div>

        {!scaduta ? (
          <Button
            size="lg"
            className="mt-8 w-full print:hidden"
            onClick={aggiungiTutto}
            disabled={inCorso || inclusi.size === 0}
          >
            {inCorso ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Aggiungo…
              </>
            ) : inclusi.size === voci.length ? (
              'Aggiungi tutto al carrello'
            ) : (
              `Aggiungi ${inclusi.size} ${inclusi.size === 1 ? 'pezzo' : 'pezzi'} al carrello`
            )}
          </Button>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3 print:hidden">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondario" size="sm">
                Chiedimi una modifica
              </Button>
            </DialogTrigger>
            <ModuloModifica token={token} />
          </Dialog>

          <Button variant="tenue" size="sm" onClick={() => window.print()}>
            <Printer aria-hidden />
            Salva in PDF
          </Button>

          <Button asChild variant="tenue" size="sm">
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent('Ciao, ho ricevuto la proposta e vorrei sentirti due minuti.')}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              Prenota una chiamata
            </a>
          </Button>

          <Button asChild variant="collegamento" size="sm">
            <a href={`mailto:${email}`}>Scrivimi</a>
          </Button>
        </div>
      </div>
    </>
  )
}

function ModuloModifica({ token }: { token: string }) {
  const [testo, setTesto] = useState('')
  const [esito, setEsito] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  return (
    <DialogContent
      titolo="Cosa cambieresti?"
      descrizione="Scrivimelo con parole tue. Non serve essere precisi: ci penso io a tradurlo in pezzi."
    >
      {esito ? (
        <p role="status" className="text-oliva text-sm">
          {esito}
        </p>
      ) : (
        <>
          <Textarea
            rows={5}
            value={testo}
            onChange={(evento) => setTesto(evento.target.value)}
            placeholder="Il primo è troppo alto per quell'angolo, e il secondo lo vorrei più chiaro…"
            aria-label="Cosa cambieresti"
          />
          <Button
            className="mt-4 w-full"
            disabled={inCorso || testo.trim().length < 5}
            onClick={() =>
              avvia(async () => {
                const risposta = await chiediModifica(token, testo)
                if (risposta.ok) setEsito(risposta.messaggio)
                else toast.error(risposta.messaggio)
              })
            }
          >
            {inCorso ? 'Mando…' : 'Manda'}
          </Button>
        </>
      )}
    </DialogContent>
  )
}
