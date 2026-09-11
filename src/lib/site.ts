export const site = {
  name: 'Materia Etrusca',
  /** La frase che apre la home. Prima persona, asciutta. */
  manifesto: 'Colo il cemento a mano, una forma alla volta.',
  shortDescription:
    'Vasi-scultura in cemento colato a mano a Cerveteri, ispirati alle forme etrusche.',
  description:
    'Vasi e fioriere scultura in cemento, colati e rifiniti a mano nel mio laboratorio di Cerveteri. Pezzi grandi da esterno, forme ispirate alla ceramica etrusca, ogni esemplare leggermente diverso dall’altro.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
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
