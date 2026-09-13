import { Hr, Link, Section, Text } from '@react-email/components'
import { Guscio, stili } from '@/emails/base'

export type DatiNotificaRichiesta = {
  nome: string
  email: string
  telefono: string | null
  luogo: string
  tipoSpazio: string
  misure: string | null
  esposizione: string | null
  stile: string | null
  budget: string | null
  note: string | null
  foto: string[]
  urlAdmin: string
  urlSito: string
}

/** Email interna: deve bastare a farsi un'idea senza aprire il pannello. */
export default function NotificaRichiesta({
  nome = '',
  email = '',
  telefono = null,
  luogo = '',
  tipoSpazio = '',
  misure = null,
  esposizione = null,
  stile = null,
  budget = null,
  note = null,
  foto = [],
  urlAdmin = '',
  urlSito = 'https://materiaetrusca.it',
}: Partial<DatiNotificaRichiesta>) {
  return (
    <Guscio anteprima={`Nuova richiesta di progetto da ${nome}`} urlSito={urlSito}>
      <Text style={stili.occhiello}>Nuova richiesta di progetto</Text>
      <Text style={stili.titolo}>
        {nome} — {tipoSpazio}
      </Text>

      <Text style={stili.testo}>
        {luogo}
        {telefono ? ` · ${telefono}` : ''}
        <br />
        <Link href={`mailto:${email}`} style={{ color: '#8C4A2F' }}>
          {email}
        </Link>
      </Text>

      <Hr style={stili.riga} />

      <Text style={stili.testo}>
        {misure ? (
          <>
            Misure: {misure}
            <br />
          </>
        ) : null}
        {esposizione ? (
          <>
            Esposizione: {esposizione}
            <br />
          </>
        ) : null}
        {stile ? (
          <>
            Stile: {stile}
            <br />
          </>
        ) : null}
        {budget ? <>Budget: {budget}</> : null}
      </Text>

      {note ? (
        <Section style={stili.scatola}>
          <Text style={{ ...stili.testo, margin: 0 }}>{note}</Text>
        </Section>
      ) : null}

      {foto.length > 0 ? (
        <>
          <Hr style={stili.riga} />
          <Text style={stili.tenue}>{foto.length} foto:</Text>
          {foto.map((url, indice) => (
            <Text key={indice} style={{ ...stili.tenue, margin: '0 0 6px' }}>
              <Link href={url} style={{ color: '#6F675D' }}>
                Foto {indice + 1}
              </Link>
            </Text>
          ))}
        </>
      ) : null}

      <Section style={{ margin: '28px 0 8px' }}>
        <Link href={urlAdmin} style={stili.pulsante}>
          Prepara la proposta
        </Link>
      </Section>
    </Guscio>
  )
}
