import { seminaEsempi } from '@/db/semina-esempi'

/**
 * Popolamento di esempio da riga di comando.
 *
 *   pnpm db:seed
 *
 * Cancella quello che c'è. Chi non ha un computer sottomano fa la stessa cosa
 * dal browser: vedi la rotta /api/installa.
 */
async function main(): Promise<void> {
  const esito = await seminaEsempi()

  console.info(`Fatto: ${esito.collezioni} collezioni, ${esito.prodotti} prodotti.`)
}

main()
  .then(() => process.exit(0))
  .catch((errore: unknown) => {
    console.error('Seed fallito:', errore)
    process.exit(1)
  })
