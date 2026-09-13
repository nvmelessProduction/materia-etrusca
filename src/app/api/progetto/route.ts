import { NextResponse } from 'next/server'
import { creaRichiesta } from '@/db/queries/progetti'
import { caricaImmagini, fileAccettabile, uploadConfigurato } from '@/lib/upload/archivio'
import { consumaLimite } from '@/lib/limite-richieste'
import { inviaEmail, emailArtigiano } from '@/lib/email/invia'
import RichiestaRicevuta from '@/emails/richiesta-ricevuta'
import NotificaRichiesta from '@/emails/notifica-richiesta'
import {
  ESPOSIZIONI,
  FASCE_BUDGET,
  MASSIMO_FOTO,
  STILI,
  TIPI_SPAZIO,
  schemaRichiestaProgetto,
} from '@/lib/validazioni/progetto'
import type { Esposizione, Stile, TipoSpazio } from '@/db/schema'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'
/** Cinque foto ridotte a 2000px pesano poco, ma il margine serve. */
export const maxDuration = 60

function etichetta<T extends readonly { valore: string; etichetta: string }[]>(
  elenco: T,
  valore: string | null | undefined,
): string | null {
  if (!valore) return null
  return elenco.find((voce) => voce.valore === valore)?.etichetta ?? valore
}

export async function POST(richiesta: Request): Promise<Response> {
  // Tre richieste all'ora per indirizzo: abbastanza per chi sbaglia una foto,
  // troppo poco per chi vuole intasare la casella.
  const permesso = await consumaLimite(richiesta, 'progetto', {
    quante: 3,
    finestraMs: 60 * 60 * 1000,
  })
  if (!permesso) {
    return NextResponse.json(
      { ok: false, errore: 'Hai già mandato qualche richiesta. Riprova più tardi.' },
      { status: 429 },
    )
  }

  let modulo: FormData
  try {
    modulo = await richiesta.formData()
  } catch {
    return NextResponse.json({ ok: false, errore: 'Richiesta non leggibile.' }, { status: 400 })
  }

  const lettura = schemaRichiestaProgetto.safeParse({
    tipoSpazio: modulo.get('tipoSpazio'),
    larghezzaM: modulo.get('larghezzaM') || undefined,
    profonditaM: modulo.get('profonditaM') || undefined,
    esposizione: modulo.get('esposizione') || undefined,
    stile: modulo.get('stile') || undefined,
    fasciaBudget: modulo.get('fasciaBudget') || undefined,
    note: modulo.get('note') ?? '',
    nome: modulo.get('nome'),
    email: modulo.get('email'),
    telefono: modulo.get('telefono') ?? '',
    citta: modulo.get('citta') ?? '',
    cap: modulo.get('cap') ?? '',
    consensoPrivacy: modulo.get('consensoPrivacy') === 'true',
    consensoMarketing: modulo.get('consensoMarketing') === 'true',
    azienda: modulo.get('azienda') ?? '',
  })

  if (!lettura.success) {
    const primo = lettura.error.issues[0]
    return NextResponse.json(
      { ok: false, errore: primo?.message ?? 'Controlla i dati inseriti.' },
      { status: 400 },
    )
  }

  const dati = lettura.data

  // Campo esca compilato: si risponde ok e non si scrive nulla.
  if (dati.azienda) return NextResponse.json({ ok: true })

  const allegati = modulo
    .getAll('foto')
    .filter((voce): voce is File => voce instanceof File)
    .slice(0, MASSIMO_FOTO)

  const scartate = allegati.filter((file) => !fileAccettabile(file))
  if (scartate.length > 0) {
    return NextResponse.json(
      { ok: false, errore: 'Una delle foto non è un’immagine valida o è troppo pesante.' },
      { status: 400 },
    )
  }

  let foto: { url: string; chiave: string | null }[] = []
  if (allegati.length > 0 && uploadConfigurato()) {
    try {
      foto = (await caricaImmagini(allegati)).map((file) => ({
        url: file.url,
        chiave: file.chiave,
      }))
    } catch (errore) {
      console.error('Caricamento foto fallito:', errore)
      return NextResponse.json(
        { ok: false, errore: 'Non sono riuscito a salvare le foto. Riprova fra un momento.' },
        { status: 502 },
      )
    }
  }

  const creata = await creaRichiesta({
    nome: dati.nome,
    email: dati.email,
    telefono: dati.telefono || null,
    citta: dati.citta || null,
    cap: dati.cap || null,
    tipoSpazio: dati.tipoSpazio as TipoSpazio,
    larghezzaM: dati.larghezzaM ?? null,
    profonditaM: dati.profonditaM ?? null,
    esposizione: (dati.esposizione as Esposizione | undefined) ?? null,
    stile: (dati.stile as Stile | undefined) ?? null,
    fasciaBudget: dati.fasciaBudget ?? null,
    note: dati.note || null,
    consensoMarketing: dati.consensoMarketing,
    foto,
  })

  const nomeSpazio = etichetta(TIPI_SPAZIO, dati.tipoSpazio) ?? dati.tipoSpazio

  // Le email non devono poter far fallire una richiesta già salvata.
  void inviaEmail({
    a: dati.email,
    oggetto: 'Ho ricevuto le tue foto',
    contenuto: RichiestaRicevuta({
      nomeCliente: dati.nome.split(' ')[0] ?? dati.nome,
      tipoSpazio: nomeSpazio.toLowerCase(),
      numeroFoto: foto.length,
      urlSito: site.url,
    }),
  })

  void inviaEmail({
    a: emailArtigiano(),
    oggetto: `Nuova richiesta di progetto — ${dati.nome}`,
    rispondiA: dati.email,
    contenuto: NotificaRichiesta({
      nome: dati.nome,
      email: dati.email,
      telefono: dati.telefono || null,
      luogo: [dati.citta, dati.cap].filter(Boolean).join(' '),
      tipoSpazio: nomeSpazio,
      misure:
        dati.larghezzaM && dati.profonditaM
          ? `${dati.larghezzaM} × ${dati.profonditaM} m`
          : (dati.larghezzaM ?? dati.profonditaM)
            ? `${dati.larghezzaM ?? dati.profonditaM} m`
            : null,
      esposizione: etichetta(ESPOSIZIONI, dati.esposizione),
      stile: etichetta(STILI, dati.stile),
      budget: etichetta(FASCE_BUDGET, dati.fasciaBudget),
      note: dati.note || null,
      foto: foto.map((file) => file.url),
      urlAdmin: `${site.url}/admin/progetti/${creata.id}`,
      urlSito: site.url,
    }),
  })

  return NextResponse.json({ ok: true, fotoSalvate: foto.length })
}
