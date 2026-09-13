import { ImageResponse } from 'next/og'
import { site } from '@/lib/site'

export const runtime = 'nodejs'
export const alt = `${site.name} — vasi in cemento fatti a mano a Cerveteri`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

/**
 * Immagine di anteprima per i social, generata al volo.
 * Palette del progetto, nessun angolo arrotondato, nessuna emoji.
 */
export default function ImmagineApertura() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: '#F7F4EE',
        color: '#2B2825',
        padding: '72px',
        borderBottom: '24px solid #8C4A2F',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 26,
          letterSpacing: 10,
          textTransform: 'uppercase',
          color: '#6F675D',
        }}
      >
        Materia Etrusca
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: 86, lineHeight: 1.05, maxWidth: 980 }}>
          {site.manifesto}
        </div>
        <div style={{ display: 'flex', marginTop: 28, fontSize: 30, color: '#6F675D' }}>
          Vasi-scultura in cemento colato a mano · Cerveteri
        </div>
      </div>
    </div>,
    size,
  )
}
