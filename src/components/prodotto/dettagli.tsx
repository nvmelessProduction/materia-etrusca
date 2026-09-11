import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { DESCRIZIONI_FINITURA, ETICHETTE_FINITURA } from '@/lib/catalogo/etichette'
import type { Finitura } from '@/db/schema'
import { formatNumber } from '@/lib/utils'

export type RigaMisure = {
  altezzaCm: number
  diametroCm: number
  pesoKg: number
  pesoImballoKg: number
  finitura: Finitura
}

export function DettagliProdotto({
  misure,
  cura,
  interno,
  esterno,
  resistenteGelo,
  suOrdinazione,
  giorniDiAttesa,
}: {
  misure: RigaMisure[]
  cura: string | null
  interno: boolean
  esterno: boolean
  resistenteGelo: boolean
  suOrdinazione: boolean
  giorniDiAttesa: number
}) {
  const finiture = [...new Set(misure.map((riga) => riga.finitura))]

  return (
    <Accordion type="multiple" className="border-bordo border-t">
      <AccordionItem value="misure">
        <AccordionTrigger>Misure e peso</AccordionTrigger>
        <AccordionContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-md border-collapse text-sm">
              <thead>
                <tr className="border-bordo border-b text-left">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Altezza
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Diametro
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Finitura
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Peso
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Con imballo
                  </th>
                </tr>
              </thead>
              <tbody>
                {misure.map((riga, indice) => (
                  <tr
                    key={`${riga.altezzaCm}-${riga.finitura}-${indice}`}
                    className="border-bordo/60 border-b"
                  >
                    <td className="py-2.5 pr-4 tabular-nums">
                      {formatNumber(riga.altezzaCm, 0)} cm
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {formatNumber(riga.diametroCm, 0)} cm
                    </td>
                    <td className="py-2.5 pr-4">{ETICHETTE_FINITURA[riga.finitura]}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{formatNumber(riga.pesoKg)} kg</td>
                    <td className="py-2.5 tabular-nums">{formatNumber(riga.pesoImballoKg)} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4">
            Le misure sono quelle del pezzo finito e possono variare di mezzo centimetro: il getto
            non è una stampa.
          </p>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="materiale">
        <AccordionTrigger>Materiale e finitura</AccordionTrigger>
        <AccordionContent>
          <p>
            Cemento ad alta resistenza impastato con inerti fini, colato in casseri di mia
            costruzione e sformato dopo ventiquattro ore. Poi asciuga tre settimane prima di
            partire: è il tempo che serve, non si accorcia.
          </p>
          <dl className="mt-4 space-y-3">
            {finiture.map((finitura) => (
              <div key={finitura}>
                <dt className="text-antracite font-medium">{ETICHETTE_FINITURA[finitura]}</dt>
                <dd>{DESCRIZIONI_FINITURA[finitura]}</dd>
              </div>
            ))}
          </dl>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="ambiente">
        <AccordionTrigger>Interno o esterno</AccordionTrigger>
        <AccordionContent>
          <p>
            {interno && esterno
              ? 'Sta bene sia dentro che fuori.'
              : esterno
                ? 'È pensato per stare fuori.'
                : 'È pensato per stare dentro.'}{' '}
            {resistenteGelo
              ? 'Resiste al gelo: puoi lasciarlo fuori tutto l’inverno, purché sia sollevato da terra di un paio di centimetri così l’acqua non ristagna sotto.'
              : 'Non è garantito contro il gelo: d’inverno mettilo al riparo.'}
          </p>
          {interno ? (
            <p className="mt-3">
              Se lo tieni dentro, appoggialo su un sottovaso o su dei feltrini: il cemento crudo
              lascia un alone chiaro sul legno e sul marmo.
            </p>
          ) : null}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="cura">
        <AccordionTrigger>Come si tiene</AccordionTrigger>
        <AccordionContent>
          {cura ? (
            <div className="space-y-3">
              {cura
                .split('\n')
                .filter(Boolean)
                .map((riga, indice) => (
                  <p key={indice}>{riga}</p>
                ))}
            </div>
          ) : (
            <p>Acqua e spazzola morbida. Niente acidi, niente prodotti anticalcare.</p>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="spedizione">
        <AccordionTrigger>Spedizione e resi</AccordionTrigger>
        <AccordionContent>
          <p>
            {suOrdinazione
              ? `Questo pezzo lo colo quando lo ordini: ci vogliono ${giorniDiAttesa} giorni prima che parta.`
              : 'I pezzi a magazzino partono in due giorni lavorativi.'}{' '}
            Imballo su misura, con angolari e pluriball. Il corriere chiama prima di arrivare e
            consegna al piano strada; sopra i trenta chili puoi aggiungere la consegna al piano.
          </p>
          <p className="mt-3">
            Hai quattordici giorni per ripensarci. Il pezzo deve tornare integro e nel suo imballo,
            e le spese di rientro sono a tuo carico: su un pezzo pesante non sono poche, quindi se
            hai un dubbio scrivimi prima di ordinare.
          </p>
          <p className="mt-3">
            Se arriva rotto, mandami due foto entro tre giorni: lo rifaccio io, senza discutere.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
