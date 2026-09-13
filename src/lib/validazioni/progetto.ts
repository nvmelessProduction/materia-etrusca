import { z } from 'zod'

/** I passi del modulo, con le etichette che il cliente vede. */
export const TIPI_SPAZIO = [
  { valore: 'terrazzo', etichetta: 'Terrazzo', nota: 'Balcone, terrazza, loggia' },
  { valore: 'giardino', etichetta: 'Giardino', nota: 'Anche solo un angolo' },
  { valore: 'ingresso', etichetta: 'Ingresso', nota: 'Corridoio, pianerottolo' },
  { valore: 'interno', etichetta: 'Dentro casa', nota: 'Soggiorno, studio, bagno' },
  { valore: 'commerciale', etichetta: 'Un locale', nota: 'Negozio, hotel, ristorante' },
] as const

export const ESPOSIZIONI = [
  { valore: 'sole', etichetta: 'Pieno sole', nota: 'Batte per ore' },
  { valore: 'mezzombra', etichetta: 'Mezz’ombra', nota: 'Sole solo a tratti' },
  { valore: 'ombra', etichetta: 'Ombra', nota: 'Non ci arriva mai' },
] as const

export const STILI = [
  {
    valore: 'minimale',
    etichetta: 'Minimale',
    nota: 'Un pezzo solo, grande, e niente altro intorno.',
  },
  {
    valore: 'mediterraneo',
    etichetta: 'Mediterraneo',
    nota: 'Ulivi, agavi, terracotta. Caldo, un po’ disordinato.',
  },
  {
    valore: 'scenografico',
    etichetta: 'Scenografico',
    nota: 'Più pezzi di altezze diverse, che fanno gruppo.',
  },
] as const

export const FASCE_BUDGET = [
  { valore: '0-250', etichetta: 'Fino a 250 €' },
  { valore: '250-500', etichetta: '250 – 500 €' },
  { valore: '500-1000', etichetta: '500 – 1.000 €' },
  { valore: '1000-2500', etichetta: '1.000 – 2.500 €' },
  { valore: 'oltre-2500', etichetta: 'Oltre 2.500 €' },
  { valore: 'non-so', etichetta: 'Non ho ancora un’idea' },
] as const

export const MASSIMO_FOTO = 5

const valori = <T extends readonly { valore: string }[]>(elenco: T) =>
  elenco.map((voce) => voce.valore) as unknown as [string, ...string[]]

export const schemaRichiestaProgetto = z.object({
  // Passo 2
  tipoSpazio: z.enum(valori(TIPI_SPAZIO)),
  larghezzaM: z.coerce.number().min(0.2).max(200).optional(),
  profonditaM: z.coerce.number().min(0.2).max(200).optional(),
  esposizione: z.enum(valori(ESPOSIZIONI)).optional(),
  stile: z.enum(valori(STILI)).optional(),
  fasciaBudget: z.enum(valori(FASCE_BUDGET)).optional(),
  note: z.string().trim().max(2000).optional().or(z.literal('')),

  // Passo 3
  nome: z.string().trim().min(2, 'Come ti chiamo?').max(200),
  email: z.email('Serve un indirizzo email valido.').trim().toLowerCase(),
  telefono: z.string().trim().max(40).optional().or(z.literal('')),
  citta: z.string().trim().max(120).optional().or(z.literal('')),
  cap: z
    .string()
    .trim()
    .regex(/^\d{5}$/, 'Il CAP ha cinque cifre.')
    .optional()
    .or(z.literal('')),

  // Consensi separati: uno serve a risponderti, l'altro no.
  consensoPrivacy: z
    .boolean()
    .refine((valore) => valore === true, 'Serve il consenso per poterti rispondere.'),
  consensoMarketing: z.boolean().default(false),

  /** Campo esca. */
  azienda: z.string().max(0).optional().or(z.literal('')),
})

export type DatiRichiestaProgetto = z.output<typeof schemaRichiestaProgetto>
export type IngressoRichiestaProgetto = z.input<typeof schemaRichiestaProgetto>
