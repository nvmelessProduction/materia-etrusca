import { Section, Text } from '@react-email/components'
import { Guscio, stili } from '@/emails/base'

export type DatiRichiestaRicevuta = {
  nomeCliente: string
  tipoSpazio: string
  numeroFoto: number
  urlSito: string
}

export default function RichiestaRicevuta({
  nomeCliente = '',
  tipoSpazio = 'terrazzo',
  numeroFoto = 0,
  urlSito = 'https://materiaetrusca.it',
}: Partial<DatiRichiestaRicevuta>) {
  return (
    <Guscio anteprima="Ho ricevuto le tue foto" urlSito={urlSito}>
      <Text style={stili.titolo}>Ho ricevuto le tue foto.</Text>

      <Text style={stili.testo}>
        {nomeCliente},{' '}
        {numeroFoto > 0
          ? `le ${numeroFoto} foto del tuo ${tipoSpazio} sono qui`
          : `la tua richiesta per il ${tipoSpazio} è arrivata`}
        . Ci lavoro io, non un programma: guardo com’è messa la luce, che proporzioni ha lo spazio e
        cosa c’è già intorno.
      </Text>

      <Text style={stili.testo}>
        Ti rispondo entro tre giorni con una proposta: due o tre pezzi, perché quelli e non altri, e
        quanto verrebbero. Se qualcosa non ti convince me lo dici e la rifaccio.
      </Text>

      <Section style={stili.scatola}>
        <Text style={{ ...stili.testo, margin: 0 }}>
          Non devi fare niente adesso. Se nel frattempo ti viene in mente un dettaglio — che il
          vento lì picchia, che il pavimento è chiaro, che c’è un gradino — rispondi a questa email
          e me lo segno.
        </Text>
      </Section>

      <Text style={stili.tenue}>
        Le foto le uso solo per prepararti la proposta. Le cancello dopo dodici mesi, e se me lo
        chiedi prima le cancello subito.
      </Text>
    </Guscio>
  )
}
