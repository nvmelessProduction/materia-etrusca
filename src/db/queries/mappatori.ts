import type { Product, ProductVariant } from '@/db/schema'
import type { ProdottoDominio, ScontoDominio, VarianteDominio } from '@/lib/dominio/tipi'
import type { DiscountCode } from '@/db/schema'

/**
 * Postgres restituisce le colonne `numeric` come stringa, per non perdere
 * precisione. La conversione a numero avviene qui, in un punto solo, e mai
 * nei componenti.
 */
export function numero(valore: string | number | null | undefined, fallback = 0): number {
  if (valore === null || valore === undefined) return fallback
  const n = typeof valore === 'number' ? valore : Number.parseFloat(valore)
  return Number.isFinite(n) ? n : fallback
}

export function aVarianteDominio(riga: ProductVariant): VarianteDominio {
  return {
    id: riga.id,
    sku: riga.sku,
    altezzaCm: numero(riga.heightCm),
    diametroCm: numero(riga.diameterCm),
    pesoKg: numero(riga.weightKg),
    finitura: riga.finish,
    prezzoCents: riga.priceCents,
    giacenza: riga.stock,
    pesoImballoKg: numero(riga.packageWeightKg),
    volumeImballoL: numero(riga.packageVolumeL),
    posizione: riga.position,
  }
}

export function aProdottoDominio(riga: Product): ProdottoDominio {
  return {
    id: riga.id,
    slug: riga.slug,
    nome: riga.name,
    prezzoBaseCents: riga.basePriceCents,
    pezzoUnico: riga.isUnique,
    suOrdinazione: riga.isMadeToOrder,
    giorniDiAttesa: riga.leadTimeDays,
  }
}

export function aScontoDominio(riga: DiscountCode): ScontoDominio {
  return {
    codice: riga.code,
    tipo: riga.type,
    valore: riga.value,
    minimoOrdineCents: riga.minOrderCents,
    limiteUtilizzi: riga.usageLimit,
    utilizzi: riga.usedCount,
    scadenza: riga.expiresAt,
    attivo: riga.active,
  }
}

export const ETICHETTE_FINITURA = {
  grezzo: 'Grezzo',
  levigato: 'Levigato',
  ocra: 'Ocra',
  antracite: 'Antracite',
} as const

export const DESCRIZIONI_FINITURA = {
  grezzo: 'La superficie come esce dal cassero: porosa, con le bolle del getto in vista.',
  levigato: 'Carteggiato a mano fino a scoprire gli inerti. Al tatto è liscio e freddo.',
  ocra: 'Pigmento di terra impastato nel cemento: un giallo spento, non uniforme.',
  antracite: 'Pigmento nero nell’impasto. Scurisce con l’acqua e schiarisce asciugando.',
} as const
