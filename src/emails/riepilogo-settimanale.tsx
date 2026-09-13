import { Hr, Link, Section, Text } from '@react-email/components'
import { euro, Guscio, stili } from '@/emails/base'

export type DatiRiepilogoSettimanale = {
  venditeCents: number
  ordini: number
  richieste: number
  proposteInviate: number
  ordiniDaPreparare: number
  scorteBasse: number
  pezziPiuVenduti: { nome: string; quanti: number }[]
  urlAdmin: string
  urlSito: string
}

/** Email del lunedì mattina: quattro numeri e cosa c'è da fare. */
export default function RiepilogoSettimanale({
  venditeCents = 0,
  ordini = 0,
  richieste = 0,
  proposteInviate = 0,
  ordiniDaPreparare = 0,
  scorteBasse = 0,
  pezziPiuVenduti = [],
  urlAdmin = '',
  urlSito = 'https://materiaetrusca.it',
}: Partial<DatiRiepilogoSettimanale>) {
  return (
    <Guscio anteprima={`Settimana chiusa a ${euro(venditeCents)}`} urlSito={urlSito}>
      <Text style={stili.occhiello}>Ultimi sette giorni</Text>
      <Text style={stili.titolo}>{euro(venditeCents)}</Text>

      <Text style={stili.testo}>
        {ordini} {ordini === 1 ? 'ordine' : 'ordini'} · {richieste}{' '}
        {richieste === 1 ? 'richiesta di progetto' : 'richieste di progetto'} · {proposteInviate}{' '}
        {proposteInviate === 1 ? 'proposta inviata' : 'proposte inviate'}
      </Text>

      {ordiniDaPreparare > 0 || scorteBasse > 0 ? (
        <Section style={stili.scatola}>
          <Text style={{ ...stili.testo, margin: 0 }}>
            {ordiniDaPreparare > 0
              ? `${ordiniDaPreparare} ${ordiniDaPreparare === 1 ? 'ordine aspetta' : 'ordini aspettano'} di essere imballati.`
              : ''}
            {ordiniDaPreparare > 0 && scorteBasse > 0 ? <br /> : null}
            {scorteBasse > 0
              ? `${scorteBasse} ${scorteBasse === 1 ? 'variante è' : 'varianti sono'} agli sgoccioli: conviene rifarle prima che finiscano.`
              : ''}
          </Text>
        </Section>
      ) : (
        <Text style={stili.tenue}>Niente in sospeso: tutto spedito, magazzino a posto.</Text>
      )}

      {pezziPiuVenduti.length > 0 ? (
        <>
          <Hr style={stili.riga} />
          <Text style={stili.occhiello}>Cosa è uscito di più</Text>
          {pezziPiuVenduti.map((pezzo, indice) => (
            <Text key={indice} style={{ ...stili.testo, margin: '0 0 6px' }}>
              {pezzo.nome}
              <span style={{ float: 'right' }}>{pezzo.quanti}</span>
            </Text>
          ))}
        </>
      ) : null}

      <Section style={{ margin: '28px 0 8px' }}>
        <Link href={urlAdmin} style={stili.pulsante}>
          Apri il pannello
        </Link>
      </Section>
    </Guscio>
  )
}
