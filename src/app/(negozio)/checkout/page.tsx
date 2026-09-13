import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { leggiCarrello } from '@/lib/carrello/server'
import { sessioneUtente } from '@/lib/auth'
import { stripeConfigurato } from '@/lib/pagamenti/stripe'
import { paypalConfigurato } from '@/lib/pagamenti/paypal'
import { ModuloCheckout } from '@/components/checkout/modulo-checkout'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Pagamento',
  robots: { index: false, follow: false },
}

export default async function PaginaCheckout({
  searchParams,
}: {
  searchParams: Promise<{ annullato?: string }>
}) {
  const [carrello, utente, { annullato }] = await Promise.all([
    leggiCarrello(),
    sessioneUtente(),
    searchParams,
  ])

  if (carrello.righe.length === 0) redirect('/carrello')

  return (
    <div className="contenitore py-12 md:py-16">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="font-display text-4xl font-light md:text-5xl">Ci siamo quasi</h1>
        <Link
          href="/carrello"
          className="text-testo-tenue hover:text-antracite text-sm underline underline-offset-4 transition-colors duration-300"
        >
          Torna al carrello
        </Link>
      </div>

      {annullato ? (
        <p role="status" className="border-bordo bg-tufo mt-8 border p-4 text-sm">
          Hai interrotto il pagamento. Non ho addebitato niente e il carrello è rimasto com’era.
        </p>
      ) : null}

      <div className="mt-10">
        <ModuloCheckout
          emailIniziale={utente?.email ?? ''}
          capIniziale={carrello.cap ?? ''}
          pagamentiDisponibili={{ stripe: stripeConfigurato(), paypal: paypalConfigurato() }}
        />
      </div>
    </div>
  )
}
