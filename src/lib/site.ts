/**
 * Indirizzo pubblico del sito.
 *
 * Va risolto con attenzione perché da qui dipendono `metadataBase`, i link
 * dentro le email, la sitemap e i dati strutturati — e viene usato al livello
 * del modulo, quindi un valore storto fa fallire la build invece di degradare.
 *
 * In ordine: la variabile esplicita, poi il dominio che Vercel assegna
 * all'anteprima (così un deploy funziona anche prima di aver configurato il
 * dominio vero), infine lo sviluppo locale.
 */
export function risolviUrlSito(
  esplicito: string | undefined,
  dominioVercel?: string | undefined,
): string {
  const scelto = esplicito?.trim() || dominioVercel?.trim()

  if (scelto) {
    // Chi incolla "materiaetrusca.it" senza protocollo non deve far cadere niente.
    const conProtocollo = /^https?:\/\//i.test(scelto) ? scelto : `https://${scelto}`
    const pulito = conProtocollo.replace(/\/+$/, '')
    try {
      // Se l'indirizzo è comunque malformato si ripiega, non si solleva.
      return new URL(pulito).origin + new URL(pulito).pathname.replace(/\/+$/, '')
    } catch {
      return SVILUPPO
    }
  }

  return SVILUPPO
}

const SVILUPPO = 'http://localhost:3000'

export const site = {
  name: 'Materia Etrusca',
  /** La frase che apre la home. Prima persona, asciutta. */
  manifesto: 'Colo il cemento a mano, una forma alla volta.',
  shortDescription:
    'Vasi-scultura in cemento colato a mano a Cerveteri, ispirati alle forme etrusche.',
  description:
    'Vasi e fioriere scultura in cemento, colati e rifiniti a mano nel mio laboratorio di Cerveteri. Pezzi grandi da esterno, forme ispirate alla ceramica etrusca, ogni esemplare leggermente diverso dall’altro.',
  url: risolviUrlSito(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_VERCEL_URL ?? process.env.VERCEL_URL,
  ),
  locale: 'it_IT',
  artisan: {
    name: 'Materia Etrusca',
    email: process.env.ARTISAN_EMAIL ?? 'ciao@materiaetrusca.it',
    phone: '+39 340 000 0000',
    whatsapp: '393400000000',
  },
  laboratory: {
    street: 'Via del Tufo 14',
    city: 'Cerveteri',
    province: 'RM',
    postalCode: '00052',
    country: 'IT',
    latitude: 42.0001,
    longitude: 12.0956,
    openingHours: 'Lun–Ven 9:00–18:00, sabato su appuntamento',
  },
  legal: {
    companyName: 'Materia Etrusca di [Nome Cognome]',
    vatNumber: 'IT00000000000',
    reaNumber: 'RM-0000000',
  },
  social: {
    instagram: 'https://www.instagram.com/materiaetrusca',
    pinterest: 'https://www.pinterest.it/materiaetrusca',
  },
  /** Sopra questa soglia il corriere non fa più prezzo automatico. */
  maxAutomaticShippingWeightKg: 70,
  /** Giorni di validità di una proposta di progetto. */
  proposalValidityDays: 30,
} as const

export type Site = typeof site
