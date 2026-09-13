import 'server-only'
import Stripe from 'stripe'
import { optionalEnv, requireEnv } from '@/lib/env'

let istanza: Stripe | null = null

export function stripe(): Stripe {
  istanza ??= new Stripe(requireEnv('STRIPE_SECRET_KEY'), {
    // Versione fissata: un aggiornamento dell'API non deve cambiare il
    // comportamento del checkout da un giorno all'altro senza che ce ne accorgiamo.
    apiVersion: '2026-08-26.dahlia',
    typescript: true,
    appInfo: { name: 'Materia Etrusca' },
  })
  return istanza
}

export function stripeConfigurato(): boolean {
  return Boolean(optionalEnv('STRIPE_SECRET_KEY'))
}
