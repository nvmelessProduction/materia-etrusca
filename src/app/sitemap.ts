import type { MetadataRoute } from 'next'
import { slugCollezioni } from '@/db/queries/collezioni'
import { slugProdottiAttivi } from '@/db/queries/prodotti'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'
/** Un'ora: il catalogo non cambia ogni minuto, i motori non lo rileggono ogni minuto. */
export const revalidate = 3600

const PAGINE_FISSE: {
  percorso: string
  priorita: number
  frequenza: 'daily' | 'weekly' | 'monthly' | 'yearly'
}[] = [
  { percorso: '', priorita: 1, frequenza: 'weekly' },
  { percorso: '/collezioni', priorita: 0.9, frequenza: 'weekly' },
  { percorso: '/progetto', priorita: 0.9, frequenza: 'monthly' },
  { percorso: '/su-misura', priorita: 0.7, frequenza: 'monthly' },
  { percorso: '/storia', priorita: 0.6, frequenza: 'yearly' },
  { percorso: '/contatti', priorita: 0.6, frequenza: 'yearly' },
  { percorso: '/faq', priorita: 0.6, frequenza: 'monthly' },
  { percorso: '/cura-del-cemento', priorita: 0.5, frequenza: 'yearly' },
  { percorso: '/spedizioni-e-resi', priorita: 0.5, frequenza: 'monthly' },
  { percorso: '/termini', priorita: 0.2, frequenza: 'yearly' },
  { percorso: '/privacy', priorita: 0.2, frequenza: 'yearly' },
  { percorso: '/cookie', priorita: 0.2, frequenza: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const adesso = new Date()

  const fisse: MetadataRoute.Sitemap = PAGINE_FISSE.map((pagina) => ({
    url: `${site.url}${pagina.percorso}`,
    lastModified: adesso,
    changeFrequency: pagina.frequenza,
    priority: pagina.priorita,
  }))

  try {
    const [collezioni, prodotti] = await Promise.all([slugCollezioni(), slugProdottiAttivi()])

    return [
      ...fisse,
      ...collezioni.map((slug) => ({
        url: `${site.url}/collezioni/${slug}`,
        lastModified: adesso,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...prodotti.map((prodotto) => ({
        url: `${site.url}/prodotti/${prodotto.slug}`,
        lastModified: prodotto.aggiornatoIl,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ]
  } catch (errore) {
    // Senza database si pubblica comunque la parte fissa: meglio una sitemap
    // incompleta che un errore 500 in faccia al crawler.
    console.error('Sitemap: catalogo non leggibile.', errore)
    return fisse
  }
}
