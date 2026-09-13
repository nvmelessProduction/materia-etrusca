import { Hr, Link, Section, Text } from '@react-email/components'
import { euro, Guscio, stili } from '@/emails/base'

export type DatiCarrelloAbbandonato = {
  nomeCliente: string | null
  righe: { nome: string; dettaglio: string; totaleCents: number }[]
  urlCarrello: string
  urlSito: string
  contienePezzoUnico: boolean
}

export default function CarrelloAbbandonato({
  nomeCliente = null,
  righe = [],
  urlCarrello = 'https://materiaetrusca.it/carrello',
  urlSito = 'https://materiaetrusca.it',
  contienePezzoUnico = false,
}: Partial<DatiCarrelloAbbandonato>) {
  return (
    <Guscio anteprima="Hai lasciato qualcosa nel carrello" urlSito={urlSito}>
      <Text style={stili.titolo}>Hai lasciato qualcosa a metà.</Text>

      <Text style={stili.testo}>
        {nomeCliente ? `${nomeCliente}, ` : ''}
        {contienePezzoUnico
          ? 'Nel tuo carrello c’è un pezzo unico: ne esiste uno solo, e finché resta lì non lo tengo da parte per nessuno.'
          : 'Il carrello è ancora dove l’hai lasciato, non l’ho toccato.'}
      </Text>

      <Hr style={stili.riga} />

      {righe.map((riga, indice) => (
        <Section key={indice}>
          <Text style={{ ...stili.testo, margin: '0 0 4px' }}>
            {riga.nome}
            <span style={{ float: 'right' }}>{euro(riga.totaleCents)}</span>
          </Text>
          <Text style={{ ...stili.tenue, margin: '0 0 14px' }}>{riga.dettaglio}</Text>
        </Section>
      ))}

      <Section style={{ margin: '28px 0 8px' }}>
        <Link href={urlCarrello} style={stili.pulsante}>
          Riprendi da dove eri
        </Link>
      </Section>

      <Text style={stili.tenue}>
        Se ti sei fermato perché non sei sicuro delle misure, scrivimi: mandami la foto dello spazio
        e ti dico io se è il pezzo giusto. Non ti scrivo più su questo carrello.
      </Text>
    </Guscio>
  )
}
