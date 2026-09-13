import { ordiniPerCsv } from '@/db/queries/admin'
import { sessioneUtente } from '@/lib/auth'
import type { IndirizzoOrdine } from '@/db/queries/ordini'

export const dynamic = 'force-dynamic'

const COLONNE = [
  'numero',
  'data',
  'stato',
  'email',
  'nome',
  'telefono',
  'indirizzo',
  'cap',
  'citta',
  'provincia',
  'paese',
  'metodo_spedizione',
  'metodo_pagamento',
  'merce_eur',
  'spedizione_eur',
  'sconto_eur',
  'totale_eur',
  'codice_sconto',
  'fattura',
  'partita_iva',
  'codice_sdi',
  'corriere',
  'tracking',
  'note_consegna',
]

/** Il commercialista vuole un foglio, non una API. Separatore ';' per Excel italiano. */
function campo(valore: unknown): string {
  const testo = valore === null || valore === undefined ? '' : String(valore)
  return `"${testo.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`
}

function euro(cents: number): string {
  // Virgola decimale: è così che Excel in italiano legge i numeri.
  return (cents / 100).toFixed(2).replace('.', ',')
}

export async function GET(richiesta: Request): Promise<Response> {
  const utente = await sessioneUtente()
  if (!utente || utente.ruolo !== 'admin') {
    return new Response('Non autorizzato.', { status: 401 })
  }

  const url = new URL(richiesta.url)
  const da = url.searchParams.get('da')
  const a = url.searchParams.get('a')

  const ordini = await ordiniPerCsv(da ? new Date(da) : undefined, a ? new Date(a) : undefined)

  const righe = ordini.map((ordine) => {
    const indirizzo = ordine.shippingAddress as IndirizzoOrdine
    return [
      ordine.orderNumber,
      ordine.createdAt.toISOString().slice(0, 10),
      ordine.status,
      ordine.email,
      indirizzo.nome,
      ordine.phone,
      [indirizzo.indirizzo, indirizzo.indirizzo2].filter(Boolean).join(' '),
      indirizzo.cap,
      indirizzo.citta,
      indirizzo.provincia,
      indirizzo.paese,
      ordine.shippingMethod,
      ordine.paymentMethod,
      euro(ordine.subtotalCents),
      euro(ordine.shippingCents),
      euro(ordine.discountCents),
      euro(ordine.totalCents),
      ordine.discountCode,
      ordine.invoiceRequested ? 'sì' : 'no',
      ordine.vatNumber,
      ordine.sdiCode,
      ordine.trackingCarrier,
      ordine.trackingNumber,
      ordine.deliveryNotes,
    ]
      .map(campo)
      .join(';')
  })

  // Il BOM serve a Excel per capire che è UTF-8 e non storpiare gli accenti.
  const contenuto = `﻿${COLONNE.join(';')}\n${righe.join('\n')}\n`
  const oggi = new Date().toISOString().slice(0, 10)

  return new Response(contenuto, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ordini-materia-etrusca-${oggi}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
