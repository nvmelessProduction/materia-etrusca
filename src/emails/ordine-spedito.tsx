import { Link, Section, Text } from '@react-email/components'
import { Guscio, stili } from '@/emails/base'

export type DatiOrdineSpedito = {
  numeroOrdine: string
  nomeCliente: string
  corriere: string
  tracking: string
  urlTracking: string | null
  urlSito: string
  pesoKg: number
  alPiano: boolean
}

export default function OrdineSpedito({
  numeroOrdine = 'ME-2026-00001',
  nomeCliente = 'Giulia',
  corriere = 'Corriere',
  tracking = '',
  urlTracking = null,
  urlSito = 'https://materiaetrusca.it',
  pesoKg = 0,
  alPiano = false,
}: Partial<DatiOrdineSpedito>) {
  return (
    <Guscio anteprima={`Il tuo ordine ${numeroOrdine} è partito`} urlSito={urlSito}>
      <Text style={stili.occhiello}>Ordine {numeroOrdine}</Text>
      <Text style={stili.titolo}>È partito.</Text>

      <Text style={stili.testo}>
        {nomeCliente}, l’ho imballato stamattina e l’ho consegnato al corriere. Pesa{' '}
        {pesoKg.toLocaleString('it-IT')} kg con l’imballo:{' '}
        {alPiano
          ? 'hai scelto la consegna al piano, quindi te lo portano su in due.'
          : 'il corriere consegna al piano strada, meglio essere in due a riceverlo.'}
      </Text>

      <Section style={stili.scatola}>
        <Text style={{ ...stili.testo, margin: 0 }}>
          {corriere}
          <br />
          Codice di spedizione: <strong>{tracking}</strong>
        </Text>
      </Section>

      {urlTracking ? (
        <Section style={{ margin: '28px 0 8px' }}>
          <Link href={urlTracking} style={stili.pulsante}>
            Segui la spedizione
          </Link>
        </Section>
      ) : null}

      <Text style={stili.testo}>
        Quando arriva, apri l’imballo con calma e controlla i bordi. Se trovi una scheggiatura
        mandami due foto entro tre giorni: lo rifaccio io, senza discutere.
      </Text>

      <Text style={stili.tenue}>
        Una cosa sola: se lo tieni fuori, sollevalo da terra di un paio di centimetri. Non è il
        freddo a rompere il cemento, è l’acqua che ristagna sotto e gela.
      </Text>
    </Guscio>
  )
}
