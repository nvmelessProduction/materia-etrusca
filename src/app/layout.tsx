import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { Toaster } from 'sonner'
import { ProviderCarrello } from '@/components/carrello/contesto-carrello'
import { leggiCarrello } from '@/lib/carrello/server'
import { fontDisplay, fontSans } from '@/lib/fonts'
import { site } from '@/lib/site'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — vasi in cemento fatti a mano a Cerveteri`,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  openGraph: {
    type: 'website',
    locale: site.locale,
    siteName: site.name,
    url: site.url,
    title: `${site.name} — vasi in cemento fatti a mano`,
    description: site.description,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#F7F4EE',
  colorScheme: 'light',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, messages, carrello] = await Promise.all([
    getLocale(),
    getMessages(),
    leggiCarrello(),
  ])

  return (
    <html lang={locale} className={`${fontDisplay.variable} ${fontSans.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ProviderCarrello iniziale={carrello}>
            {children}
            <Toaster
              position="bottom-center"
              toastOptions={{
                className: 'font-sans text-sm',
                style: {
                  borderRadius: 0,
                  background: 'var(--color-antracite)',
                  color: 'var(--color-calce)',
                  border: 'none',
                },
              }}
            />
          </ProviderCarrello>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
