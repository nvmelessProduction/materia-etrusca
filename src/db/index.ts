import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@/db/schema'

/**
 * La connessione si apre alla **prima query**, non quando il modulo viene
 * importato.
 *
 * Serve perché `next build` importa i moduli delle rotte solo per leggerne la
 * configurazione: se qui dentro si aprisse subito un pool, una build senza
 * `DATABASE_URL` fallirebbe ancora prima di provare a renderizzare qualcosa —
 * ed è esattamente quello che succede al primo deploy, quando le variabili non
 * sono ancora state inserite.
 */

type Connessione = ReturnType<typeof drizzle<typeof schema>>

const globaleConPool = globalThis as unknown as {
  __materiaEtruscaPool?: ReturnType<typeof postgres>
}

let connessione: Connessione | null = null

function apri(): Connessione {
  if (connessione) return connessione

  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      'DATABASE_URL non impostata. Copia .env.example in .env.local e indica il database PostgreSQL.',
    )
  }

  // In sviluppo il modulo viene ricaricato a ogni salvataggio: il pool si tiene
  // su `globalThis` per non aprirne uno nuovo ogni volta.
  const pool =
    globaleConPool.__materiaEtruscaPool ??
    postgres(url, {
      // I connection pooler (Supabase, Neon, pgbouncer) non reggono gli
      // statement preparati.
      prepare: false,
      max: process.env.NODE_ENV === 'production' ? 5 : 1,
      idle_timeout: 20,
      connect_timeout: 10,
    })

  if (process.env.NODE_ENV !== 'production') {
    globaleConPool.__materiaEtruscaPool = pool
  }

  connessione = drizzle(pool, { schema, casing: 'snake_case' })
  return connessione
}

/**
 * Si usa esattamente come un'istanza Drizzle: il rinvio è un dettaglio interno.
 *
 * I metodi vengono legati alla connessione vera, così `db.transaction(...)`
 * continua a funzionare. La catena dei prototipi viene inoltrata anche lei:
 * Drizzle riconosce le proprie istanze con `instanceof` e risalendo i
 * costruttori, e l'adattatore di Auth.js se ne serve per capire che dialetto
 * sta usando. Senza questo, vede un oggetto qualunque e si rifiuta di partire.
 */
export const db = new Proxy({} as Connessione, {
  get(_bersaglio, proprieta) {
    const reale = apri()
    const valore = Reflect.get(reale, proprieta, reale) as unknown
    return typeof valore === 'function' ? valore.bind(reale) : valore
  },
  has(_bersaglio, proprieta) {
    return Reflect.has(apri(), proprieta)
  },
  getPrototypeOf() {
    return Object.getPrototypeOf(apri()) as object
  },
})

export type Db = Connessione
/** Il tipo della transazione, per le funzioni che devono funzionare in entrambi i contesti. */
export type Transazione = Parameters<Parameters<Db['transaction']>[0]>[0]
export type Esecutore = Db | Transazione

export { schema }
