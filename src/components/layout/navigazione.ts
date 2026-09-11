export type VoceMenu = {
  href: string
  etichetta: string
  descrizione?: string
}

export const vociPrincipali: readonly VoceMenu[] = [
  { href: '/collezioni', etichetta: 'Collezioni' },
  { href: '/progetto', etichetta: 'Progetta il tuo angolo' },
  { href: '/su-misura', etichetta: 'Su misura' },
  { href: '/storia', etichetta: 'Storia' },
  { href: '/contatti', etichetta: 'Contatti' },
]

export const vociAssistenza: readonly VoceMenu[] = [
  { href: '/spedizioni-e-resi', etichetta: 'Spedizioni e resi' },
  { href: '/cura-del-cemento', etichetta: 'Cura del cemento' },
  { href: '/faq', etichetta: 'Domande frequenti' },
  { href: '/contatti', etichetta: 'Scrivimi' },
]

export const vociLegali: readonly VoceMenu[] = [
  { href: '/termini', etichetta: 'Termini e condizioni' },
  { href: '/privacy', etichetta: 'Privacy' },
  { href: '/cookie', etichetta: 'Cookie' },
]
