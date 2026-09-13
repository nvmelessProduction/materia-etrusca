import { Link, Section, Text } from '@react-email/components'
import { Guscio, stili } from '@/emails/base'

export type DatiPromemoriaScadenza = {
  nomeCliente: string
  giorniRimasti: number
  urlProposta: string
  urlSito: string
}

export default function PromemoriaScadenza({
  nomeCliente = '',
  giorniRimasti = 7,
  urlProposta = '',
  urlSito = 'https://materiaetrusca.it',
}: Partial<DatiPromemoriaScadenza>) {
  return (
    <Guscio anteprima="La tua proposta scade fra pochi giorni" urlSito={urlSito}>
      <Text style={stili.titolo}>La tua proposta scade fra {giorniRimasti} giorni.</Text>

      <Text style={stili.testo}>
        {nomeCliente}, te lo ricordo una volta sola. Dopo scade perché prezzi e disponibilità
        cambiano, e non voglio mostrarti un pezzo che poi non c’è.
      </Text>

      <Section style={{ margin: '28px 0 8px' }}>
        <Link href={urlProposta} style={stili.pulsante}>
          Riguarda la proposta
        </Link>
      </Section>

      <Text style={stili.tenue}>
        Se ti serve più tempo, o se hai cambiato idea su come sistemare lo spazio, rispondi qui: la
        rifaccio senza problemi.
      </Text>
    </Guscio>
  )
}
