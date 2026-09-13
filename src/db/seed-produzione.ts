import { sql } from 'drizzle-orm'
import { db } from '@/db'
import { contentBlocks, shippingRates } from '@/db/schema'

/**
 * Seed di produzione: **nessun prodotto finto**.
 * Mette solo quello che serve perché il sito funzioni il primo giorno —
 * le fasce di spedizione e i testi delle pagine — e si può rieseguire
 * senza fare danni: quello che c'è già non viene toccato.
 *
 *   pnpm db:seed:prod
 */

const FASCE_ITALIA = [
  { min: 0, max: 5, prezzo: 900, eta: 3 },
  { min: 5, max: 15, prezzo: 1500, eta: 3 },
  { min: 15, max: 30, prezzo: 2500, eta: 4 },
  { min: 30, max: 50, prezzo: 3900, eta: 5 },
  { min: 50, max: 70, prezzo: 5900, eta: 6 },
]

async function fasce(): Promise<number> {
  const [esistenti] = await db.select({ quante: sql<number>`count(*)::int` }).from(shippingRates)

  if ((esistenti?.quante ?? 0) > 0) {
    console.info('Fasce di spedizione già presenti: non tocco niente.')
    return 0
  }

  const valori = [
    ...FASCE_ITALIA.map((fascia) => ({
      minWeightKg: String(fascia.min),
      maxWeightKg: String(fascia.max),
      method: 'courier' as const,
      priceCents: fascia.prezzo,
      zone: 'italia' as const,
      etaDays: fascia.eta,
    })),
    ...FASCE_ITALIA.map((fascia) => ({
      minWeightKg: String(fascia.min),
      maxWeightKg: String(fascia.max),
      method: 'courier' as const,
      priceCents: Math.round(fascia.prezzo * 1.45),
      zone: 'isole' as const,
      etaDays: fascia.eta + 3,
    })),
    ...FASCE_ITALIA.map((fascia) => ({
      minWeightKg: String(fascia.min),
      maxWeightKg: String(fascia.max),
      method: 'courier' as const,
      priceCents: Math.round(fascia.prezzo * 2.4),
      zone: 'estero' as const,
      etaDays: fascia.eta + 6,
    })),
    {
      minWeightKg: '0',
      maxWeightKg: '250',
      method: 'floor_delivery' as const,
      priceCents: 4900,
      zone: 'italia' as const,
      etaDays: 10,
    },
    {
      minWeightKg: '0',
      maxWeightKg: '9999',
      method: 'pickup' as const,
      priceCents: 0,
      zone: 'italia' as const,
      etaDays: 2,
    },
  ]

  await db.insert(shippingRates).values(valori)
  return valori.length
}

const TESTI = [
  {
    key: 'faq.tempi',
    group: 'faq',
    title: 'Quanto tempo passa fra l’ordine e la consegna?',
    body: 'I pezzi a magazzino partono in due giorni lavorativi e arrivano in tre o quattro. Quelli su ordinazione li colo apposta: il tempo è scritto sulla scheda, di solito fra le tre e le cinque settimane. Il cemento ha bisogno dei suoi giorni per fare presa, non si accorcia.',
    position: 0,
  },
  {
    key: 'faq.gelo',
    group: 'faq',
    title: 'Posso lasciarlo fuori d’inverno?',
    body: 'Sì, i pezzi segnati come resistenti al gelo restano fuori tutto l’anno. L’unica accortezza è sollevarli da terra di un paio di centimetri, così sotto non ristagna l’acqua. Non è il freddo a rompere il cemento: è il ghiaccio che si forma nell’acqua ferma.',
    position: 1,
  },
  {
    key: 'faq.differenze',
    group: 'faq',
    title: 'Il pezzo che ricevo sarà identico alla foto?',
    body: 'No, e non deve esserlo. Ogni getto prende il colore un po’ diverso, e le bolle d’aria cadono dove capita. Le piccole variazioni sono la firma, non un difetto. Se una differenza ti sembra eccessiva, scrivimi e ne parliamo.',
    position: 2,
  },
  {
    key: 'faq.peso',
    group: 'faq',
    title: 'Chi mi aiuta a portarlo su?',
    body: 'Il corriere consegna al piano strada. Per i pezzi sopra i 50 kg puoi aggiungere la consegna al piano al momento dell’ordine, oppure scrivermi: se abiti vicino a Cerveteri te lo porto io.',
    position: 3,
  },
  {
    key: 'faq.reso',
    group: 'faq',
    title: 'Se non mi piace posso renderlo?',
    body: 'Hai quattordici giorni per ripensarci. Il pezzo deve tornare integro e nel suo imballo: le spese di rientro sono a tuo carico perché il peso conta, e per i pezzi grandi non sono poche. I pezzi fatti su misura non si possono rendere.',
    position: 4,
  },
]

async function testi(): Promise<number> {
  const inseriti = await db
    .insert(contentBlocks)
    .values(TESTI)
    .onConflictDoNothing({ target: contentBlocks.key })
    .returning({ id: contentBlocks.id })

  return inseriti.length
}

async function main(): Promise<void> {
  const quanteFasce = await fasce()
  const quantiTesti = await testi()

  console.info(
    `Fatto: ${quanteFasce} fasce di spedizione, ${quantiTesti} testi. I prodotti si inseriscono dal pannello.`,
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
