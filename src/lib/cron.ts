import 'server-only'
import { optionalEnv } from '@/lib/env'

/**
 * Le rotte pianificate sono pubbliche per forza: le chiama uno scheduler.
 * Quindi ognuna chiede un segreto condiviso, o non fa niente.
 */
export function cronAutorizzato(richiesta: Request): boolean {
  const segreto = optionalEnv('CRON_SECRET')
  if (!segreto) return false

  const intestazione = richiesta.headers.get('authorization')
  if (intestazione === `Bearer ${segreto}`) return true

  // Vercel Cron manda il segreto qui.
  return richiesta.headers.get('x-cron-secret') === segreto
}
