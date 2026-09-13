import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { ReactNode } from 'react'

/**
 * I client di posta non leggono le variabili CSS: qui i colori del progetto
 * vanno scritti per esteso. Sono gli stessi token, copiati a mano una volta sola.
 */
export const colori = {
  calce: '#F7F4EE',
  tufo: '#E8E1D5',
  cemento: '#C4B9A5',
  terracotta: '#8C4A2F',
  oliva: '#6B7355',
  antracite: '#2B2825',
  tenue: '#6F675D',
} as const

const corpo = {
  backgroundColor: colori.calce,
  color: colori.antracite,
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif, 'Apple Color Emoji'",
  margin: 0,
  padding: '32px 0',
}

const contenitore = {
  backgroundColor: colori.calce,
  border: `1px solid ${colori.cemento}`,
  margin: '0 auto',
  maxWidth: '580px',
  padding: '40px 32px',
}

export const stili = {
  titolo: {
    color: colori.antracite,
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontSize: '30px',
    fontWeight: 300,
    lineHeight: 1.15,
    margin: '0 0 20px',
  },
  testo: {
    color: colori.antracite,
    fontSize: '15px',
    lineHeight: 1.65,
    margin: '0 0 16px',
  },
  tenue: {
    color: colori.tenue,
    fontSize: '13px',
    lineHeight: 1.6,
    margin: '0 0 12px',
  },
  occhiello: {
    color: colori.tenue,
    fontSize: '11px',
    letterSpacing: '0.18em',
    margin: '0 0 20px',
    textTransform: 'uppercase' as const,
  },
  pulsante: {
    backgroundColor: colori.terracotta,
    borderRadius: '0',
    color: colori.calce,
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: 500,
    padding: '14px 28px',
    textDecoration: 'none',
  },
  riga: {
    borderColor: colori.cemento,
    margin: '28px 0',
  },
  scatola: {
    backgroundColor: colori.tufo,
    padding: '20px',
  },
}

export function Guscio({
  anteprima,
  children,
  urlSito,
}: {
  anteprima: string
  children: ReactNode
  urlSito: string
}) {
  return (
    <Html lang="it">
      <Head />
      <Preview>{anteprima}</Preview>
      <Body style={corpo}>
        <Container style={contenitore}>
          <Text
            style={{
              ...stili.occhiello,
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: '16px',
              letterSpacing: '0.2em',
            }}
          >
            MATERIA ETRUSCA
          </Text>

          {children}

          <Hr style={stili.riga} />
          <Section>
            <Text style={stili.tenue}>
              Materia Etrusca — Cerveteri (RM)
              <br />
              <Link href={urlSito} style={{ color: colori.tenue }}>
                {urlSito.replace(/^https?:\/\//, '')}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

/** Formattazione prezzi lato email: niente Intl con locale incerto nei client. */
export function euro(cents: number): string {
  const segno = cents < 0 ? '−' : ''
  const assoluto = Math.abs(cents)
  const intero = Math.floor(assoluto / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  const decimali = (assoluto % 100).toString().padStart(2, '0')
  return `${segno}${intero},${decimali} €`
}
