import { site } from '@/lib/site'

const URL_BASE = site.url

export function schemaOrganizzazione(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${URL_BASE}/#organizzazione`,
    name: site.name,
    url: URL_BASE,
    description: site.description,
    email: site.artisan.email,
    vatID: site.legal.vatNumber,
    sameAs: [site.social.instagram, site.social.pinterest],
  }
}

export function schemaAttivitaLocale(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${URL_BASE}/#laboratorio`,
    name: site.name,
    description: site.description,
    url: URL_BASE,
    email: site.artisan.email,
    telephone: site.artisan.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.laboratory.street,
      addressLocality: site.laboratory.city,
      addressRegion: site.laboratory.province,
      postalCode: site.laboratory.postalCode,
      addressCountry: site.laboratory.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: site.laboratory.latitude,
      longitude: site.laboratory.longitude,
    },
    openingHours: 'Mo-Fr 09:00-18:00',
    priceRange: '€€',
  }
}

export function schemaBriciole(
  voci: readonly { nome: string; percorso: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: voci.map((voce, indice) => ({
      '@type': 'ListItem',
      position: indice + 1,
      name: voce.nome,
      item: `${URL_BASE}${voce.percorso}`,
    })),
  }
}

export type OffertaProdotto = {
  sku: string
  prezzoCents: number
  disponibile: boolean
  url: string
}

export function schemaProdotto(input: {
  nome: string
  descrizione: string
  slug: string
  immagini: string[]
  offerte: OffertaProdotto[]
  recensioni: { media: number; numero: number } | null
  collezione: string | null
}): Record<string, unknown> {
  const prezzi = input.offerte.map((offerta) => offerta.prezzoCents)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.nome,
    description: input.descrizione,
    image: input.immagini,
    brand: { '@type': 'Brand', name: site.name },
    material: 'Cemento',
    category: input.collezione ?? undefined,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'EUR',
      lowPrice: (Math.min(...prezzi) / 100).toFixed(2),
      highPrice: (Math.max(...prezzi) / 100).toFixed(2),
      offerCount: input.offerte.length,
      offers: input.offerte.map((offerta) => ({
        '@type': 'Offer',
        sku: offerta.sku,
        url: offerta.url,
        priceCurrency: 'EUR',
        price: (offerta.prezzoCents / 100).toFixed(2),
        availability: offerta.disponibile
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@type': 'Organization', name: site.name },
      })),
    },
    aggregateRating: input.recensioni
      ? {
          '@type': 'AggregateRating',
          ratingValue: input.recensioni.media,
          reviewCount: input.recensioni.numero,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  }
}

export function schemaFaq(
  voci: readonly { domanda: string; risposta: string }[],
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: voci.map((voce) => ({
      '@type': 'Question',
      name: voce.domanda,
      acceptedAnswer: { '@type': 'Answer', text: voce.risposta },
    })),
  }
}
