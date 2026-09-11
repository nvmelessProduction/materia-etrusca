import { Cormorant_Garamond, Inter } from 'next/font/google'

/**
 * next/font scarica i file in fase di build e li serve dal nostro dominio:
 * nessuna richiesta bloccante verso terzi a runtime.
 */
export const fontDisplay = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
})

export const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})
