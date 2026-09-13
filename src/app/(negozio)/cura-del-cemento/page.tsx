import type { Metadata } from 'next'
import { PaginaTesto } from '@/components/editoriale/pagina-testo'

export const metadata: Metadata = {
  title: 'Cura del cemento',
  description:
    'Come si tiene un vaso in cemento: gelo, calce, macchie, pulizia. Quattro regole semplici e nessun prodotto da comprare.',
  alternates: { canonical: '/cura-del-cemento' },
}

export default function PaginaCura() {
  return (
    <PaginaTesto
      occhiello="Come si tiene"
      titolo="Il cemento vive, e si vede."
      introduzione="Cambia colore con la pioggia, schiarisce al sole, prende una patina negli anni. Non è un difetto da correggere: è quello che lo rende diverso da un vaso di plastica."
    >
      <h2>D’inverno, sollevalo da terra</h2>
      <p>
        È l’unica cosa davvero importante. Non è il freddo a rompere il cemento: è l’acqua che
        ristagna sotto il fondo, gela e spinge. Bastano due centimetri — dei piedini di gomma, due
        listelli di legno, anche due mattonelle — e il problema non esiste più.
      </p>
      <p>
        Controlla anche che il foro di drenaggio non sia tappato dalla terra. Se il vaso resta pieno
        d’acqua, il gelo lavora dall’interno.
      </p>

      <h2>La velatura bianca è calce</h2>
      <p>
        Nei primi mesi può affiorare un velo biancastro, soprattutto dopo la pioggia. Si chiama
        efflorescenza: è calce che esce dall’impasto, ed è normale. Va via da sola in un anno, o
        subito con una spazzola morbida e acqua.
      </p>
      <p>
        Non usare acidi né anticalcare: il cemento è a base di calce, un acido lo mangia e lascia il
        segno.
      </p>

      <h2>Le macchie</h2>
      <ul>
        <li>
          <strong>Terra e polvere:</strong> spazzola morbida, acqua, eventualmente un po’ di sapone
          neutro.
        </li>
        <li>
          <strong>Olio o grasso:</strong> talco o amido di mais lasciato agire una notte, poi
          spazzolato via. Assorbe, non graffia.
        </li>
        <li>
          <strong>Alone verde:</strong> è alga, capita nei punti sempre in ombra. Spazzola rigida e
          sole per qualche giorno.
        </li>
        <li>
          <strong>Ruggine da un sottovaso metallico:</strong> non va più via. Meglio prevenirlo con
          un sottovaso di plastica o di gomma.
        </li>
      </ul>

      <h2>Dentro casa</h2>
      <p>
        Il cemento crudo lascia un alone chiaro sul legno e sul marmo. Se lo tieni su un mobile,
        mettici sotto dei feltrini o un sottovaso: costa niente e ti risparmia un dispiacere.
      </p>

      <h2>Se vuoi fermare il colore</h2>
      <p>
        Non serve, ma si può: una cera per pietra naturale, una volta all’anno, passata con un
        panno. Scurisce leggermente il pezzo e rallenta la patina. Evita i sigillanti lucidi: fanno
        sembrare il cemento una cosa che non è.
      </p>

      <h2>Se si scheggia</h2>
      <p>
        Una scheggiatura sul bordo si può stuccare con un impasto di cemento fine, ma si vedrà. Se
        succede nei primi mesi scrivimi: se è colpa mia lo rifaccio, e se non lo è ti mando comunque
        la miscela giusta.
      </p>
    </PaginaTesto>
  )
}
