'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Check, ImagePlus, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { MiniaturaEsposizione, MiniaturaStile } from '@/components/progetto/miniature'
import { eImmagine, ridimensiona } from '@/lib/immagini/ridimensiona'
import {
  ESPOSIZIONI,
  FASCE_BUDGET,
  MASSIMO_FOTO,
  STILI,
  TIPI_SPAZIO,
} from '@/lib/validazioni/progetto'
import { cn } from '@/lib/utils'

const CHIAVE_SESSIONE = 'materia-etrusca:progetto'
/** Oltre questa soglia le foto non si salvano in sessione: non ci starebbero. */
const LIMITE_PERSISTENZA_BYTE = 3_500_000

type Foto = { id: string; file: File; anteprima: string; dataUrl?: string }

type Campi = {
  tipoSpazio: string
  larghezzaM: string
  profonditaM: string
  esposizione: string
  stile: string
  fasciaBudget: string
  note: string
  nome: string
  email: string
  telefono: string
  citta: string
  cap: string
  consensoPrivacy: boolean
  consensoMarketing: boolean
}

const CAMPI_VUOTI: Campi = {
  tipoSpazio: '',
  larghezzaM: '',
  profonditaM: '',
  esposizione: '',
  stile: '',
  fasciaBudget: '',
  note: '',
  nome: '',
  email: '',
  telefono: '',
  citta: '',
  cap: '',
  consensoPrivacy: false,
  consensoMarketing: false,
}

