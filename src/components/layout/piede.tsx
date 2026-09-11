import Link from 'next/link'
import { Instagram } from 'lucide-react'
import { vociAssistenza, vociLegali, vociPrincipali } from '@/components/layout/navigazione'
import { ModuloNewsletter } from '@/components/marketing/modulo-newsletter'
import { site } from '@/lib/site'

export function Piede() {
  const anno = new Date().getFullYear()

  return (
    <footer className="border-bordo bg-tufo mt-(--spacing-sezione) border-t">
      <div className="contenitore py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-3xl font-light md:text-4xl">{site.name}</p>
            <p className="text-testo-tenue mt-4 max-w-sm text-sm leading-relaxed">
              {site.shortDescription}
            </p>
            <address className="text-testo-tenue mt-6 text-sm not-italic">
              {site.laboratory.street}
              <br />
              {site.laboratory.postalCode} {site.laboratory.city} ({site.laboratory.province})
              <br />
              <a
                href={`mailto:${site.artisan.email}`}
                className="hover:text-antracite underline underline-offset-4 transition-colors duration-300"
              >
                {site.artisan.email}
              </a>
            </address>
            <a
              href={site.social.instagram}
              target="_blank"
              rel="noreferrer noopener"
              className="text-testo-tenue hover:text-antracite mt-6 inline-flex items-center gap-2 text-sm transition-colors duration-300"
            >
              <Instagram className="size-4" aria-hidden />
              Instagram
            </a>
          </div>

          <nav aria-label="Esplora">
            <p className="occhiello">Esplora</p>
            <ul className="mt-5 space-y-2.5">
              {vociPrincipali.map((voce) => (
                <li key={voce.href}>
                  <Link
                    href={voce.href}
                    className="text-testo-tenue hover:text-antracite text-sm transition-colors duration-300"
                  >
                    {voce.etichetta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Assistenza">
            <p className="occhiello">Assistenza</p>
            <ul className="mt-5 space-y-2.5">
              {vociAssistenza.map((voce) => (
                <li key={`${voce.href}-${voce.etichetta}`}>
                  <Link
                    href={voce.href}
                    className="text-testo-tenue hover:text-antracite text-sm transition-colors duration-300"
                  >
                    {voce.etichetta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="border-cemento mt-14 border-t pt-10">
          <ModuloNewsletter />
        </div>

        <div className="border-cemento text-testo-tenue mt-12 flex flex-col gap-4 border-t pt-8 text-xs md:flex-row md:items-center md:justify-between">
          <p>
            © {anno} {site.legal.companyName} — P. IVA {site.legal.vatNumber}. Tutti i diritti
            riservati.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {vociLegali.map((voce) => (
              <li key={voce.href}>
                <Link
                  href={voce.href}
                  className="hover:text-antracite transition-colors duration-300"
                >
                  {voce.etichetta}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
