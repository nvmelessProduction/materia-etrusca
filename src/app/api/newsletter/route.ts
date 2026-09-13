import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { newsletterSubscribers } from '@/db/schema'
import { consumaLimite } from '@/lib/limite-richieste'

const schema = z.object({
  email: z.email(),
  consenso: z.boolean(),
  /** Campo esca: se è pieno, chi ha compilato non è una persona. */
  azienda: z.string().max(0).optional(),
})

export async function POST(richiesta: Request): Promise<Response> {
  const permesso = await consumaLimite(richiesta, 'newsletter', { quante: 5, finestraMs: 60_000 })
  if (!permesso) {
    return NextResponse.json({ ok: false, errore: 'Hai riprovato troppe volte.' }, { status: 429 })
  }

  const lettura = schema.safeParse(await richiesta.json().catch(() => null))
  if (!lettura.success) {
    return NextResponse.json({ ok: false, errore: 'Controlla l’indirizzo.' }, { status: 400 })
  }

  // Robot: si risponde ok e non si scrive nulla.
  if (lettura.data.azienda) return NextResponse.json({ ok: true })

  if (!lettura.data.consenso) {
    return NextResponse.json(
      { ok: false, errore: 'Serve la spunta sul consenso.' },
      { status: 400 },
    )
  }

  await db
    .insert(newsletterSubscribers)
    .values({ email: lettura.data.email.toLowerCase(), source: 'sito' })
    .onConflictDoUpdate({
      target: newsletterSubscribers.email,
      // Chi si era cancellato e torna, torna davvero.
      set: { unsubscribedAt: null, consentedAt: new Date() },
    })

  return NextResponse.json({ ok: true })
}
