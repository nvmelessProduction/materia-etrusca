import 'server-only'
import { UTApi } from 'uploadthing/server'
import { optionalEnv } from '@/lib/env'

/**
 * Le foto dei clienti passano dal server, non dal browser: così il token
 * non esce mai da qui e c'è un solo punto in cui validare tipo e dimensione.
 */

let api: UTApi | null = null

export function uploadConfigurato(): boolean {
  return Boolean(optionalEnv('UPLOADTHING_TOKEN'))
}

function utapi(): UTApi {
  api ??= new UTApi({ token: optionalEnv('UPLOADTHING_TOKEN') })
  return api
}

export type FileCaricato = { url: string; chiave: string }

export const TIPI_IMMAGINE_AMMESSI = ['image/webp', 'image/jpeg', 'image/png', 'image/avif']
/** Le foto arrivano già ridotte dal browser: oltre questa soglia c'è qualcosa che non va. */
export const DIMENSIONE_MASSIMA_BYTE = 8 * 1024 * 1024

export function fileAccettabile(file: File): boolean {
  return (
    TIPI_IMMAGINE_AMMESSI.includes(file.type) &&
    file.size > 0 &&
    file.size <= DIMENSIONE_MASSIMA_BYTE
  )
}

export async function caricaImmagini(file: File[]): Promise<FileCaricato[]> {
  if (file.length === 0) return []
  if (!uploadConfigurato()) {
    throw new Error('UPLOADTHING_TOKEN non impostata: senza archivio non posso conservare le foto.')
  }

  const esiti = await utapi().uploadFiles(file)

  return esiti.flatMap((esito) => {
    if (esito.error || !esito.data) {
      console.error('Caricamento fallito:', esito.error?.message)
      return []
    }
    return [{ url: esito.data.ufsUrl, chiave: esito.data.key }]
  })
}

/** Usata dalla cancellazione automatica delle foto dopo dodici mesi. */
export async function eliminaFile(chiavi: string[]): Promise<void> {
  if (chiavi.length === 0 || !uploadConfigurato()) return
  await utapi().deleteFiles(chiavi)
}
