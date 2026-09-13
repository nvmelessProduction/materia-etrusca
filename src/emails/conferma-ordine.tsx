import { Hr, Link, Section, Text } from '@react-email/components'
import { euro, Guscio, stili } from '@/emails/base'

export type RigaEmail = {
  nome: string
  dettaglio: string
  quantita: number
  totaleCents: number
}

export type DatiConfermaOrdine = {
  numeroOrdine: string
  nomeCliente: string
  righe: RigaEmail[]
  subtotaleCents: number
  spedizioneCents: number
  scontoCents: number
  totaleCents: number
  metodoSpedizione: string
  indirizzo: string
  urlOrdine: string
  urlSito: string
  giorniDiAttesa: number
  /** Valorizzato solo per il bonifico: senza estremi il cliente non può pagare. */
  bonifico?: { iban: string; intestatario: string; banca: string } | null
}

export default function ConfermaOrdine({
  numeroOrdine = 'ME-2026-00001',
  nomeCliente = 'Giulia',
  righe = [],
  subtotaleCents = 0,
  spedizioneCents = 0,
  scontoCents = 0,
  totaleCents = 0,
  metodoSpedizione = 'Corriere',
  indirizzo = '',
  urlOrdine = 'https://materiaetrusca.it',
  urlSito = 'https://materiaetrusca.it',
  giorniDiAttesa = 0,
  bonifico = null,
}: Partial<DatiConfermaOrdine>) {
  return (
    <Guscio anteprima={`Ordine ${numeroOrdine} ricevuto`} urlSito={urlSito}>
      <Text style={stili.occhiello}>Ordine {numeroOrdine}</Text>
      <Text style={stili.titolo}>
        {bonifico ? 'Ho messo il pezzo da parte.' : 'Ho ricevuto il tuo ordine.'}
      </Text>

      <Text style={stili.testo}>
        {nomeCliente}, grazie.{' '}
        {bonifico
          ? 'Appena vedo arrivare il bonifico preparo l’imballo e ti scrivo con il tracking.'
          : giorniDiAttesa > 0
            ? `Questo pezzo lo colo apposta per te: ci vogliono ${giorniDiAttesa} giorni prima che parta. Ti avviso io quando è pronto.`
            : 'Preparo l’imballo nei prossimi due giorni lavorativi e ti scrivo appena parte, con il numero per seguirlo.'}
      </Text>

      {bonifico ? (
        <Section style={stili.scatola}>
          <Text style={{ ...stili.testo, margin: '0 0 10px', fontWeight: 600 }}>
            Estremi per il bonifico
          </Text>
          <Text style={{ ...stili.testo, margin: 0, fontSize: '14px' }}>
            Intestatario: {bonifico.intestatario}
            <br />
            IBAN: {bonifico.iban}
            <br />
            Banca: {bonifico.banca}
            <br />
            Causale: <strong>{numeroOrdine}</strong>
            <br />
            Importo: <strong>{euro(totaleCents)}</strong>
          </Text>
        </Section>
      ) : null}

      <Hr style={stili.riga} />

      {righe.map((riga, indice) => (
        <Section key={indice}>
          <Text style={{ ...stili.testo, margin: '0 0 4px' }}>
            {riga.quantita} × {riga.nome}
            <span style={{ float: 'right' }}>{euro(riga.totaleCents)}</span>
          </Text>
          <Text style={{ ...stili.tenue, margin: '0 0 14px' }}>{riga.dettaglio}</Text>
        </Section>
      ))}

      <Hr style={stili.riga} />

      <Text style={{ ...stili.testo, margin: '0 0 6px' }}>
        Merce<span style={{ float: 'right' }}>{euro(subtotaleCents)}</span>
      </Text>
      {scontoCents > 0 ? (
        <Text style={{ ...stili.testo, margin: '0 0 6px', color: '#6B7355' }}>
          Sconto<span style={{ float: 'right' }}>−{euro(scontoCents)}</span>
        </Text>
      ) : null}
      <Text style={{ ...stili.testo, margin: '0 0 6px' }}>
        {metodoSpedizione}
        <span style={{ float: 'right' }}>
          {spedizioneCents === 0 ? 'gratis' : euro(spedizioneCents)}
        </span>
      </Text>
      <Text style={{ ...stili.testo, fontWeight: 600, fontSize: '17px' }}>
        Totale<span style={{ float: 'right' }}>{euro(totaleCents)}</span>
      </Text>

      <Hr style={stili.riga} />

      <Text style={stili.tenue}>Consegna a:</Text>
      <Text style={{ ...stili.testo, whiteSpace: 'pre-line' }}>{indirizzo}</Text>

      <Section style={{ margin: '28px 0 8px' }}>
        <Link href={urlOrdine} style={stili.pulsante}>
          Guarda l’ordine
        </Link>
      </Section>

      <Text style={stili.tenue}>
        Ogni pezzo è colato e rifinito a mano: le piccole variazioni sono la firma, non un difetto.
        Se qualcosa non va, rispondi a questa email: legge una persona sola, e sono io.
      </Text>
    </Guscio>
  )
}
