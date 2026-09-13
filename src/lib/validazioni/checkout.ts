import { z } from 'zod'

/**
 * Un solo schema per il modulo del checkout, usato **sia** dal browser sia dal
 * server. Quello che arriva dal client non è mai attendibile: viene rivalidato
 * con questo stesso schema prima di creare l'ordine.
 */

const testoBreve = (max: number) => z.string().trim().min(1).max(max)

/** Partita IVA italiana: undici cifre. */
const partitaIva = z
  .string()
  .trim()
  .transform((valore) => valore.replace(/^IT/i, '').replace(/\s/g, ''))
  .pipe(z.string().regex(/^\d{11}$/, 'La partita IVA ha undici cifre.'))

/** Codice destinatario SDI: sette caratteri. Per i privati vale anche la PEC. */
const codiceSdi = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,7}$/, 'Il codice SDI ha sette caratteri.')

export const METODI_SPEDIZIONE_SCEGLIBILI = ['courier', 'pallet', 'pickup'] as const
export const METODI_PAGAMENTO = ['stripe', 'paypal', 'bank_transfer'] as const

export const schemaCheckout = z
  .object({
    email: z.email('Serve un indirizzo email valido.').trim().toLowerCase(),
    nome: testoBreve(120),
    // Il corriere chiama sempre prima di consegnare: senza numero non parte niente.
    telefono: z
      .string()
      .trim()
      .min(6, 'Serve un numero dove il corriere possa chiamarti.')
      .max(40)
      .regex(/^[+\d][\d\s./-]{5,}$/, 'Il numero non sembra valido.'),

    indirizzo: testoBreve(200),
    indirizzo2: z.string().trim().max(200).optional().or(z.literal('')),
    citta: testoBreve(120),
    cap: z
      .string()
      .trim()
      .regex(/^\d{5}$/, 'Il CAP ha cinque cifre.'),
    provincia: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, 'La provincia è di due lettere, per esempio RM.'),
    paese: z.string().trim().toUpperCase().length(2).default('IT'),

    /** ZTL, piano alto senza ascensore, cortile stretto. */
    noteConsegna: z.string().trim().max(600).optional().or(z.literal('')),

    metodoSpedizione: z.enum(METODI_SPEDIZIONE_SCEGLIBILI),
    consegnaAlPiano: z.boolean().default(false),

    metodoPagamento: z.enum(METODI_PAGAMENTO),

    fatturaRichiesta: z.boolean().default(false),
    partitaIva: z.string().trim().optional().or(z.literal('')),
    codiceSdi: z.string().trim().optional().or(z.literal('')),

    accettaTermini: z
      .boolean()
      .refine((valore) => valore === true, 'Serve la tua conferma per procedere.'),
    newsletter: z.boolean().default(false),

    /** Campo esca: se è pieno, chi ha compilato il modulo non è una persona. */
    azienda: z.string().max(0).optional().or(z.literal('')),
  })
  .superRefine((dati, contesto) => {
    if (!dati.fatturaRichiesta) return

    const esitoIva = partitaIva.safeParse(dati.partitaIva ?? '')
    if (!esitoIva.success) {
      contesto.addIssue({
        code: 'custom',
        path: ['partitaIva'],
        message: 'Per la fattura serve la partita IVA, undici cifre.',
      })
    }

    const esitoSdi = codiceSdi.safeParse(dati.codiceSdi ?? '')
    if (!esitoSdi.success) {
      contesto.addIssue({
        code: 'custom',
        path: ['codiceSdi'],
        message: 'Per la fattura serve il codice destinatario SDI, sette caratteri.',
      })
    }
  })

export type DatiCheckout = z.output<typeof schemaCheckout>
/** Forma dei campi come li tiene il modulo: i valori con default qui sono ancora opzionali. */
export type IngressoCheckout = z.input<typeof schemaCheckout>

export const ETICHETTE_PAGAMENTO = {
  stripe: 'Carta, Apple Pay o Google Pay',
  paypal: 'PayPal',
  bank_transfer: 'Bonifico bancario',
} as const

export const DESCRIZIONI_PAGAMENTO = {
  stripe: 'Vieni portato sulla pagina sicura di Stripe. Io non vedo mai il numero della carta.',
  paypal: 'Paghi con il tuo conto PayPal e torni qui.',
  bank_transfer:
    'Ti mando gli estremi via email. Metto da parte il pezzo e parte appena vedo il bonifico, di solito in due o tre giorni.',
} as const
