import { Link, Section, Text } from '@react-email/components'
import { Guscio, stili } from '@/emails/base'

export type DatiRichiestaRecensione = {
  nomeCliente: string
  nomeProdotto: string
  urlRecensione: string
  urlSito: string
}

export default function RichiestaRecensione({
  nomeCliente = 'Giulia',
  nomeProdotto = 'Olla',
  urlRecensione = 'https://materiaetrusca.it',
  urlSito = 'https://materiaetrusca.it',
}: Partial<DatiRichiestaRecensione>) {
  return (
    <Guscio anteprima={`Come sta il tuo ${nomeProdotto}?`} urlSito={urlSito}>
      <Text style={stili.titolo}>Come sta, dove l’hai messo?</Text>

      <Text style={stili.testo}>
        {nomeCliente}, sono passate due settimane da quando ti è arrivato il {nomeProdotto}. Se hai
        due minuti, scrivi come ti sembra e, se ti va, allega una foto di dove l’hai messo.
      </Text>

      <Text style={stili.testo}>
        Le foto vere nelle case vere valgono più di qualsiasi scatto in studio: sono la cosa che
        aiuta di più chi sta ancora decidendo.
      </Text>

      <Section style={{ margin: '28px 0 8px' }}>
        <Link href={urlRecensione} style={stili.pulsante}>
          Scrivi due righe
        </Link>
      </Section>

      <Text style={stili.tenue}>
        Se invece qualcosa non va, rispondi a questa email e sistemiamo. Preferisco saperlo io che
        leggerlo altrove.
      </Text>
    </Guscio>
  )
}
