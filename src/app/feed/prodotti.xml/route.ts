import { cercaProdotti, prodottoPerSlug } from '@/db/queries/prodotti'
import { site } from '@/lib/site'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

function esc(testo: string): string {
  return testo
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Feed prodotti per Google Merchant Center.
 * Una riga per variante: Merchant ragiona per articolo acquistabile, non per
 * scheda, e le nostre varianti hanno prezzi e pesi diversi fra loro.
 */
export async function GET(): Promise<Response> {
  const elenco = await cercaProdotti({ perPagina: 48 })
  const schede = await Promise.all(
    elenco.prodotti.map((prodotto) => prodottoPerSlug(prodotto.slug)),
  )

  const voci: string[] = []

  for (const scheda of schede) {
    if (!scheda) continue

    const immagini = scheda.immagini.filter((immagine) => immagine.tipo !== 'video')
    const principale = immagini[0]?.url
    if (!principale) continue

    for (const variante of scheda.varianti) {
      const url = `${site.url}/prodotti/${scheda.slug}?v=${encodeURIComponent(variante.sku)}`
      const disponibilita = variante.disponibilita.acquistabile
        ? scheda.suOrdinazione && variante.giacenza === 0
          ? 'backorder'
          : 'in_stock'
        : 'out_of_stock'

      voci.push(`    <item>
      <g:id>${esc(variante.sku)}</g:id>
      <g:item_group_id>${esc(scheda.slug)}</g:item_group_id>
      <g:title>${esc(`${scheda.nome} ${Math.round(variante.altezzaCm)} cm — ${variante.finitura}`)}</g:title>
      <g:description>${esc(scheda.seoDescription ?? scheda.descrizione.slice(0, 480))}</g:description>
      <g:link>${esc(url)}</g:link>
      <g:image_link>${esc(principale)}</g:image_link>
${immagini
  .slice(1, 5)
  .map(
    (immagine) => `      <g:additional_image_link>${esc(immagine.url)}</g:additional_image_link>`,
  )
  .join('\n')}
      <g:availability>${disponibilita}</g:availability>
      <g:price>${(variante.prezzoCentsEffettivo / 100).toFixed(2)} EUR</g:price>
      <g:brand>${esc(site.name)}</g:brand>
      <g:condition>new</g:condition>
      <g:identifier_exists>no</g:identifier_exists>
      <g:product_type>${esc(scheda.collezione?.nome ?? 'Vasi in cemento')}</g:product_type>
      <g:google_product_category>689</g:google_product_category>
      <g:material>Cemento</g:material>
      <g:shipping_weight>${variante.pesoImballoKg.toFixed(2)} kg</g:shipping_weight>
      <g:product_detail>
        <g:section_name>Misure</g:section_name>
        <g:attribute_name>Altezza</g:attribute_name>
        <g:attribute_value>${Math.round(variante.altezzaCm)} cm</g:attribute_value>
      </g:product_detail>
    </item>`)
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${esc(site.url)}</link>
    <description>${esc(site.shortDescription)}</description>
${voci.join('\n')}
  </channel>
</rss>
`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  })
}
