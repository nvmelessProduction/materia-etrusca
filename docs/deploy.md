# Messa in produzione

Guida per portare **Materia Etrusca** online. Scritta per essere seguita una volta
sola, in ordine, senza saltare passi.

---

## 1. Il database

Serve un PostgreSQL 15 o superiore. Vanno bene:

- **Neon** (consigliato su Vercel): piano gratuito sufficiente per partire.
- **Supabase**: usa la stringa di connessione **pooled**, non quella diretta.
- Un Postgres tuo su VPS, purché raggiungibile in TLS.

Copia la stringa di connessione in `DATABASE_URL`. Il progetto usa `postgres.js`
con `prepare: false`, quindi funziona anche dietro pgbouncer.

```bash
pnpm db:migrate      # crea le tabelle
pnpm db:seed:prod    # fasce di spedizione e testi delle FAQ, nessun prodotto finto
```

> `pnpm db:seed` (senza `:prod`) inserisce 12 prodotti di esempio e **cancella
> quello che c'è**: usalo solo in locale.

---

## 2. Le variabili d'ambiente

L'elenco completo e commentato sta in [`.env.example`](../.env.example).
Questa è la scaletta di cosa serve davvero, in ordine di urgenza.

### Indispensabili per stare in piedi

| Variabile              | Dove si prende                                |
| ---------------------- | --------------------------------------------- |
| `DATABASE_URL`         | Neon / Supabase / il tuo Postgres             |
| `NEXT_PUBLIC_SITE_URL` | Il dominio definitivo, **senza** slash finale |
| `AUTH_SECRET`          | `openssl rand -base64 32`                     |

### Per vendere davvero

| Variabile                            | Dove si prende                                  |
| ------------------------------------ | ----------------------------------------------- |
| `STRIPE_SECRET_KEY`                  | Stripe → Sviluppatori → Chiavi API              |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | idem, la chiave pubblicabile                    |
| `STRIPE_WEBHOOK_SECRET`              | Stripe → Webhook → l'endpoint creato al punto 4 |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID`       | PayPal Developer → App                          |
| `PAYPAL_CLIENT_SECRET`               | idem                                            |
| `PAYPAL_ENVIRONMENT`                 | `sandbox` finché provi, poi `live`              |
| `PAYPAL_WEBHOOK_ID`                  | PayPal Developer → Webhooks                     |
| `BANK_TRANSFER_IBAN`                 | il tuo IBAN, se accetti bonifici                |

Senza chiavi Stripe il metodo "carta" **non compare** al checkout: il sito resta
funzionante e vende con bonifico. Lo stesso per PayPal.

### Per scrivere ai clienti

| Variabile        | Nota                                                   |
| ---------------- | ------------------------------------------------------ |
| `RESEND_API_KEY` | Resend → API Keys                                      |
| `EMAIL_FROM`     | Un mittente **verificato** su un dominio che controlli |
| `ARTISAN_EMAIL`  | Dove arrivano ordini e richieste di progetto           |
| `ADMIN_EMAILS`   | Chi può entrare in `/admin`, separati da virgola       |

> Senza `RESEND_API_KEY` non si può accedere al pannello: l'accesso è via link
> email. In locale si aggira con `ADMIN_DEV_EMAIL`, che in produzione è inerte.

### Per le foto dei progetti

| Variabile           | Nota                            |
| ------------------- | ------------------------------- |
| `UPLOADTHING_TOKEN` | Uploadthing → il token dell'app |

Senza, il wizard funziona ma le foto non vengono salvate: è la cosa più
importante del sito, configurala.

### Per le operazioni automatiche

| Variabile     | Nota                                            |
| ------------- | ----------------------------------------------- |
| `CRON_SECRET` | `openssl rand -hex 32`. Protegge `/api/cron/*`. |

---

## 3. Vercel

1. **Importa il repository** su Vercel. Il framework viene riconosciuto da sé.
2. **Incolla le variabili** del punto 2 in Settings → Environment Variables,
   per gli ambienti Production e Preview.
3. **Distribuisci.** Il comando di build è quello predefinito (`next build`).
4. **Collega il dominio** e aggiorna `NEXT_PUBLIC_SITE_URL` al dominio vero:
   da quella variabile dipendono i link nelle email, la sitemap e i dati
   strutturati.

Le operazioni pianificate sono già dichiarate in [`vercel.json`](../vercel.json)
e Vercel le attiva da sé:

