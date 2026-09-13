import type { Metadata } from 'next'
import { WizardProgetto } from '@/components/progetto/wizard'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Progetta il tuo angolo',
  description:
    'Mandami la foto del tuo terrazzo o del tuo ingresso: guardo luce e proporzioni e ti dico quali vasi ci starebbero. Gratis, in tre giorni, senza registrarsi.',
  alternates: { canonical: '/progetto' },
  openGraph: {
    title: 'Progetta il tuo angolo — Materia Etrusca',
    description:
      'Mandami la foto del tuo spazio: ti rispondo con una proposta fatta a mano, in tre giorni.',
    url: '/progetto',
  },
}

export default function PaginaProgetto() {
  return (
    <>
      <section className="contenitore py-14 md:py-20">
        <p className="occhiello">Progetta il tuo angolo</p>
        <h1 className="font-display mt-6 max-w-3xl text-4xl font-light md:text-6xl">
          Mandami la foto. Al resto penso io.
        </h1>
        <p className="text-testo-tenue mt-7 max-w-xl text-lg leading-relaxed">
          La domanda che mi fanno tutti è la stessa: «ci starà bene?». Dalle foto in catalogo non si
          capisce, e un vaso da cinquanta chili non si rimanda indietro con leggerezza.
        </p>
        <p className="text-testo-tenue mt-5 max-w-xl leading-relaxed">
          Allora facciamo così: mi mandi due foto del tuo spazio, io guardo com’è messa la luce e
          che proporzioni ha, e ti rispondo con due o tre pezzi e il perché di ognuno. Ci metto tre
          giorni. Non costa niente e non ti impegna a comprare.
        </p>

        <dl className="border-bordo mt-12 grid gap-8 border-y py-8 sm:grid-cols-3">
          <Passo
            numero="1"
            titolo="Le foto"
            testo="Due scatti col telefono. Non devono essere belle."
          />
          <Passo
            numero="2"
            titolo="Quattro domande"
            testo="Dove, quanto è grande, che luce, che effetto."
          />
          <Passo
            numero="3"
            titolo="La proposta"
            testo="Entro tre giorni, su una pagina solo tua."
          />
        </dl>
      </section>

      <section className="contenitore max-w-3xl pb-(--spacing-sezione)">
        <WizardProgetto />
      </section>

      <section className="contenitore max-w-3xl pb-(--spacing-sezione)">
        <div className="border-bordo text-testo-tenue border-t pt-8 text-sm leading-relaxed">
          <p>
            Le foto le guardo io e le uso solo per prepararti la proposta: non finiscono sui social
            e non le vede nessun altro. Le cancello dopo dodici mesi, e se me lo chiedi prima le
            cancello subito — basta scrivere a{' '}
            <a
              href={`mailto:${site.artisan.email}`}
              className="hover:text-antracite underline underline-offset-4"
            >
              {site.artisan.email}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  )
}

function Passo({ numero, titolo, testo }: { numero: string; titolo: string; testo: string }) {
  return (
    <div>
      <dt className="flex items-baseline gap-3">
        <span className="text-cemento text-sm tabular-nums">{numero}</span>
        <span className="font-display text-2xl font-light">{titolo}</span>
      </dt>
      <dd className="text-testo-tenue mt-2 text-sm">{testo}</dd>
    </div>
  )
}
