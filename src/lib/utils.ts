import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { site } from '@/lib/site'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/** Formatta un importo in centesimi come prezzo in euro, stile italiano. */
export function formatPrice(cents: number, options?: { withCents?: boolean }): string {
  const withCents = options?.withCents ?? cents % 100 !== 0
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  }).format(cents / 100)
}

/** 12.5 -> "12,5" — i decimali italiani usano la virgola. */
export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Il CAP italiano è sempre di 5 cifre. */
export function isValidPostalCode(cap: string): boolean {
  return /^\d{5}$/.test(cap.trim())
}

export function absoluteUrl(path: string): string {
  // Un solo punto decide qual è l'indirizzo del sito: `site.url`.
  return new URL(path, site.url).toString()
}