| Quando            | Cosa fa                                            |
| ----------------- | -------------------------------------------------- |
| ogni giorno 10:00 | promemoria dei carrelli abbandonati (dopo 24 ore)  |
| ogni giorno 10:30 | richieste di recensione (15 giorni dalla consegna) |
| ogni giorno 09:00 | promemoria proposte in scadenza e chiusura scadute |
| lunedì 04:00      | cancellazione delle foto di progetto dopo 12 mesi  |
| lunedì 08:00      | riepilogo vendite della settimana                  |

Vercel manda da sé `Authorization: Bearer $CRON_SECRET`: basta che la variabile
ci sia.

---

## 4. I webhook dei pagamenti

**Stripe** → Sviluppatori → Webhook → Aggiungi endpoint:

- URL: `https://iltuodominio.it/api/webhooks/stripe`
- Eventi: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
- Copia il _signing secret_ in `STRIPE_WEBHOOK_SECRET`.

**PayPal** → Developer → App → Webhooks:

- URL: `https://iltuodominio.it/api/webhooks/paypal`
- Evento: `PAYMENT.CAPTURE.COMPLETED`
- Copia l'ID del webhook in `PAYPAL_WEBHOOK_ID`.

> Il webhook Stripe è il punto in cui si scalano le giacenze. È idempotente per
> id evento e lavora in transazione: se due persone pagano lo stesso pezzo unico
> nello stesso istante, una sola lo prende e l'altra viene rimborsata in
> automatico. Non toccarlo senza rileggere `src/db/queries/ordini.ts`.

---

## 5. Prima di dire che è online

- [ ] `NEXT_PUBLIC_SITE_URL` è il dominio vero, senza slash finale.
- [ ] Un ordine di prova con carta in modalità test arriva a `paid` e manda le due email.
- [ ] Un ordine con bonifico crea un ordine in attesa con gli estremi corretti.
- [ ] Il wizard `/progetto` salva le foto e ti manda la notifica.
- [ ] Entri in `/admin` con la tua email.
- [ ] `https://iltuodominio.it/robots.txt` e `/sitemap.xml` rispondono.
- [ ] I dati fiscali in `src/lib/site.ts` sono quelli veri (adesso ci sono i segnaposto).
- [ ] Le tariffe in `/admin/spedizioni` corrispondono al listino del tuo corriere.
- [ ] Le foto segnaposto del seed sono state sostituite con gli scatti veri.

---

## 6. Se invece vai su Hostinger (o un altro VPS)

Next.js in modalità standalone gira ovunque ci sia Node 20+. Serve però un
processo che resti vivo: l'hosting condiviso PHP non basta, serve un piano VPS.

```bash
# sul server
git clone <repo> && cd materia-etrusca
corepack enable && pnpm install --frozen-lockfile
cp .env.example .env && nano .env        # riempi le variabili
pnpm db:migrate && pnpm db:seed:prod
pnpm build
pnpm start                                # ascolta sulla porta 3000
```

Poi:

- **Tienilo vivo** con `pm2 start "pnpm start" --name materia-etrusca` o un
  servizio systemd.
- **Mettici davanti nginx** che gira la porta 443 sulla 3000, con certificato
  Let's Encrypt.
- **Le operazioni pianificate** su Vercel sono gratis, qui vanno rifatte a mano
  con `crontab`:

  ```cron
  0 10 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://iltuodominio.it/api/cron/carrelli-abbandonati
  30 10 * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://iltuodominio.it/api/cron/richieste-recensione
  0 9 * * *  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://iltuodominio.it/api/cron/promemoria-proposte
  0 4 * * 1  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://iltuodominio.it/api/cron/cancella-foto-progetti
  0 8 * * 1  curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://iltuodominio.it/api/cron/riepilogo-settimanale
  ```

- **L'ottimizzazione delle immagini** di `next/image` su un VPS usa `sharp`:
  `pnpm add sharp` se non viene installato da sé.

Il resto — database, Stripe, Resend, Uploadthing — non cambia: sono servizi
esterni e non sanno dove gira il sito.

---

## 7. Manutenzione

```bash
pnpm verifica        # lint + tipi + test + build: da lanciare prima di ogni deploy
pnpm test:e2e        # i due percorsi critici, contro l'app compilata
pnpm db:generate     # dopo ogni modifica a src/db/schema.ts
pnpm db:migrate      # applica le migration
pnpm email:dev       # anteprima delle email transazionali
```

Le migration stanno in `drizzle/` e vanno **committate**. Non modificare un file
di migration già applicato in produzione: creane uno nuovo.
