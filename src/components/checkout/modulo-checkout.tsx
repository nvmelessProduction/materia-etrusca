'use client'

import { useEffect, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useCarrello } from '@/components/carrello/contesto-carrello'
import { avviaPagamento } from '@/lib/ordini/azioni'
import { stimaSpedizioneCarrello } from '@/lib/spedizioni/azioni'
import type { RisultatoSpedizione } from '@/lib/spedizioni/motore'
import {
  DESCRIZIONI_PAGAMENTO,
  ETICHETTE_PAGAMENTO,
  METODI_PAGAMENTO,
  schemaCheckout,
  type DatiCheckout,
  type IngressoCheckout,
} from '@/lib/validazioni/checkout'
import { cn, formatPrice, isValidPostalCode } from '@/lib/utils'

type Props = {
  emailIniziale: string
  capIniziale: string
  pagamentiDisponibili: { stripe: boolean; paypal: boolean }
}

export function ModuloCheckout({ emailIniziale, capIniziale, pagamentiDisponibili }: Props) {
  const { carrello } = useCarrello()
  const [spedizione, setSpedizione] = useState<RisultatoSpedizione | null>(null)
  const [erroreGenerale, setErroreGenerale] = useState<string | null>(null)
  const [inCorso, avvia] = useTransition()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<IngressoCheckout, unknown, DatiCheckout>({
    resolver: zodResolver(schemaCheckout),
    defaultValues: {
      email: emailIniziale,
      cap: capIniziale,
      paese: 'IT',
      metodoSpedizione: 'courier',
      metodoPagamento: pagamentiDisponibili.stripe ? 'stripe' : 'bank_transfer',
      consegnaAlPiano: false,
      fatturaRichiesta: false,
      newsletter: false,
    },
  })

  const cap = watch('cap')
  const metodoSpedizione = watch('metodoSpedizione')
  const consegnaAlPiano = watch('consegnaAlPiano')
  const metodoPagamento = watch('metodoPagamento')
  const fatturaRichiesta = watch('fatturaRichiesta')

  // Le opzioni si ricalcolano appena il CAP è completo: nessun pulsante da premere.
  useEffect(() => {
    if (!isValidPostalCode(cap ?? '')) {
      setSpedizione(null)
      return
    }
    let annullato = false
    void stimaSpedizioneCarrello(cap).then((esito) => {
      if (annullato) return
      setSpedizione(esito.risultato)
      const disponibili = esito.risultato?.opzioni.filter((opzione) => !opzione.supplemento) ?? []
      const corrente = disponibili.find((opzione) => opzione.metodo === metodoSpedizione)
      if (!corrente && disponibili[0]) {
        setValue('metodoSpedizione', disponibili[0].metodo as IngressoCheckout['metodoSpedizione'])
      }
    })
    return () => {
      annullato = true
    }
  }, [cap, metodoSpedizione, setValue])

  const opzioniPrincipali = (spedizione?.opzioni ?? []).filter((opzione) => !opzione.supplemento)
  const alPiano = (spedizione?.opzioni ?? []).find((opzione) => opzione.metodo === 'floor_delivery')
  const scelta = opzioniPrincipali.find((opzione) => opzione.metodo === metodoSpedizione)

  const speseCents =
    (scelta?.prezzoCents ?? 0) +
    (consegnaAlPiano && metodoSpedizione !== 'pickup' ? (alPiano?.prezzoCents ?? 0) : 0)
  const totaleCents = carrello.subtotaleCents - carrello.scontoCents + speseCents

  function invia(dati: DatiCheckout) {
    setErroreGenerale(null)
    avvia(async () => {
      const esito = await avviaPagamento(dati)
      if (!esito.ok) {
        setErroreGenerale(esito.messaggio)
        return
      }
      // Stripe e PayPal stanno fuori dal sito: serve una navigazione vera.
      window.location.assign(esito.destinazione)
    })
  }

  return (
    <form onSubmit={handleSubmit(invia)} className="grid gap-12 lg:grid-cols-[1fr_22rem] lg:gap-16">
      <div className="space-y-14">
        <Sezione numero="1" titolo="Dove te lo mando">
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              etichetta="Email"
              errore={errors.email?.message}
              className="sm:col-span-2"
              aiuto="Qui ti mando la conferma e il tracking."
            >
              <Input type="email" autoComplete="email" {...register('email')} />
            </Campo>

            <Campo
              etichetta="Nome e cognome"
              errore={errors.nome?.message}
              className="sm:col-span-2"
            >
              <Input autoComplete="name" {...register('nome')} />
            </Campo>

            <Campo
              etichetta="Telefono"
              errore={errors.telefono?.message}
              className="sm:col-span-2"
              aiuto="Obbligatorio: il corriere chiama sempre prima di consegnare."
            >
              <Input type="tel" autoComplete="tel" {...register('telefono')} />
            </Campo>

            <Campo
              etichetta="Indirizzo"
              errore={errors.indirizzo?.message}
              className="sm:col-span-2"
            >
              <Input autoComplete="address-line1" {...register('indirizzo')} />
            </Campo>

            <Campo
              etichetta="Scala, interno, presso"
              errore={errors.indirizzo2?.message}
              className="sm:col-span-2"
              facoltativo
            >
              <Input autoComplete="address-line2" {...register('indirizzo2')} />
            </Campo>

            <Campo etichetta="Città" errore={errors.citta?.message}>
              <Input autoComplete="address-level2" {...register('citta')} />
            </Campo>

            <div className="grid grid-cols-2 gap-5">
              <Campo etichetta="CAP" errore={errors.cap?.message}>
                <Input
                  inputMode="numeric"
                  maxLength={5}
                  autoComplete="postal-code"
                  {...register('cap')}
                />
              </Campo>
              <Campo etichetta="Provincia" errore={errors.provincia?.message}>
                <Input
                  maxLength={2}
                  placeholder="RM"
                  className="uppercase"
                  {...register('provincia')}
                />
              </Campo>
            </div>

            <Campo
              etichetta="Note per la consegna"
              errore={errors.noteConsegna?.message}
              className="sm:col-span-2"
              facoltativo
              aiuto="ZTL, piano alto senza ascensore, cortile stretto, orari in cui non ci sei. Scrivimelo qui: al corriere serve."
            >
              <Textarea rows={3} {...register('noteConsegna')} />
            </Campo>
          </div>
        </Sezione>

        <Sezione numero="2" titolo="Come te lo faccio arrivare">
          {!isValidPostalCode(cap ?? '') ? (
            <p className="text-testo-tenue text-sm">
              Scrivi il CAP qui sopra e ti mostro le opzioni con il prezzo esatto.
            </p>
          ) : opzioniPrincipali.length === 0 ? (
            <p className="text-testo-tenue text-sm">Calcolo…</p>
          ) : (
            <div className="space-y-3">
              {opzioniPrincipali.map((opzione) => (
                <label
                  key={opzione.metodo}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 border p-4 transition-colors duration-300',
                    metodoSpedizione === opzione.metodo
                      ? 'border-antracite bg-tufo'
                      : 'border-bordo hover:border-cemento',
                  )}
                >
                  <input
                    type="radio"
                    value={opzione.metodo}
                    className="mt-1.5 accent-[var(--color-antracite)]"
                    {...register('metodoSpedizione')}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{opzione.etichetta}</span>
                      <span className="tabular-nums">
                        {opzione.prezzoCents === null
                          ? 'su preventivo'
                          : opzione.prezzoCents === 0
                            ? 'gratis'
                            : formatPrice(opzione.prezzoCents)}
                      </span>
                    </span>
                    <span className="text-testo-tenue mt-1 block text-sm">
                      {opzione.descrizione}
                    </span>
                  </span>
                </label>
              ))}

              {alPiano && metodoSpedizione !== 'pickup' ? (
                <label className="border-bordo flex cursor-pointer items-start gap-3 border p-4">
                  <Checkbox
                    checked={consegnaAlPiano}
                    onCheckedChange={(stato) => setValue('consegnaAlPiano', stato === true)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{alPiano.etichetta}</span>
                      <span className="tabular-nums">+{formatPrice(alPiano.prezzoCents ?? 0)}</span>
                    </span>
                    <span className="text-testo-tenue mt-1 block text-sm">
                      {alPiano.descrizione}
                    </span>
                  </span>
                </label>
              ) : null}
            </div>
          )}
        </Sezione>

        <Sezione numero="3" titolo="Come paghi">
          <div className="space-y-3">
            {METODI_PAGAMENTO.filter(
              (metodo) =>
                metodo === 'bank_transfer' ||
                (metodo === 'stripe' && pagamentiDisponibili.stripe) ||
                (metodo === 'paypal' && pagamentiDisponibili.paypal),
            ).map((metodo) => (
              <label
                key={metodo}
                className={cn(
                  'flex cursor-pointer items-start gap-3 border p-4 transition-colors duration-300',
                  metodoPagamento === metodo
                    ? 'border-antracite bg-tufo'
                    : 'border-bordo hover:border-cemento',
                )}
              >
                <input
                  type="radio"
                  value={metodo}
                  className="mt-1.5 accent-[var(--color-antracite)]"
                  {...register('metodoPagamento')}
                />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{ETICHETTE_PAGAMENTO[metodo]}</span>
                  <span className="text-testo-tenue mt-1 block text-sm">
                    {DESCRIZIONI_PAGAMENTO[metodo]}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="border-bordo mt-8 border-t pt-6">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox
                checked={fatturaRichiesta}
                onCheckedChange={(stato) => setValue('fatturaRichiesta', stato === true)}
                className="mt-0.5"
              />
              <span className="text-sm">Mi serve la fattura</span>
            </label>

            {fatturaRichiesta ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <Campo etichetta="Partita IVA" errore={errors.partitaIva?.message}>
                  <Input inputMode="numeric" maxLength={13} {...register('partitaIva')} />
                </Campo>
                <Campo
                  etichetta="Codice destinatario SDI"
                  errore={errors.codiceSdi?.message}
                  aiuto="Sette caratteri. Se non lo sai, chiedilo al tuo commercialista."
                >
                  <Input maxLength={7} className="uppercase" {...register('codiceSdi')} />
                </Campo>
              </div>
            ) : null}
          </div>
        </Sezione>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="border-bordo bg-tufo border p-6">
          <h2 className="occhiello">Il tuo ordine</h2>

          <ul className="mt-5 space-y-3 text-sm">
            {carrello.righe.map((riga) => (
              <li key={riga.variantId} className="flex justify-between gap-4">
                <span className="min-w-0">
                  {riga.quantita} × {riga.nomeProdotto}
                  <span className="text-testo-tenue block text-xs">
                    {riga.altezzaCm} cm · {riga.finitura}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums">{formatPrice(riga.totaleCents)}</span>
              </li>
            ))}
          </ul>

          <div className="border-cemento mt-5 space-y-2 border-t pt-5 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-testo-tenue">Merce</span>
              <span className="tabular-nums">{formatPrice(carrello.subtotaleCents)}</span>
            </div>
            {carrello.scontoCents > 0 ? (
              <div className="text-oliva flex justify-between gap-4">
                <span>Sconto {carrello.codiceSconto}</span>
                <span className="tabular-nums">−{formatPrice(carrello.scontoCents)}</span>
              </div>
            ) : null}
            <div className="flex justify-between gap-4">
              <span className="text-testo-tenue">Spedizione</span>
              <span className="tabular-nums">
                {scelta ? (speseCents === 0 ? 'gratis' : formatPrice(speseCents)) : '—'}
              </span>
            </div>
          </div>

          <div className="border-cemento mt-5 flex items-baseline justify-between gap-4 border-t pt-5">
            <span className="font-medium">Totale</span>
            <span className="text-xl tabular-nums">{formatPrice(totaleCents)}</span>
          </div>
          <p className="text-testo-tenue mt-1 text-xs">IVA inclusa.</p>

          <div className="mt-6 space-y-4">
            <label className="flex items-start gap-3">
              <Checkbox
                onCheckedChange={(stato) =>
                  setValue('accettaTermini', stato === true, { shouldValidate: true })
                }
                className="mt-0.5"
              />
              <span className="text-testo-tenue text-xs leading-relaxed">
                Ho letto i{' '}
                <a href="/termini" target="_blank" className="underline underline-offset-2">
                  termini di vendita
                </a>{' '}
                e la{' '}
                <a href="/privacy" target="_blank" className="underline underline-offset-2">
                  privacy
                </a>
                .
              </span>
            </label>
            {errors.accettaTermini ? (
              <p role="alert" className="text-errore text-sm">
                {errors.accettaTermini.message}
              </p>
            ) : null}

            <label className="flex items-start gap-3">
              <Checkbox
                onCheckedChange={(stato) => setValue('newsletter', stato === true)}
                className="mt-0.5"
              />
              <span className="text-testo-tenue text-xs leading-relaxed">
                Scrivimi quando esce qualcosa di nuovo. Consenso separato, si toglie in un clic.
              </span>
            </label>
          </div>

          {/* Esca invisibile: nessun captcha da risolvere. */}
          <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="checkout-azienda">Azienda</label>
            <input
              id="checkout-azienda"
              tabIndex={-1}
              autoComplete="off"
              {...register('azienda')}
            />
          </div>

          {erroreGenerale ? (
            <p
              role="alert"
              className="border-errore/40 bg-errore/5 text-errore mt-5 border p-3 text-sm"
            >
              {erroreGenerale}
            </p>
          ) : null}

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={inCorso || !scelta}>
            {inCorso ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Un momento…
              </>
            ) : metodoPagamento === 'bank_transfer' ? (
              'Conferma l’ordine'
            ) : (
              'Vai a pagare'
            )}
          </Button>

          <p className="text-testo-tenue mt-4 text-xs leading-relaxed">
            Non serve registrarsi. Dopo il pagamento puoi crearti un account con un clic, se ti va.
          </p>
        </div>
      </aside>
    </form>
  )
}

function Sezione({
  numero,
  titolo,
  children,
}: {
  numero: string
  titolo: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="font-display flex items-baseline gap-3 text-2xl font-light md:text-3xl">
        <span className="text-cemento text-base tabular-nums">{numero}</span>
        {titolo}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Campo({
  etichetta,
  errore,
  aiuto,
  facoltativo = false,
  className,
  children,
}: {
  etichetta: string
  errore?: string
  aiuto?: string
  facoltativo?: boolean
  className?: string
  children: React.ReactNode
}) {
  const id = etichetta.toLowerCase().replace(/[^a-z]+/g, '-')
  return (
    <div className={className}>
      <Label htmlFor={id} className="flex items-baseline gap-2">
        {etichetta}
        {facoltativo ? (
          <span className="text-testo-tenue text-xs font-normal">facoltativo</span>
        ) : null}
      </Label>
      <div className="mt-1.5">{children}</div>
      {aiuto && !errore ? <p className="text-testo-tenue mt-1.5 text-xs">{aiuto}</p> : null}
      {errore ? (
        <p role="alert" className="text-errore mt-1.5 text-sm">
          {errore}
        </p>
      ) : null}
    </div>
  )
}
