import { getRequestConfig } from 'next-intl/server'
import { defaultLocale, isLocale } from '@/i18n/config'

/**
 * Per ora la lingua è una sola. La struttura però è già quella definitiva:
 * quando servirà l'inglese basterà leggere il locale da cookie o da segmento URL.
 */
export default getRequestConfig(async () => {
  const requested = process.env.NEXT_PUBLIC_DEFAULT_LOCALE
  const locale = isLocale(requested) ? requested : defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    timeZone: 'Europe/Rome',
    now: new Date(),
  }
})
