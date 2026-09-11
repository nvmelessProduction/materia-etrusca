export const locales = ['it', 'en'] as const

export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'it'

/** Le lingue effettivamente pubblicate. L'inglese è predisposto ma non attivo. */
export const activeLocales: readonly Locale[] = ['it']

export function isLocale(value: string | undefined): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value)
}
