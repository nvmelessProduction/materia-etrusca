import { defineConfig, devices } from '@playwright/test'

const PORTA = Number(process.env.PORTA_E2E ?? 3210)
const BASE = `http://127.0.0.1:${PORTA}`

/**
 * Ambienti che hanno già un Chromium installato altrove (container CI,
 * immagini preconfezionate) lo indicano qui, invece di riscaricarlo.
 */
const eseguibile = process.env.PLAYWRIGHT_CHROMIUM_PATH
const avvio = eseguibile ? { launchOptions: { executablePath: eseguibile } } : {}

/**
 * Due percorsi, quelli che devono funzionare sempre: comprare un pezzo e
 * mandare una richiesta di progetto. Girano contro l'applicazione compilata,
 * con un database vero: è l'unico modo di provare davvero un checkout.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: BASE,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    locale: 'it-IT',
    timezoneId: 'Europe/Rome',
  },

  projects: [
    // Mobile prima: è così che il sito viene guardato per davvero.
    // Si emula il telefono dentro Chromium: serve un motore solo.
    {
      name: 'telefono',
      use: { ...devices['iPhone 13'], browserName: 'chromium', ...avvio },
    },
    { name: 'desktop', use: { ...devices['Desktop Chrome'], ...avvio } },
  ],

  webServer: {
    command: `pnpm build && PORT=${PORTA} pnpm start`,
    url: BASE,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
})
