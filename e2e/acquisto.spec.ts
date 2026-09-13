import { expect, test } from '@playwright/test'

/**
 * Percorso d'acquisto completo, dal catalogo all'ordine confermato.
 * Si paga con bonifico: è l'unico metodo che non manda il test fuori dal
 * sito, e passa comunque da tutta la logica di prezzi e spedizione.
 */
test('compro un vaso e arrivo alla conferma dell’ordine', async ({ page }) => {
  await page.goto('/collezioni')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page
    .getByRole('link', { name: /guarda i pezzi/i })
    .first()
    .click()
  await expect(page).toHaveURL(/\/collezioni\//)

  // Dalla griglia alla scheda del primo pezzo.
  const primaCard = page.locator('article a[href^="/prodotti/"]').first()
  await primaCard.click()
  await expect(page).toHaveURL(/\/prodotti\//)

  // Peso e misure devono essere leggibili senza aprire nulla: stanno in una
  // lista di definizioni sopra la piega, non dentro un accordion.
  const misure = page.locator('dl').first()
  await expect(misure.getByText('Altezza', { exact: true })).toBeVisible()
  await expect(misure.getByText('Diametro', { exact: true })).toBeVisible()
  await expect(misure.getByText('Peso', { exact: true })).toBeVisible()
  await expect(page.getByText(/le piccole variazioni sono la firma/i)).toBeVisible()

  // Stima della spedizione prima del carrello.
  await page.getByLabel('Il tuo CAP').first().fill('00195')
  await page.getByRole('button', { name: 'Calcola' }).first().click()
  await expect(page.getByText(/Corriere, consegna al piano strada/i)).toBeVisible()

  await page
    .getByRole('button', { name: /aggiungi al carrello/i })
    .first()
    .click()
  // L'aggiunta passa da una azione del server: si aspetta la conferma.
  await expect(page.getByText(/è nel carrello/i)).toBeVisible()

  await page.goto('/carrello')
  await expect(page.getByRole('heading', { name: 'Carrello' })).toBeVisible()
  await expect(page.getByText(/Peso totale con imballo/i)).toBeVisible()

  await page.getByRole('link', { name: /vai al pagamento/i }).click()
  await expect(page).toHaveURL(/\/checkout/)

  const modulo = page.locator('main form').first()
  // `exact` ovunque: senza, "Email" pesca anche la descrizione del bonifico,
  // che la parola ce l'ha dentro.
  await modulo.getByLabel('Email', { exact: true }).fill('prova.acquisto@example.com')
  await modulo.getByLabel('Nome e cognome', { exact: true }).fill('Giulia Ferrante')
  await modulo.getByLabel('Telefono', { exact: true }).fill('+39 333 1122334')
  await modulo.getByLabel('Indirizzo', { exact: true }).fill('Via del Tufo 14')
  await modulo.getByLabel('Città', { exact: true }).fill('Roma')
  await modulo.getByLabel('CAP', { exact: true }).fill('00195')
  await modulo.getByLabel('Provincia', { exact: true }).fill('RM')

  // Le opzioni di spedizione compaiono da sole appena il CAP è completo.
  await expect(page.getByText(/Corriere, consegna al piano strada/i)).toBeVisible()

  await modulo.getByRole('radio', { name: /bonifico/i }).check()
  await modulo.getByRole('checkbox', { name: /ho letto i termini/i }).check()

  await modulo.getByRole('button', { name: /conferma l’ordine/i }).click()

  await expect(page).toHaveURL(/\/ordine\//, { timeout: 30_000 })
  await expect(page.getByRole('heading', { name: /ho messo il pezzo da parte/i })).toBeVisible()
  await expect(page.getByText(/ME-\d{4}-\d{5}/)).toBeVisible()
  await expect(page.getByText(/Estremi per il bonifico/i)).toBeVisible()
})

test('un pezzo unico non si può prendere due volte', async ({ page }) => {
  await page.goto('/prodotti/stele')
  await expect(page.getByText(/esiste solo questo/i)).toBeVisible()

  await page
    .getByRole('button', { name: /aggiungi al carrello/i })
    .first()
    .click()
  await expect(page.getByText(/è nel carrello/i)).toBeVisible()

  await page.goto('/carrello')
  // Il più è disattivato: di quel pezzo ce n'è uno solo.
  await expect(page.getByRole('button', { name: 'Aggiungine uno' })).toBeDisabled()
})
