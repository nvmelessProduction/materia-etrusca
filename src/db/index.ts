import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

/**
 * Un solo pool per processo. In sviluppo il modulo viene ricaricato a ogni
 * salvataggio, quindi la connessione si tiene su `globalThis` per non aprirne
 * una nuova ogni volta.
 */
const globaleConPool = globalThis as unknown as {
  __materiaEtruscaPool?: ReturnType<typeof postgres>
}

function creaPool(): ReturnType<typeof postgres> {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL non impostata. Copia .env.example in .env.local e indica il database PostgreSQL.',
    )
  }

  return postgres(url, {
    // I connection pooler (Supabase, Neon, pgbouncer) non reggono gli statement preparati.
    prepare: false,
    max: process.env.NODE_ENV === 'production' ? 5 : 1,
    idle_timeout: 20,
    connect_timeout: 10,
  })
}

const pool = globaleConPool.__materiaEtruscaPool ?? creaPool()

if (process.env.NODE_ENV !== 'production') {
  globaleConPool.__materiaEtruscaPool = pool
}

export const db = drizzle(pool, { schema, casing: 'snake_case' })

export type Db = typeof db
/** Il tipo della transazione, per le funzioni che devono funzionare in entrambi i contesti. */
export type Transazione = Parameters<Parameters<Db['transaction']>[0]>[0]
export type Esecutore = Db | Transazione

export { schema }
