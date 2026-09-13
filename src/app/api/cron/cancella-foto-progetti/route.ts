import { NextResponse } from 'next/server'
import { confermaCancellazioneFoto, fotoDaCancellare } from '@/db/queries/progetti'
import { eliminaFile } from '@/lib/upload/archivio'
import { cronAutorizzato } from '@/lib/cron'

export const dynamic = 'force-dynamic'

const MESI_CONSERVAZIONE = 12

/**
 * Cancellazione automatica delle foto di progetto dopo dodici mesi.
 * È scritto nella privacy e detto al cliente nel modulo: va fatto davvero,
 * sia dall'archivio sia dal database.
 */
async function esegui(richiesta: Request): Promise<Response> {
  if (!cronAutorizzato(richiesta)) {
    return NextResponse.json({ errore: 'Non autorizzato.' }, { status: 401 })
  }

  const scadute = await fotoDaCancellare(MESI_CONSERVAZIONE)
  if (scadute.length === 0) {
    return NextResponse.json({ ok: true, cancellate: 0, richieste: 0 })
  }

  const chiavi = scadute
    .map((foto) => foto.chiave)
    .filter((chiave): chiave is string => Boolean(chiave))

  try {
    await eliminaFile(chiavi)
  } catch (errore) {
    // Se l'archivio non risponde si riprova al giro dopo: meglio ritardare
    // che perdere il riferimento ai file senza averli davvero cancellati.
    console.error('Cancellazione dall’archivio fallita:', errore)
    return NextResponse.json({ ok: false, errore: 'Archivio non raggiungibile.' }, { status: 502 })
  }

  const richieste = [...new Set(scadute.map((foto) => foto.richiestaId))]
  await confermaCancellazioneFoto(richieste)

  return NextResponse.json({ ok: true, cancellate: scadute.length, richieste: richieste.length })
}

// Vercel Cron chiama in GET e manda da sé `Authorization: Bearer $CRON_SECRET`.
// In POST si può invocare a mano, con lo stesso segreto.
export const GET = esegui
export const POST = esegui
