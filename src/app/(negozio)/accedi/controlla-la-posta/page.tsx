import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Controlla la posta',
  robots: { index: false, follow: false },
}

export default function ControllaLaPosta() {
  return (
    <div className="contenitore max-w-md py-20 md:py-28">
      <h1 className="font-display text-4xl font-light md:text-5xl">Ti ho scritto.</h1>
      <p className="text-testo-tenue mt-5 leading-relaxed">
        Apri l’email e clicca il link: ti riporta qui, già dentro. Vale una volta sola e scade fra
        un’ora.
      </p>
      <p className="text-testo-tenue mt-5 text-sm">
        Se non lo trovi, guarda nella posta indesiderata: certi filtri sono severi con i link.
      </p>
    </div>
  )
}
