import 'server-only'

/**
 * Limite di frequenza in memoria: niente captcha da risolvere, niente servizi
 * esterni. Su un'istanza sola basta e avanza; se un giorno il sito girerà su
 * più istanze, questo è il punto in cui infilare Redis.
 */

type Finestra = { conteggio: number; scadenza: number }

const finestre = new Map<string, Finestra>()

function pulisci(adesso: number): void {
  if (finestre.size < 5000) return
  for (const [chiave, finestra] of finestre) {
    if (finestra.scadenza <= adesso) finestre.delete(chiave)
  }
}

export function indirizzoRichiesta(richiesta: Request): string {
  const inoltrato = richiesta.headers.get('x-forwarded-for')
  if (inoltrato) return inoltrato.split(',')[0]?.trim() ?? 'sconosciuto'
  return richiesta.headers.get('x-real-ip') ?? 'sconosciuto'
}

export async function consumaLimite(
  richiesta: Request,
  ambito: string,
  opzioni: { quante: number; finestraMs: number },
): Promise<boolean> {
  const adesso = Date.now()
  pulisci(adesso)

  const chiave = `${ambito}:${indirizzoRichiesta(richiesta)}`
  const finestra = finestre.get(chiave)

  if (!finestra || finestra.scadenza <= adesso) {
    finestre.set(chiave, { conteggio: 1, scadenza: adesso + opzioni.finestraMs })
    return true
  }

  if (finestra.conteggio >= opzioni.quante) return false

  finestra.conteggio += 1
  return true
}

/** Azzera il contatore: serve solo ai test. */
export function azzeraLimiti(): void {
  finestre.clear()
}
