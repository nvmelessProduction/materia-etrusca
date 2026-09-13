import { seminaProduzione } from '@/db/semina-produzione'

/**
 * Popolamento di produzione da riga di comando.
 *
 *   pnpm db:seed:prod
 *
 * Chi non ha un computer sottomano può fare la stessa cosa dal browser:
 * vedi la rotta /api/installa.
 */
async function main(): Promise<void> {
  const esito = await seminaProduzione()

  console.info(
    `Fatto: ${esito.fasce} fasce di spedizione, ${esito.testi} testi. I prodotti si inseriscono dal pannello.`,
  )
  console.info(
    'Ricordati di controllare le tariffe in /admin/spedizioni: quelle qui sono indicative.',
  )
}

main()
  .then(() => process.exit(0))
  .catch((errore: unknown) => {
    console.error('Seed di produzione fallito:', errore)
    process.exit(1)
  })
