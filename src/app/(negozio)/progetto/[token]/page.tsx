import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { propostaPerToken } from '@/db/queries/progetti'
import { PropostaInterattiva } from '@/components/progetto/proposta-interattiva'
import { formatDate } from '@/lib/utils'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'

/**
 * Pagina privata: ci si arriva solo con il token, che non è indovinabile e non
 * compare da nessuna parte. Fuori dagli indici, e niente dati oltre al token
 * nell'URL.
 */
export const metadata: Metadata = {
  title: 'La tua proposta',
  robots: { index: false, follow: false, nocache: true },
}

export default async function PaginaProposta({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const proposta = await propostaPerToken(token)
  if (!proposta) notFound()

  const primaFoto = proposta.fotoCliente[0]

  return (
    <div className="contenitore max-w-4xl py-12 md:py-20">
      <p className="occhiello">Proposta per {proposta.nomeCliente}</p>
      <h1 className="font-display mt-6 text-4xl font-light md:text-6xl">Ecco cosa ci metterei.</h1>

      {proposta.scaduta ? (
        <p role="status" className="border-bordo bg-tufo mt-8 border p-4 text-sm leading-relaxed">
          Questa proposta è scaduta il {proposta.scadeIl ? formatDate(proposta.scadeIl) : ''}:
          prezzi e disponibilità nel frattempo cambiano, e non voglio mostrarti un pezzo che poi non
          c’è. Scrivimi a{' '}
          <a href={`mailto:${site.artisan.email}`} className="underline underline-offset-4">
            {site.artisan.email}
          </a>{' '}
          e te la rifaccio aggiornata.
        </p>
      ) : null}

      {/* Prima e dopo: la foto del cliente accanto alla proposta. È il confronto
          che risponde alla domanda vera, «ci sta bene o no». */}
      {primaFoto || proposta.renderUrl ? (
        <section className="mt-12" aria-labelledby="titolo-confronto">
          <h2 id="titolo-confronto" className="sr-only">
            Come è adesso e come potrebbe essere
          </h2>
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            {primaFoto ? (
              <figure>
                <div className="bg-tufo relative aspect-4/3 w-full overflow-hidden">
                  <Image
                    src={primaFoto.url}
                    alt={primaFoto.alt}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="text-testo-tenue mt-2 text-xs tracking-[0.14em] uppercase">
                  Com’è adesso
                </figcaption>
              </figure>
            ) : null}

            {proposta.renderUrl ? (
              <figure>
                <div className="bg-tufo relative aspect-4/3 w-full overflow-hidden">
                  <Image
                    src={proposta.renderUrl}
                    alt={`Proposta per ${proposta.nomeCliente}: come verrebbe lo spazio`}
                    fill
                    priority
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="text-testo-tenue mt-2 text-xs tracking-[0.14em] uppercase">
                  Come verrebbe
                </figcaption>
              </figure>
            ) : null}
          </div>

          {proposta.fotoCliente.length > 1 ? (
            <ul className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {proposta.fotoCliente.slice(1).map((foto, indice) => (
                <li key={indice} className="bg-tufo relative size-20 shrink-0 overflow-hidden">
                  <Image src={foto.url} alt={foto.alt} fill sizes="80px" className="object-cover" />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="mt-14" aria-labelledby="titolo-messaggio">
        <h2 id="titolo-messaggio" className="occhiello">
          Perché proprio questi
        </h2>
        <div className="mt-5 space-y-4 text-lg leading-relaxed">
          {proposta.messaggio
            .split('\n')
            .filter((riga) => riga.trim().length > 0)
            .map((paragrafo, indice) => (
              <p key={indice}>{paragrafo}</p>
            ))}
        </div>
      </section>

      <section className="mt-14" aria-labelledby="titolo-pezzi">
        <h2 id="titolo-pezzi" className="occhiello">
          I pezzi
        </h2>
        <p className="text-testo-tenue mt-2 text-sm">
          Togli la spunta a quello che non ti serve: il totale si aggiorna da sé.
        </p>
        <div className="mt-8">
          <PropostaInterattiva
            token={proposta.token}
            voci={proposta.voci}
            scaduta={proposta.scaduta}
            whatsapp={site.artisan.whatsapp}
            email={site.artisan.email}
          />
        </div>
      </section>

      <footer className="border-bordo text-testo-tenue mt-16 border-t pt-8 text-sm leading-relaxed">
        {proposta.pubblicataIl ? (
          <p>
            Proposta preparata il {formatDate(proposta.pubblicataIl)}
            {proposta.scadeIl && !proposta.scaduta
              ? `, valida fino al ${formatDate(proposta.scadeIl)}.`
              : '.'}
          </p>
        ) : null}
        <p className="mt-3">
          Questa pagina è solo tua: il link non è pubblico e non compare nei motori di ricerca. Se
          qualcosa non ti torna, rispondi alla mia email — la rifaccio, non mi offendo.
        </p>
      </footer>
    </div>
  )
}