export function WizardProgetto() {
  const [passo, setPasso] = useState(1)
  const [foto, setFoto] = useState<Foto[]>([])
  const [campi, setCampi] = useState<Campi>(CAMPI_VUOTI)
  const [inLavorazione, setInLavorazione] = useState(false)
  const [inInvio, setInInvio] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [fatto, setFatto] = useState(false)
  const [ripristinato, setRipristinato] = useState(false)
  const selettore = useRef<HTMLInputElement>(null)
  const fotocamera = useRef<HTMLInputElement>(null)

  /* --- Persistenza in sessione: ricaricare la pagina non deve costare nulla --- */

  useEffect(() => {
    try {
      const salvato = window.sessionStorage.getItem(CHIAVE_SESSIONE)
      if (!salvato) {
        setRipristinato(true)
        return
      }
      const stato = JSON.parse(salvato) as {
        passo?: number
        campi?: Partial<Campi>
        foto?: { nome: string; dataUrl: string }[]
      }

      if (stato.campi) setCampi({ ...CAMPI_VUOTI, ...stato.campi })
      if (stato.passo) setPasso(Math.min(3, Math.max(1, stato.passo)))

      if (stato.foto?.length) {
        void Promise.all(
          stato.foto.map(async (voce, indice) => {
            const risposta = await fetch(voce.dataUrl)
            const blob = await risposta.blob()
            const file = new File([blob], voce.nome, { type: blob.type })
            return {
              id: `ripristinata-${indice}`,
              file,
              anteprima: URL.createObjectURL(file),
              dataUrl: voce.dataUrl,
            }
          }),
        ).then(setFoto)
      }
    } catch {
      // Sessione illeggibile: si riparte da zero, senza dramma.
    } finally {
      setRipristinato(true)
    }
  }, [])

  useEffect(() => {
    if (!ripristinato || fatto) return
    try {
      const conDati = foto.filter((voce) => voce.dataUrl)
      const peso = conDati.reduce((somma, voce) => somma + (voce.dataUrl?.length ?? 0), 0)
      window.sessionStorage.setItem(
        CHIAVE_SESSIONE,
        JSON.stringify({
          passo,
          campi,
          foto:
            peso <= LIMITE_PERSISTENZA_BYTE
              ? conDati.map((voce) => ({ nome: voce.file.name, dataUrl: voce.dataUrl }))
              : [],
        }),
      )
    } catch {
      // Sessione piena o bloccata: il modulo funziona lo stesso.
    }
  }, [passo, campi, foto, ripristinato, fatto])

  /* --- Foto --- */

  const aggiungiFile = useCallback(
    async (elenco: FileList | File[]) => {
      const candidati = Array.from(elenco).filter(eImmagine)
      if (candidati.length === 0) return

      setInLavorazione(true)
      setErrore(null)

      const spazio = MASSIMO_FOTO - foto.length
      const daTrattare = candidati.slice(0, Math.max(0, spazio))

      const nuove: Foto[] = []
      for (const file of daTrattare) {
        const esito = await ridimensiona(file)
        const dataUrl = await leggiComeDataUrl(esito.file)
        nuove.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          file: esito.file,
          anteprima: esito.anteprima,
          dataUrl,
        })
      }

      setFoto((precedenti) => [...precedenti, ...nuove])
      setInLavorazione(false)

      if (candidati.length > daTrattare.length) {
        setErrore(`Ne tengo al massimo ${MASSIMO_FOTO}: le altre le ho lasciate fuori.`)
      }
    },
    [foto.length],
  )

  function rimuoviFoto(id: string) {
    setFoto((precedenti) => {
      const voce = precedenti.find((foto) => foto.id === id)
      if (voce) URL.revokeObjectURL(voce.anteprima)
      return precedenti.filter((foto) => foto.id !== id)
    })
  }

  /* --- Invio --- */

  async function invia() {
    setErrore(null)

    if (campi.nome.trim().length < 2) return setErrore('Come ti chiamo?')
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(campi.email)) {
      return setErrore('Controlla l’indirizzo email: è lì che ti rispondo.')
    }
    if (campi.cap && !/^\d{5}$/.test(campi.cap)) return setErrore('Il CAP ha cinque cifre.')
    if (!campi.consensoPrivacy) return setErrore('Serve il consenso per poterti rispondere.')

    setInInvio(true)
    const modulo = new FormData()
    modulo.set('tipoSpazio', campi.tipoSpazio || 'terrazzo')
    if (campi.larghezzaM) modulo.set('larghezzaM', campi.larghezzaM)
    if (campi.profonditaM) modulo.set('profonditaM', campi.profonditaM)
    if (campi.esposizione) modulo.set('esposizione', campi.esposizione)
    if (campi.stile) modulo.set('stile', campi.stile)
    if (campi.fasciaBudget) modulo.set('fasciaBudget', campi.fasciaBudget)
    modulo.set('note', campi.note)
    modulo.set('nome', campi.nome)
    modulo.set('email', campi.email)
    modulo.set('telefono', campi.telefono)
    modulo.set('citta', campi.citta)
    modulo.set('cap', campi.cap)
    modulo.set('consensoPrivacy', String(campi.consensoPrivacy))
    modulo.set('consensoMarketing', String(campi.consensoMarketing))
    for (const voce of foto) modulo.append('foto', voce.file)

    try {
      const risposta = await fetch('/api/progetto', { method: 'POST', body: modulo })
      const esito = (await risposta.json()) as { ok?: boolean; errore?: string }

      if (!risposta.ok || !esito.ok) {
        setErrore(esito.errore ?? 'Non sono riuscito a mandare la richiesta. Riprova.')
        setInInvio(false)
        return
      }

      try {
        window.sessionStorage.removeItem(CHIAVE_SESSIONE)
      } catch {
        // Niente da pulire: va bene così.
      }
      setFatto(true)
    } catch {
      setErrore('Non sono riuscito a mandare la richiesta. Controlla la connessione e riprova.')
    } finally {
      setInInvio(false)
    }
  }

  if (fatto) return <Ringraziamento nome={campi.nome.split(' ')[0] ?? ''} />

  return (
    <div>
      <Avanzamento passo={passo} />

      {passo === 1 ? (
        <PassoFoto
          foto={foto}
          inLavorazione={inLavorazione}
          selettore={selettore}
          fotocamera={fotocamera}
          onAggiungi={aggiungiFile}
          onRimuovi={rimuoviFoto}
        />
      ) : null}

      {passo === 2 ? <PassoSpazio campi={campi} setCampi={setCampi} /> : null}

      {passo === 3 ? <PassoContatti campi={campi} setCampi={setCampi} /> : null}

      {errore ? (
        <p
          role="alert"
          className="border-errore/40 bg-errore/5 text-errore mt-6 border p-3 text-sm"
        >
          {errore}
        </p>
      ) : null}

      <div className="border-bordo mt-10 flex items-center justify-between gap-4 border-t pt-6">
        {passo > 1 ? (
          <Button variant="fantasma" onClick={() => setPasso(passo - 1)} disabled={inInvio}>
            Indietro
          </Button>
        ) : (
          <span />
        )}

        {passo < 3 ? (
          <Button onClick={() => setPasso(passo + 1)} disabled={inLavorazione}>
            {passo === 1 && foto.length === 0 ? 'Vado avanti senza foto' : 'Avanti'}
          </Button>
        ) : (
          <Button onClick={invia} disabled={inInvio}>
            {inInvio ? (
              <>
                <Loader2 className="animate-spin" aria-hidden />
                Mando…
              </>
            ) : (
              'Manda la richiesta'
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */

function Avanzamento({ passo }: { passo: number }) {
  const passi = ['Le foto', 'Lo spazio', 'Chi sei']
  return (
    <ol className="mb-10 flex gap-2" aria-label="Avanzamento">
      {passi.map((etichetta, indice) => {
        const numero = indice + 1
        const attuale = numero === passo
        const fatto = numero < passo
        return (
          <li key={etichetta} className="flex-1">
            <div
              className={cn(
                'h-0.5 w-full transition-colors duration-300',
                fatto || attuale ? 'bg-antracite' : 'bg-cemento',
              )}
            />
            <p
              className={cn('mt-2 text-xs', attuale ? 'text-antracite' : 'text-testo-tenue')}
              aria-current={attuale ? 'step' : undefined}
            >
              {numero}. {etichetta}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

function PassoFoto({
  foto,
  inLavorazione,
  selettore,
  fotocamera,
  onAggiungi,
  onRimuovi,
}: {
  foto: Foto[]
  inLavorazione: boolean
  selettore: React.RefObject<HTMLInputElement | null>
  fotocamera: React.RefObject<HTMLInputElement | null>
  onAggiungi: (file: FileList | File[]) => Promise<void>
  onRimuovi: (id: string) => void
}) {
  const [sopra, setSopra] = useState(false)
  const pieno = foto.length >= MASSIMO_FOTO

  return (
    <section>
      <h2 className="font-display text-2xl font-light md:text-3xl">Fammi vedere lo spazio</h2>
      <p className="text-testo-tenue mt-3 max-w-xl">
        Bastano una o due foto. Non devono essere belle: devono farmi capire quanto spazio c’è e
        come ci arriva la luce.
      </p>

      <div
        onDragOver={(evento) => {
          evento.preventDefault()
          setSopra(true)
        }}
        onDragLeave={() => setSopra(false)}
        onDrop={(evento) => {
          evento.preventDefault()
          setSopra(false)
          void onAggiungi(evento.dataTransfer.files)
        }}
        className={cn(
          'mt-8 border border-dashed p-6 transition-colors duration-300 md:p-10',
          sopra ? 'border-antracite bg-tufo' : 'border-cemento',
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <ImagePlus aria-hidden className="text-cemento size-8" />
          <p className="text-testo-tenue text-sm">
            <span className="hidden md:inline">Trascina qui le foto, oppure </span>
            <span className="md:hidden">Scatta adesso o </span>
            scegline dal telefono.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            {/* Su telefono apre direttamente la fotocamera posteriore. */}
            <Button
              variant="scuro"
              size="sm"
              onClick={() => fotocamera.current?.click()}
              disabled={pieno || inLavorazione}
              className="md:hidden"
            >
              <Camera aria-hidden />
              Scatta ora
            </Button>
            <Button
              variant="tenue"
              size="sm"
              onClick={() => selettore.current?.click()}
              disabled={pieno || inLavorazione}
            >
              {inLavorazione ? 'Preparo…' : 'Scegli le foto'}
            </Button>
          </div>

          <p className="text-testo-tenue text-xs">
            {foto.length} di {MASSIMO_FOTO}. Le rimpicciolisco io prima di mandarle: non consumo il
            tuo traffico.
          </p>
        </div>

        <input
          ref={selettore}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(evento) => {
            if (evento.target.files) void onAggiungi(evento.target.files)
            evento.target.value = ''
          }}
        />
        <input
          ref={fotocamera}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(evento) => {
            if (evento.target.files) void onAggiungi(evento.target.files)
            evento.target.value = ''
          }}
        />
      </div>

      {foto.length > 0 ? (
        <ul className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-5">
          {foto.map((voce) => (
            <li key={voce.id} className="bg-tufo relative aspect-square overflow-hidden">
              <Image
                src={voce.anteprima}
                alt={`Anteprima di ${voce.file.name}`}
                fill
                unoptimized
                sizes="120px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => onRimuovi(voce.id)}
                className="bg-calce/90 text-antracite hover:bg-calce absolute top-1 right-1 p-1.5 transition-colors duration-300"
                aria-label={`Togli ${voce.file.name}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="border-bordo bg-tufo mt-8 border p-5">
        <p className="text-sm font-medium">Come scattarle, in trenta secondi</p>
        <ul className="text-testo-tenue mt-3 space-y-2 text-sm">
          <li>
            Mettiti in piedi e inquadra tutto l’angolo, non solo il punto dove andrebbe il vaso.
          </li>
          <li>Una foto di giorno, con la luce che c’è di solito. Niente flash.</li>
          <li>
            Se puoi, metti una sedia nell’inquadratura: mi serve per capire le proporzioni vere.
          </li>
          <li>Se lo spazio è lungo, fanne due: una da un lato e una dall’altro.</li>
        </ul>
      </div>
    </section>
  )
}

function PassoSpazio({
  campi,
  setCampi,
}: {
  campi: Campi
  setCampi: React.Dispatch<React.SetStateAction<Campi>>
}) {
  function imposta<K extends keyof Campi>(chiave: K, valore: Campi[K]) {
    setCampi((precedenti) => ({ ...precedenti, [chiave]: valore }))
  }

  return (
    <section className="space-y-10">
      <div>
        <h2 className="font-display text-2xl font-light md:text-3xl">Di che spazio parliamo</h2>
      </div>

      <fieldset>
        <legend className="occhiello">Dove</legend>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {TIPI_SPAZIO.map((voce) => (
            <Scelta
              key={voce.valore}
              attiva={campi.tipoSpazio === voce.valore}
              onClick={() => imposta('tipoSpazio', voce.valore)}
              titolo={voce.etichetta}
              nota={voce.nota}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="occhiello">Quanto è grande, più o meno</legend>
        <p className="text-testo-tenue mt-2 text-sm">
          A occhio va benissimo. Serve a capire se ci sta un pezzo grande o tre piccoli.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <div className="w-32">
            <Label htmlFor="larghezza" className="text-testo-tenue text-xs">
              Larghezza (m)
            </Label>
            <Input
              id="larghezza"
              inputMode="decimal"
              placeholder="4"
              value={campi.larghezzaM}
              onChange={(evento) => imposta('larghezzaM', evento.target.value.replace(',', '.'))}
              className="mt-1.5"
            />
          </div>
          <div className="w-32">
            <Label htmlFor="profondita" className="text-testo-tenue text-xs">
              Profondità (m)
            </Label>
            <Input
              id="profondita"
              inputMode="decimal"
              placeholder="2"
              value={campi.profonditaM}
              onChange={(evento) => imposta('profonditaM', evento.target.value.replace(',', '.'))}
              className="mt-1.5"
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="occhiello">Che luce ci arriva</legend>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {ESPOSIZIONI.map((voce) => (
            <button
              key={voce.valore}
              type="button"
              onClick={() => imposta('esposizione', voce.valore)}
              aria-pressed={campi.esposizione === voce.valore}
              className={cn(
                'flex flex-col items-center gap-2 border p-4 text-center transition-colors duration-300',
                campi.esposizione === voce.valore
                  ? 'border-antracite bg-tufo'
                  : 'border-bordo hover:border-cemento',
              )}
            >
              <MiniaturaEsposizione esposizione={voce.valore} />
              <span className="text-sm font-medium">{voce.etichetta}</span>
              <span className="text-testo-tenue text-xs">{voce.nota}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="occhiello">Che effetto vorresti</legend>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {STILI.map((voce) => (
            <button
              key={voce.valore}
              type="button"
              onClick={() => imposta('stile', voce.valore)}
              aria-pressed={campi.stile === voce.valore}
              className={cn(
                'border p-4 text-left transition-colors duration-300',
                campi.stile === voce.valore
                  ? 'border-antracite bg-tufo'
                  : 'border-bordo hover:border-cemento',
              )}
            >
              <MiniaturaStile stile={voce.valore} />
              <span className="mt-3 block text-sm font-medium">{voce.etichetta}</span>
              <span className="text-testo-tenue mt-1 block text-xs leading-relaxed">
                {voce.nota}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="occhiello">Quanto vorresti spenderci</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {FASCE_BUDGET.map((voce) => (
            <button
              key={voce.valore}
              type="button"
              onClick={() => imposta('fasciaBudget', voce.valore)}
              aria-pressed={campi.fasciaBudget === voce.valore}
              className={cn(
                'border px-4 py-2.5 text-sm transition-colors duration-300',
                campi.fasciaBudget === voce.valore
                  ? 'border-antracite bg-antracite text-calce'
                  : 'border-bordo hover:border-antracite',
              )}
            >
              {voce.etichetta}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="note">Qualcos’altro che dovrei sapere</Label>
        <p className="text-testo-tenue mt-1.5 text-sm">
          Il vento, un gradino, il colore del pavimento, un vaso che hai già e non vuoi buttare.
        </p>
        <Textarea
          id="note"
          rows={4}
          value={campi.note}
          onChange={(evento) => imposta('note', evento.target.value)}
          className="mt-3"
        />
      </div>
    </section>
  )
}

function PassoContatti({
  campi,
  setCampi,
}: {
  campi: Campi
  setCampi: React.Dispatch<React.SetStateAction<Campi>>
}) {
  function imposta<K extends keyof Campi>(chiave: K, valore: Campi[K]) {
    setCampi((precedenti) => ({ ...precedenti, [chiave]: valore }))
  }

  return (
    <section>
      <h2 className="font-display text-2xl font-light md:text-3xl">Dove ti rispondo</h2>
      <p className="text-testo-tenue mt-3 max-w-xl">
        Non serve registrarsi. Ti scrivo io entro tre giorni, e la proposta resta su una pagina solo
        tua.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="nome">Come ti chiami</Label>
          <Input
            id="nome"
            autoComplete="name"
            value={campi.nome}
            onChange={(evento) => imposta('nome', evento.target.value)}
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={campi.email}
            onChange={(evento) => imposta('email', evento.target.value)}
            className="mt-1.5"
          />
        </div>

        <div>
          <Label htmlFor="telefono" className="flex items-baseline gap-2">
            Telefono
            <span className="text-testo-tenue text-xs font-normal">facoltativo</span>
          </Label>
          <Input
            id="telefono"
            type="tel"
            autoComplete="tel"
            value={campi.telefono}
            onChange={(evento) => imposta('telefono', evento.target.value)}
            className="mt-1.5"
          />
        </div>

        <div className="grid grid-cols-[1fr_7rem] gap-4">
          <div>
            <Label htmlFor="citta" className="flex items-baseline gap-2">
              Città
              <span className="text-testo-tenue text-xs font-normal">facoltativa</span>
            </Label>
            <Input
              id="citta"
              autoComplete="address-level2"
              value={campi.citta}
              onChange={(evento) => imposta('citta', evento.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cap-progetto">CAP</Label>
            <Input
              id="cap-progetto"
              inputMode="numeric"
              maxLength={5}
              autoComplete="postal-code"
              value={campi.cap}
              onChange={(evento) =>
                imposta('cap', evento.target.value.replace(/\D/g, '').slice(0, 5))
              }
              className="mt-1.5"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <label className="flex items-start gap-3">
          <Checkbox
            checked={campi.consensoPrivacy}
            onCheckedChange={(stato) => imposta('consensoPrivacy', stato === true)}
            className="mt-0.5"
          />
          <span className="text-testo-tenue text-sm leading-relaxed">
            Acconsento al trattamento dei miei dati e delle foto per ricevere la proposta. Le foto
            le cancello dopo dodici mesi, o prima se me lo chiedi.{' '}
            <Link href="/privacy" target="_blank" className="underline underline-offset-2">
              Privacy
            </Link>
          </span>
        </label>

        <label className="flex items-start gap-3">
          <Checkbox
            checked={campi.consensoMarketing}
            onCheckedChange={(stato) => imposta('consensoMarketing', stato === true)}
            className="mt-0.5"
          />
          <span className="text-testo-tenue text-sm leading-relaxed">
            Puoi scrivermi anche quando esce qualcosa di nuovo. Consenso separato, e si toglie in un
            clic.
          </span>
        </label>
      </div>
    </section>
  )
}

function Scelta({
  attiva,
  onClick,
  titolo,
  nota,
}: {
  attiva: boolean
  onClick: () => void
  titolo: string
  nota: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={attiva}
      className={cn(
        'border p-4 text-left transition-colors duration-300',
        attiva ? 'border-antracite bg-tufo' : 'border-bordo hover:border-cemento',
      )}
    >
      <span className="block text-sm font-medium">{titolo}</span>
      <span className="text-testo-tenue mt-1 block text-xs">{nota}</span>
    </button>
  )
}

function Ringraziamento({ nome }: { nome: string }) {
  return (
    <div className="border-bordo bg-tufo border px-6 py-16 text-center">
      <Check aria-hidden className="text-oliva mx-auto size-8" />
      <h2 className="font-display mt-6 text-3xl font-light md:text-4xl">
        {nome ? `${nome}, ` : ''}è arrivato tutto.
      </h2>
      <p className="text-testo-tenue mx-auto mt-4 max-w-md leading-relaxed">
        Ci lavoro io, non un programma. Entro tre giorni ti scrivo con due o tre pezzi e il perché
        di ognuno. Nel frattempo non devi fare niente.
      </p>
      <div className="mt-8">
        <Link
          href="/collezioni"
          className="border-antracite hover:bg-antracite hover:text-calce inline-flex h-12 items-center border px-6 text-sm transition-colors duration-300"
        >
          Intanto guarda le collezioni
        </Link>
      </div>
    </div>
  )
}

function leggiComeDataUrl(file: File): Promise<string> {
  return new Promise((risolvi, rifiuta) => {
    const lettore = new FileReader()
    lettore.onload = () => risolvi(String(lettore.result))
    lettore.onerror = () => rifiuta(new Error('Lettura del file non riuscita.'))
    lettore.readAsDataURL(file)
  })
}
