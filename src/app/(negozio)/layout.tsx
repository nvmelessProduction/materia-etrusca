import { Intestazione } from '@/components/layout/intestazione'
import { Piede } from '@/components/layout/piede'
import { PannelloCarrello } from '@/components/carrello/pannello-carrello'
import { BannerCookie } from '@/components/conformita/banner-cookie'
import { ScriptMisurazione } from '@/components/conformita/script-misurazione'

/** Le pagine pubbliche: intestazione, piede e carrello. Il pannello /admin no. */
export default function LayoutNegozio({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#contenuto" className="skip-link">
        Vai al contenuto
      </a>
      <Intestazione />
      <main id="contenuto" className="flex-1">
        {children}
      </main>
      <Piede />
      <PannelloCarrello />
      <BannerCookie />
      <ScriptMisurazione />
    </>
  )
}
