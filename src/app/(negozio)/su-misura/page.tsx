import type { Metadata } from 'next'
import Link from 'next/link'
import { Briciole } from '@/components/layout/briciole'
import { Button } from '@/components/ui/button'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Su misura',
  description:
    'Progetti per architetti, hotel e locali: vasi in cemento fatti su misura, in serie coerenti, con tempi e quantità concordate.',
  alternates: { canonical: '/su-misura' },
}

export default function PaginaSuMisura() {
  return (
    <>
      <div className="contenitore pt-8">
        <Briciole voci={[{ etichetta: 'Su misura' }]} />
      </div>

      <section className="contenitore py-12 md:py-20">
        <p className="occhiello">Per architetti e locali</p>
        <h1 className="font-display mt-5 max-w-3xl text-4xl font-light md:text-6xl">
          Se ne servono dodici uguali, si fa un discorso diverso.
        </h1>
        <p className="text-testo-tenue mt-7 max-w-xl text-lg leading-relaxed">
          Il catalogo è pensato per chi compra un pezzo. Per una hall, un dehors o un progetto di
          paesaggio servono altre cose: quantità, tempi certi, una forma che non esiste ancora.
        </p>
      </section>

      <section className="contenitore pb-(--spacing-sezione)">
        <div className="border-bordo grid gap-10 border-y py-12 md:grid-cols-3 md:gap-8">
          <Blocco
            titolo="Serie coerenti"
            testo="Stessa miscela, stesso getto, stessa settimana. Dodici pezzi fatti insieme si somigliano; dodici pezzi fatti in tre mesi no, e in una hall si vede."
          />
          <Blocco
            titolo="Forme nuove"
            testo="Se serve una misura che non ho, costruisco il cassero. Serve un disegno anche approssimativo, e tre o quattro settimane in più."
          />
          <Blocco
            titolo="Tempi dichiarati"
            testo="Ti do una data e la rispetto. Se non posso rispettarla te lo dico prima di prendere l'ordine, non dopo."
          />
        </div>
      </section>

      <section className="contenitore max-w-2xl pb-(--spacing-sezione)">
        <h2 className="font-display text-3xl font-light md:text-4xl">Come funziona</h2>
        <ol className="mt-8 space-y-8">
          <Passo
            numero="1"
            titolo="Mi mandi quello che hai"
            testo="Una pianta, un moodboard, tre foto del cantiere o anche solo le misure scritte in una email. Non serve un capitolato."
          />
          <Passo
            numero="2"
            titolo="Ti dico cosa è possibile"
            testo="Entro una settimana ti mando quantità, tempi e un prezzo. Se quello che chiedi non si può colare, te lo dico subito e propongo un'alternativa."
          />
          <Passo
            numero="3"
            titolo="Campione, poi produzione"
            testo="Sui lotti grandi faccio prima un pezzo di prova. Lo vedi, lo tocchi, e solo dopo si parte. Il campione si paga e si scala dall'ordine."
          />
        </ol>

        <div className="border-bordo bg-tufo mt-14 border p-6">
          <p className="font-display text-2xl font-light">Condizioni per i progetti</p>
          <ul className="text-testo-tenue mt-5 space-y-2.5 text-sm leading-relaxed">
            <li>Da sei pezzi in su applico un prezzo di progetto.</li>
            <li>Acconto del 40% alla conferma, saldo prima della spedizione.</li>
            <li>Fattura con partita IVA e codice SDI, split payment dove previsto.</li>
            <li>Consegna su pallet, scarico e posizionamento da concordare.</li>
            <li>Sui pezzi su misura non è previsto il diritto di recesso.</li>
          </ul>
        </div>

        <div className="mt-12 flex flex-wrap gap-4">
          <Button asChild size="lg">
            <a
              href={`mailto:${site.artisan.email}?subject=${encodeURIComponent('Progetto su misura')}`}
            >
              Scrivimi del progetto
            </a>
          </Button>
          <Button asChild variant="secondario" size="lg">
            <Link href="/progetto">Oppure mandami le foto</Link>
          </Button>
        </div>
      </section>
    </>
  )
}

function Blocco({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <div>
      <h2 className="font-display text-2xl font-light">{titolo}</h2>
      <p className="text-testo-tenue mt-3 text-sm leading-relaxed">{testo}</p>
    </div>
  )
}

function Passo({ numero, titolo, testo }: { numero: string; titolo: string; testo: string }) {
  return (
    <li className="flex gap-5">
      <span className="font-display text-cemento shrink-0 text-3xl font-light tabular-nums">
        {numero}
      </span>
      <div>
        <h3 className="font-display text-2xl font-light">{titolo}</h3>
        <p className="text-testo-tenue mt-2 leading-relaxed">{testo}</p>
      </div>
    </li>
  )
}
