import { ImageResponse } from 'next/og'
import { prodottoPerSlug } from '@/db/queries/prodotti'
import { site } from '@/lib/site'

export const runtime = 'nodejs'
export const alt = 'Scheda prodotto Materia Etrusca'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function euro(cents: number): string {
  const intero = Math.floor(cents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${intero} €`
}

export default async function ImmagineProdotto({ params }: { params: { slug: string } }) {
  const prodotto = await prodottoPerSlug(params.slug).catch(() => null)

  const nome = prodotto?.nome ?? site.name
  const altezze = prodotto
    ? [...new Set(prodotto.varianti.map((variante) => Math.round(variante.altezzaCm)))].sort(
        (a, b) => a - b,
      )
    : []
  const misura =
    altezze.length === 0
      ? ''
      : altezze.length === 1
        ? `${altezze[0]} cm`
        : `${altezze[0]}–${altezze[altezze.length - 1]} cm`

  const prezzo = prodotto
    ? prodotto.prezzoMinCents === prodotto.prezzoMaxCents
      ? euro(prodotto.prezzoMinCents)
      : `da ${euro(prodotto.prezzoMinCents)}`
    : ''

  const foto = prodotto?.immagini.find((immagine) => immagine.tipo !== 'video')?.url

  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', backgroundColor: '#F7F4EE' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: foto ? 660 : 1200,
          padding: '64px',
          color: '#2B2825',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: 9,
            textTransform: 'uppercase',
            color: '#6F675D',
          }}
        >
          Materia Etrusca
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 76, lineHeight: 1.05 }}>{nome}</div>
          {prodotto ? (
            <div style={{ display: 'flex', marginTop: 24, fontSize: 30, color: '#6F675D' }}>
              {[misura, prezzo].filter(Boolean).join(' · ')}
            </div>
          ) : null}
          <div
            style={{
              display: 'flex',
              marginTop: 36,
              fontSize: 24,
              color: '#8C4A2F',
            }}
          >
            Cemento colato a mano a Cerveteri
          </div>
        </div>
      </div>

      {foto ? (
        <div style={{ display: 'flex', width: 540, height: 630 }}>
          <img src={foto} alt="" width={540} height={630} style={{ objectFit: 'cover' }} />
        </div>
      ) : null}
    </div>,
    size,
  )
}
