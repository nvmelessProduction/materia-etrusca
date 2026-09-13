import { Link, Section, Text } from '@react-email/components'
import { euro, Guscio, stili } from '@/emails/base'

export type DatiPropostaPronta = {
  nomeCliente: string
  numeroPezzi: number
  stimaCents: number
  urlProposta: string
  urlSito: string
  giorniValidita: number
}

export default function PropostaPronta({
  nomeCliente = '',
  numeroPezzi = 0,
  stimaCents = 0,
  urlProposta = '',
  urlSito = 'https://materiaetrusca.it',
  giorniValidita = 30,
}: Partial<DatiPropostaPronta>) {
  return (
    <Guscio anteprima="Ho guardato le tue foto: ecco cosa ci metterei" urlSito={urlSito}>
      <Text style={stili.titolo}>Ho guardato le tue foto.</Text>

      <Text style={stili.testo}>
        {nomeCliente}, ti ho preparato una proposta con {numeroPezzi}{' '}
        {numeroPezzi === 1 ? 'pezzo' : 'pezzi'}. Nella pagina trovi la tua foto accanto a come
        verrebbe, e sotto ti spiego perché ho scelto proprio quelli.
      </Text>

      <Text style={stili.testo}>
        Puoi togliere quello che non ti serve: il totale si aggiorna da sé. Così com’è adesso siamo
        intorno a {euro(stimaCents)}.
      </Text>

      <Section style={{ margin: '28px 0 8px' }}>
        <Link href={urlProposta} style={stili.pulsante}>
          Guarda la proposta
        </Link>
      </Section>

      <Text style={stili.tenue}>
        La pagina è solo tua, il link non è pubblico da nessuna parte. Resta valida {giorniValidita}{' '}
        giorni: dopo i prezzi e le disponibilità cambiano e dovrei rifarla.
      </Text>

      <Text style={stili.tenue}>
        Se qualcosa non ti torna, rispondi a questa email e la rifaccio. Non mi offendo.
      </Text>
    </Guscio>
  )
}
