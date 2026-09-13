import { Hr, Link, Section, Text } from '@react-email/components'
import { euro, Guscio, stili } from '@/emails/base'

export type DatiNotificaOrdine = {
  numeroOrdine: string
  totaleCents: number
  metodoPagamento: string
  metodoSpedizione: string
  pesoKg: number
  cliente: string
  email: string
  telefono: string
  indirizzo: string
  noteConsegna: string | null
  fattura: string | null
  righe: { nome: string; dettaglio: string; quantita: number }[]
  urlAdmin: string
  urlSito: string
}

/** Email interna: serve a sapere cosa imballare, non a fare bella figura. */
export default function NotificaOrdine({
  numeroOrdine = 'ME-2026-00001',
  totaleCents = 0,
  metodoPagamento = '',
  metodoSpedizione = '',
  pesoKg = 0,
  cliente = '',
  email = '',
  telefono = '',
  indirizzo = '',
  noteConsegna = null,
  fattura = null,
  righe = [],
  urlAdmin = '',
  urlSito = 'https://materiaetrusca.it',
}: Partial<DatiNotificaOrdine>) {
  return (
    <Guscio anteprima={`Nuovo ordine ${numeroOrdine} — ${euro(totaleCents)}`} urlSito={urlSito}>
      <Text style={stili.occhiello}>Nuovo ordine</Text>
      <Text style={stili.titolo}>
        {numeroOrdine} — {euro(totaleCents)}
      </Text>

      <Text style={stili.testo}>
        {metodoPagamento} · {metodoSpedizione} · {pesoKg.toLocaleString('it-IT')} kg da imballare
      </Text>

      <Hr style={stili.riga} />

      {righe.map((riga, indice) => (
        <Text key={indice} style={{ ...stili.testo, margin: '0 0 8px' }}>
          {riga.quantita} × {riga.nome}
          <br />
          <span style={{ color: '#6F675D', fontSize: '13px' }}>{riga.dettaglio}</span>
        </Text>
      ))}

      <Hr style={stili.riga} />

      <Text style={{ ...stili.testo, whiteSpace: 'pre-line' }}>
        {cliente}
        {'\n'}
        {indirizzo}
        {'\n'}
        {telefono} · {email}
      </Text>

      {noteConsegna ? (
        <Section style={stili.scatola}>
          <Text style={{ ...stili.testo, margin: 0 }}>
            <strong>Note di consegna:</strong> {noteConsegna}
          </Text>
        </Section>
      ) : null}

      {fattura ? <Text style={stili.tenue}>Fattura richiesta — {fattura}</Text> : null}

      <Section style={{ margin: '28px 0 8px' }}>
        <Link href={urlAdmin} style={stili.pulsante}>
          Apri nel pannello
        </Link>
      </Section>
    </Guscio>
  )
}
