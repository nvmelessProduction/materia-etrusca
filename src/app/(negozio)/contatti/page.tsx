import type { Metadata } from 'next'
import Link from 'next/link'
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { Briciole } from '@/components/layout/briciole'
import { DatiStrutturati } from '@/lib/seo/dati-strutturati'
import { schemaAttivitaLocale } from '@/lib/seo/schemi'
import { site } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Contatti',
  description: `Il laboratorio è a ${site.laboratory.city}, in provincia di Roma. Scrivimi, chiamami o passa: rispondo io.`,
  alternates: { canonical: '/contatti' },
}

const indirizzoCompleto = `${site.laboratory.street}, ${site.laboratory.postalCode} ${site.laboratory.city} ${site.laboratory.province}`

export default function PaginaContatti() {
  const mappa = `https://www.openstreetmap.org/export/embed.html?bbox=${site.laboratory.longitude - 0.01}%2C${site.laboratory.latitude - 0.008}%2C${site.laboratory.longitude + 0.01}%2C${site.laboratory.latitude + 0.008}&layer=mapnik&marker=${site.laboratory.latitude}%2C${site.laboratory.longitude}`

  return (
    <>
      <DatiStrutturati dati={schemaAttivitaLocale()} />

      <div className="contenitore pt-8">
        <Briciole voci={[{ etichetta: 'Contatti' }]} />
      </div>

      <div className="contenitore py-12 md:py-20">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="occhiello">Il laboratorio</p>
            <h1 className="font-display mt-5 text-4xl font-light md:text-6xl">
              Rispondo io. Non c’è nessun altro.
            </h1>
            <p className="text-testo-tenue mt-7 text-lg leading-relaxed">
              Se scrivi di mattina ti rispondo in giornata. Se scrivi mentre sto colando, ti
              rispondo la sera: le mani nel cemento non si possono lavare a metà.
            </p>

            <dl className="mt-12 space-y-8">
              <Voce icona={<Mail aria-hidden className="size-5" />} etichetta="Email">
                <a
                  href={`mailto:${site.artisan.email}`}
                  className="hover:text-terracotta underline underline-offset-4 transition-colors duration-300"
                >
                  {site.artisan.email}
                </a>
                <p className="text-testo-tenue mt-1 text-sm">
                  Il modo migliore: posso guardare con calma le foto che mi mandi.
                </p>
              </Voce>

              <Voce icona={<MessageCircle aria-hidden className="size-5" />} etichetta="WhatsApp">
                <a
                  href={`https://wa.me/${site.artisan.whatsapp}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="hover:text-terracotta underline underline-offset-4 transition-colors duration-300"
                >
                  Scrivimi su WhatsApp
                </a>
                <p className="text-testo-tenue mt-1 text-sm">
                  Per le cose veloci: una misura, una data, «ce l’hai in ocra?».
                </p>
              </Voce>

              <Voce icona={<Phone aria-hidden className="size-5" />} etichetta="Telefono">
                <a
                  href={`tel:${site.artisan.phone.replace(/\s/g, '')}`}
                  className="hover:text-terracotta underline underline-offset-4 transition-colors duration-300"
                >
                  {site.artisan.phone}
                </a>
                <p className="text-testo-tenue mt-1 text-sm">{site.laboratory.openingHours}.</p>
              </Voce>

              <Voce icona={<MapPin aria-hidden className="size-5" />} etichetta="Dove sono">
                <address className="not-italic">
                  {site.laboratory.street}
                  <br />
                  {site.laboratory.postalCode} {site.laboratory.city} ({site.laboratory.province})
                </address>
                <p className="text-testo-tenue mt-1 text-sm">
                  Si può venire a vedere i pezzi dal vivo, ma avvisami prima: se sono a colare non
                  sento il campanello.
                </p>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${site.laboratory.latitude}&mlon=${site.laboratory.longitude}#map=17/${site.laboratory.latitude}/${site.laboratory.longitude}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-3 inline-block text-sm underline underline-offset-4"
                >
                  Apri nelle mappe
                </a>
              </Voce>
            </dl>
          </div>

          <div>
            <div className="border-bordo border">
              {/* La mappa è un iframe di OpenStreetMap: nessun cookie, nessun consenso da chiedere. */}
              <iframe
                src={mappa}
                title={`Mappa del laboratorio a ${site.laboratory.city}`}
                loading="lazy"
                className="block h-80 w-full md:h-[26rem]"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <p className="text-testo-tenue mt-2 text-xs">
              Mappa di OpenStreetMap. Non traccia niente e non ha bisogno del tuo consenso.
            </p>

            <div className="border-bordo bg-tufo mt-10 border p-6">
              <p className="font-display text-2xl font-light">Se il motivo è «ci starà bene?»</p>
              <p className="text-testo-tenue mt-3 text-sm leading-relaxed">
                Non scrivermi: mandami direttamente la foto. Il modulo mi fa già le domande giuste e
                ci mette novanta secondi.
              </p>
              <Link
                href="/progetto"
                className="bg-terracotta text-calce hover:bg-terracotta-scuro mt-6 inline-flex h-12 items-center px-6 text-sm transition-colors duration-300"
              >
                Mandami la foto
              </Link>
            </div>

            <p className="text-testo-tenue mt-8 text-xs leading-relaxed">
              {site.legal.companyName} — P. IVA {site.legal.vatNumber} — REA {site.legal.reaNumber}
              <br />
              Sede operativa: {indirizzoCompleto}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

function Voce({
  icona,
  etichetta,
  children,
}: {
  icona: React.ReactNode
  etichetta: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-4">
      <span className="text-testo-tenue mt-0.5 shrink-0">{icona}</span>
      <div>
        <dt className="occhiello">{etichetta}</dt>
        <dd className="mt-2">{children}</dd>
      </div>
    </div>
  )
}
