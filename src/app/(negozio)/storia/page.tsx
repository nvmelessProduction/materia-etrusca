import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PaginaTesto } from '@/components/editoriale/pagina-testo'
import { Button } from '@/components/ui/button'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Storia',
  description:
    'Perché faccio vasi in cemento a Cerveteri, a due chilometri dalla necropoli della Banditaccia, e perché le forme sono quelle etrusche.',
  alternates: { canonical: '/storia' },
}

export default function PaginaStoria() {
  return (
    <>
      <PaginaTesto
        occhiello="Chi fa questi vasi"
        titolo="Ho cominciato perché un vaso mi si è rotto."
        introduzione="Un vaso di terracotta, lasciato fuori un inverno di troppo. L’ho buttato e mi sono chiesto con cosa avrei potuto rifarlo, se avessi dovuto rifarlo io."
      >
        <p>
          Vivo a {site.laboratory.city}, a due chilometri dalla necropoli della Banditaccia. Ci sono
          cresciuto in mezzo: da ragazzino ci si andava a giocare, e le tombe a tumulo erano solo
          delle collinette. Ho ricominciato a guardarle sul serio molto dopo, quando ho avuto
          bisogno di forme.
        </p>

        <p>
          Quello che mi ha colpito non è la decorazione: è la proporzione. Un’olla etrusca ha la
          pancia larga e la bocca stretta perché doveva conservare, non perché doveva piacere. Un
          cippo è una colonna bassa perché segnava un punto, non perché arredava. Sono forme che non
          chiedono niente, e forse è per questo che dopo duemilaseicento anni stanno ancora bene
          dove le metti.
        </p>

        <h2>Il cemento, non la terracotta</h2>
        <p>
          La terracotta è bellissima e gela. Il cemento no: se l’impasto è giusto e il pezzo non sta
          nell’acqua ferma, resta fuori tutto l’anno senza fare una piega. Ci ho messo due anni a
          trovare la miscela che mi piace, e altri due a smettere di odiare le bolle d’aria.
        </p>
        <p>
          Adesso le bolle le lascio. Sono il segno che il pezzo è stato colato e non stampato, ed è
          la cosa che le persone toccano per prima quando entrano in laboratorio.
        </p>

        <h2>Come lavoro</h2>
        <p>
          Costruisco i casseri a mano, uno per forma. Colo, aspetto ventiquattro ore, sformo. Poi il
          pezzo asciuga tre settimane prima di poter partire: è il tempo che serve al cemento per
          fare presa davvero, e non si accorcia con nessun trucco.
        </p>
        <p>
          Faccio pochi pezzi alla volta e li faccio io. Quando ordini qualcosa, quello che arriva
          l’ho tirato fuori dal cassero con le mie mani: è il motivo per cui due pezzi uguali non
          sono mai identici, e perché preferisco dirtelo prima.
        </p>

        <h2>Perché ti chiedo la foto</h2>
        <p>
          La domanda che mi fanno tutti è «ci starà bene?». Dalle foto in catalogo non si capisce, e
          un vaso da cinquanta chili non si rimanda indietro con leggerezza. Allora ho fatto un
          patto: mandami la foto del tuo spazio e ti dico io cosa ci metterei, anche se poi non
          compri niente.
        </p>
      </PaginaTesto>

      <div className="contenitore max-w-2xl pb-(--spacing-sezione)">
        <div className="bg-tufo relative aspect-3/2 w-full overflow-hidden">
          <Image
            src="https://picsum.photos/seed/laboratorio-cerveteri/1600/1067"
            alt="Il laboratorio a Cerveteri: casseri di legno appoggiati al muro e pezzi in asciugatura"
            fill
            sizes="(min-width: 768px) 42rem, 100vw"
            className="object-cover"
          />
        </div>
        <p className="text-testo-tenue mt-3 text-xs">
          Il laboratorio. I casseri sono di legno, e durano quanto durano.
        </p>

        <div className="mt-12">
          <Button asChild size="lg">
            <Link href="/progetto">Mandami la foto del tuo spazio</Link>
          </Button>
        </div>
      </div>
    </>
  )
}
