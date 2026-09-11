import 'server-only'

/**
 * Accesso alle variabili d'ambiente. Volutamente pigro: il progetto deve
 * compilare anche senza chiavi configurate, e fallire con un messaggio chiaro
 * solo quando una funzione che ne ha davvero bisogno viene usata.
 */
export function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value || value.length === 0) {
    throw new Error(
      `Variabile d'ambiente mancante: ${name}. Copiala da .env.example e valorizzala.`,
    )
  }
  return value
}

export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]
  return value && value.length > 0 ? value : undefined
}

export function envFlag(name: string, fallback = false): boolean {
  const value = process.env[name]
  if (value === undefined) return fallback
  return value === 'true' || value === '1'
}

export const isProduction = process.env.NODE_ENV === 'production'
export const isTest = process.env.NODE_ENV === 'test'

/** Elenco delle email che possono entrare in /admin. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}
