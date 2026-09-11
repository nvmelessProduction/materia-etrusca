/**
 * I dati strutturati sono JSON puro: si serializzano una volta sola e si
 * inseriscono come script. Niente `dangerouslySetInnerHTML` sparso in giro.
 */
export function DatiStrutturati({ dati }: { dati: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Il contenuto è costruito da noi a partire dal database, non da input utente.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(dati).replace(/</g, '\\u003c'),
      }}
    />
  )
}
