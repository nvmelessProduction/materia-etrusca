import { expect, test } from '@playwright/test'

/**
 * «Progetta il tuo angolo»: il flusso che giustifica questo sito.
 * Deve chiudersi in pochi passi, senza registrazione e senza captcha.
 */
test('mando una richiesta di progetto senza registrarmi', async ({ page }) => {
  await page.goto('/progetto')
  await expect(page.getByRole('heading', { level: 1 })).toContainText(/mandami la foto/i)

  // Passo 1: le foto sono facoltative, si può proseguire senza.
  await expect(page.getByText(/come scattarle/i)).toBeVisible()
  await page.getByRole('button', { name: /vado avanti senza foto/i }).click()

  // Passo 2: nessun menu a tendina, si sceglie con le miniature.
  await page.getByRole('button', { name: /^Terrazzo/ }).click()
  await page.getByLabel('Larghezza (m)').fill('4')
  await page.getByLabel('Profondità (m)').fill('2')
  await page.getByRole('button', { name: /pieno sole/i }).click()
  await page.getByRole('button', { name: /mediterraneo/i }).click()
  await page.getByRole('button', { name: '500 – 1.000 €' }).click()
  await page
    .getByLabel(/qualcos’altro che dovrei sapere/i)
    .fill('Terrazzo all’ultimo piano, molto ventoso. Non ho ascensore.')
  await page.getByRole('button', { name: 'Avanti' }).click()

  // Passo 3: contatti e consensi separati. Si resta dentro il contenuto:
  // nel piede c'è un altro campo email, quello della newsletter.
  const wizard = page.locator('main')
  await wizard.getByLabel('Come ti chiami').fill('Giulia Ferrante')
  await wizard.getByLabel('Email', { exact: true }).fill(`progetto.${Date.now()}@example.com`)
  await wizard.getByLabel('CAP', { exact: true }).fill('00195')
  await wizard.getByText(/Acconsento al trattamento/).click()

  await wizard.getByRole('button', { name: /manda la richiesta/i }).click()

  await expect(page.getByRole('heading', { name: /è arrivato tutto/i })).toBeVisible({
    timeout: 30_000,
  })
  await expect(page.getByText(/entro tre giorni/i).first()).toBeVisible()
})

test('la pagina della proposta mostra prima e dopo e ricalcola il totale', async ({ page }) => {
  // Token della proposta di esempio creata dal seed.
  await page.goto('/progetto/11111111-2222-4333-8444-555555555555')

  await expect(page.getByRole('heading', { level: 1 })).toContainText(/ecco cosa ci metterei/i)
  await expect(page.locator('figcaption', { hasText: 'Com’è adesso' })).toBeVisible()
  await expect(page.locator('figcaption', { hasText: 'Come verrebbe' })).toBeVisible()
  await expect(page.getByText(/perché proprio questi/i)).toBeVisible()

  const totale = page.locator('p.text-3xl').first()
  const iniziale = (await totale.textContent())?.trim()

  // Togliendo un pezzo il totale deve scendere.
  await page.getByRole('checkbox').first().click()
  await expect(totale).not.toHaveText(iniziale ?? '')

  // E rimettendolo torna com'era.
  await page.getByRole('checkbox').first().click()
  await expect(totale).toHaveText(iniziale ?? '')
})
