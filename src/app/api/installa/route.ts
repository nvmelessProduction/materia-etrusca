import { timingSafeEqual } from 'node:crypto'
import path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { seminaEsempi } from '@/db/semina-esempi'
import { seminaProduzione } from '@/db/semina-produzione'
import { optionalEnv } from '@/lib/env'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Installazione del database dal browser.
 *
 * Serve a chi non ha un computer sottomano: fa le stesse due cose di
 * `pnpm db:migrate` e `pnpm db:seed:prod`, ma si apre con un link dal
 * telefono. È ripetibile — le migration già applicate vengono saltate e il
 * popolamento non tocca quello che c'è già — e **non cancella mai niente**.
 *
 *   https://iltuosito.it/api/installa?chiave=IL_TUO_SETUP_SECRET
 *
 * Aggiungendo `&esempi=sostituisci` inserisce invece il catalogo finto, per
 * mostrare il sito pieno prima che esistano i pezzi veri. Quella **cancella
 * tutto** quello che trova, e per questo va chiesta per nome: è pensata per
 * una copia dimostrativa, mai per il sito che vende.
 *
 * Protetta da `SETUP_SECRET`: senza quella variabile la rotta è spenta.
 * Finita l'installazione conviene togliere la variabile da Vercel: la chiave
 * viaggia nell'indirizzo, e gli indirizzi finiscono nei log.
 */

function chiaviCoincidono(fornita: string, attesa: string): boolean {
  const a = Buffer.from(fornita)
  const b = Buffer.from(attesa)
  // Il confronto a lunghezza fissa evita di far trapelare la chiave un
  // carattere alla volta misurando i tempi di risposta.
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

function pagina(titolo: string, righe: string[], stato = 200): Response {
  const corpo = `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${titolo}</title>
<style>
  body { margin:0; padding:32px 20px; background:#F7F4EE; color:#2B2825;
         font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; }
  main { max-width:34rem; margin:0 auto; }
  h1 { font:300 32px/1.15 Georgia,'Times New Roman',serif; margin:0 0 24px; }
  ul { padding-left:20px; margin:0 0 24px; }
  li { margin-bottom:8px; }
  p { margin:0 0 16px; }
  .tenue { color:#6F675D; font-size:14px; }
  a { color:#8C4A2F; }
  code { background:#E8E1D5; padding:2px 6px; font-size:14px; }
</style>
</head>
<body><main>
<h1>${titolo}</h1>
${righe.join('\n')}
</main></body>
</html>`

  return new Response(corpo, {
    status: stato,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

async function esegui(richiesta: Request): Promise<Response> {
  const segreto = optionalEnv('SETUP_SECRET')
  if (!segreto) {
    return pagina(
      'Installazione non attiva',
      [
        '<p>Per usare questa pagina serve una variabile d’ambiente chiamata <code>SETUP_SECRET</code>.</p>',
        '<p class="tenue">Impostala su Vercel con un valore lungo a piacere, rilancia il deploy e riapri questo indirizzo aggiungendo <code>?chiave=</code> seguito da quel valore.</p>',
      ],
      503,
    )
  }

  const parametri = new URL(richiesta.url).searchParams
  const chiave = parametri.get('chiave') ?? ''
  if (!chiaviCoincidono(chiave, segreto)) {
    return pagina(
      'Chiave sbagliata',
      [
        '<p>Questo indirizzo va aperto aggiungendo <code>?chiave=</code> seguito al valore di <code>SETUP_SECRET</code>.</p>',
      ],
      401,
    )
  }

  const url = optionalEnv('DATABASE_URL')
  if (!url) {
    return pagina(
      'Manca il database',
      [
        '<p>Non trovo la variabile <code>DATABASE_URL</code>.</p>',
        '<p class="tenue">Controlla in Settings → Environment Variables che esista con questo nome esatto, poi rilancia il deploy.</p>',
      ],
      503,
    )
  }

  // Connessione dedicata e singola: le migration non devono passare dal pool
  // condiviso, e girano una alla volta per costruzione.
  const cliente = postgres(url, { max: 1, prepare: false, connect_timeout: 15 })

  try {
    await migrate(drizzle(cliente), {
      migrationsFolder: path.join(process.cwd(), 'drizzle'),
    })

    if (parametri.get('esempi') === 'sostituisci') {
      const esempi = await seminaEsempi()

      return pagina('Sito di esempio pronto.', [
        '<ul>',
        '<li>Tabelle create o già a posto.</li>',
        `<li>${esempi.collezioni} collezioni e ${esempi.prodotti} prodotti finti inseriti, al posto di quello che c'era.</li>`,
        '</ul>',
        '<p>Puoi aprire il <a href="/">sito</a>: è pieno, si naviga e si arriva fino al carrello.</p>',
        '<p class="tenue">Sono dati inventati e le foto sono segnaposto. Questa copia serve a far vedere com\u2019è fatto il sito, non a vendere: quando si parte davvero si rifà l\u2019installazione senza <code>&amp;esempi=sostituisci</code>, e i pezzi si inseriscono dal pannello.</p>',
      ])
    }

    const semina = await seminaProduzione()

    return pagina('È tutto pronto.', [
      '<ul>',
      '<li>Tabelle create o già a posto.</li>',
      `<li>${semina.fasce === 0 ? 'Fasce di spedizione già presenti, non le ho toccate.' : `${semina.fasce} fasce di spedizione inserite.`}</li>`,
      `<li>${semina.testi === 0 ? 'Testi già presenti, non li ho toccati.' : `${semina.testi} testi inseriti.`}</li>`,
      '</ul>',
      '<p>Puoi aprire il <a href="/">sito</a>. Il catalogo è vuoto: i pezzi si inseriscono dal pannello.</p>',
      '<p class="tenue">Due cose, adesso: controlla le tariffe in <code>/admin/spedizioni</code>, perché quelle inserite sono indicative; e togli <code>SETUP_SECRET</code> da Vercel, così questa pagina si spegne.</p>',
    ])
  } catch (errore) {
    const messaggio = errore instanceof Error ? errore.message : String(errore)
    console.error('Installazione fallita:', errore)

    return pagina(
      'Non ci sono riuscito',
      [
        `<p>Il database ha risposto: <code>${messaggio.replace(/[<>&]/g, '')}</code></p>`,
        '<p class="tenue">Se parla di connessione, controlla di aver usato la stringa <em>pooled</em> (quella con <code>-pooler</code> nell’indirizzo). Non ho cancellato niente: puoi riaprire questa pagina e riprovare.</p>',
      ],
      500,
    )
  } finally {
    await cliente.end({ timeout: 5 })
  }
}

export const GET = esegui
export const POST = esegui
