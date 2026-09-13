/**
 * Riduzione delle foto **nel browser**, prima di partire.
 * Una foto da telefono pesa 4–8 MB: su una connessione mobile in cortile
 * significa aspettare mezzo minuto e spesso non arrivare in fondo. Ridotta a
 * 2000px in WebP ne pesa qualche centinaio di kilobyte e si vede uguale.
 */

export const LATO_MASSIMO = 2000
export const QUALITA = 0.82

export type EsitoRidimensionamento = {
  file: File
  anteprima: string
  originaleByte: number
}

function nomeWebp(nome: string): string {
  return `${nome.replace(/\.[^.]+$/, '') || 'foto'}.webp`
}

async function disegna(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file)
  const scala = Math.min(1, LATO_MASSIMO / Math.max(bitmap.width, bitmap.height))

  const tela = document.createElement('canvas')
  tela.width = Math.round(bitmap.width * scala)
  tela.height = Math.round(bitmap.height * scala)

  const contesto = tela.getContext('2d')
  if (!contesto) throw new Error('Il browser non sa disegnare su tela.')

  contesto.imageSmoothingQuality = 'high'
  contesto.drawImage(bitmap, 0, 0, tela.width, tela.height)
  bitmap.close()

  return tela
}

export async function ridimensiona(file: File): Promise<EsitoRidimensionamento> {
  // Se qualcosa non va — formato strano, tela bloccata — si manda l'originale:
  // meglio una foto pesante che nessuna foto.
  try {
    const tela = await disegna(file)
    const blob = await new Promise<Blob | null>((risolvi) =>
      tela.toBlob(risolvi, 'image/webp', QUALITA),
    )

    if (!blob) throw new Error('Conversione non riuscita.')

    const ridotto = new File([blob], nomeWebp(file.name), { type: 'image/webp' })
    return {
      file: ridotto,
      anteprima: URL.createObjectURL(ridotto),
      originaleByte: file.size,
    }
  } catch {
    return { file, anteprima: URL.createObjectURL(file), originaleByte: file.size }
  }
}

export function eImmagine(file: File): boolean {
  return file.type.startsWith('image/')
}
