/**
 * Il consenso ai cookie, gestito con un cookie di prima parte leggibile dal
 * client. Non è un dato sensibile: è la memoria di una scelta.
 */
export const COOKIE_CONSENSO = 'me_consenso'
export const DURATA_CONSENSO_GIORNI = 180

export type Consenso = 'necessari' | 'tutti'

export function leggiConsenso(): Consenso | null {
  if (typeof document === 'undefined') return null

  const voce = document.cookie
    .split(';')
    .map((parte) => parte.trim())
    .find((parte) => parte.startsWith(`${COOKIE_CONSENSO}=`))

  const valore = voce?.split('=')[1]
  return valore === 'tutti' || valore === 'necessari' ? valore : null
}

export function scriviConsenso(consenso: Consenso): void {
  if (typeof document === 'undefined') return

  const scadenza = new Date(Date.now() + DURATA_CONSENSO_GIORNI * 24 * 60 * 60 * 1000)
  document.cookie = `${COOKIE_CONSENSO}=${consenso}; path=/; expires=${scadenza.toUTCString()}; SameSite=Lax${
    window.location.protocol === 'https:' ? '; Secure' : ''
  }`

  // Chi ascolta (il banner, la pagina delle preferenze, gli script) si aggiorna da sé.
  window.dispatchEvent(new CustomEvent('materia-etrusca:consenso', { detail: consenso }))
}
