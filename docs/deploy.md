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

### Senza un computer sottomano

Le stesse due cose si fanno dal browser, anche dal telefono:

1. Su Vercel aggiungi la variabile `SETUP_SECRET` con un valore lungo a piacere.
2. Rilancia il deploy.
3. Apri `https://iltuodominio.it/api/installa?chiave=IL_VALORE_CHE_HAI_SCELTO`.

Crea le tabelle e inserisce i dati minimi. Si può riaprire quante volte vuoi:
le migration già applicate vengono saltate, i dati già presenti non vengono
toccati, e non cancella mai niente.

**Finita l'installazione togli `SETUP_SECRET` da Vercel**, così la pagina si
spegne: la chiave viaggia nell'indirizzo, e gli indirizzi finiscono nei log.

> `pnpm db:seed` (senza `:prod`) inserisce 12 prodotti di esempio e **cancella
> quello che c'è**: usalo solo in locale.

### Una copia da far vedere, piena di roba

Per mostrare il sito a qualcuno prima che esistano i pezzi veri, allo stesso
indirizzo si aggiunge `&esempi=sostituisci`:

```
https://il-progetto.vercel.app/api/installa?chiave=LA_CHIAVE&esempi=sostituisci
```

Inserisce 3 collezioni, 12 prodotti, recensioni, codici sconto e richieste di
progetto già avviate: il sito si naviga intero, dal catalogo fino al carrello.

**Cancella tutto quello che trova.** Va su una copia dimostrativa e mai sul
sito che vende — per questo la parola va scritta per esteso e non basta un `1`.
Quando si parte davvero si rifà l'installazione senza quel pezzo, e i prodotti
si inseriscono dal pannello.

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

## 6. Se invece vai su un VPS

Su una macchina tua conviene metterci **tutto**: sito, database e nginx sulla
stessa macchina. PostgreSQL resta in ascolto solo su `localhost`, quindi non
c'è una porta di database esposta a internet da difendere, e non c'è latenza
fra sito e dati. Una bolletta sola, nessun limite di piano gratuito.

Serve un VPS con **Ubuntu o Debian** e accesso root via SSH. Per questo sito
bastano 1–2 vCPU e 2–4 GB di RAM; qualunque taglio superiore è margine.

### Installazione, in un comando

Punta il dominio al server (un record `A` verso l'IP del VPS, e uno per
`www`), aspetta che si propaghi, poi da root:

```bash
curl -fsSL https://raw.githubusercontent.com/nvmelessProduction/materia-etrusca/main/scripts/installa-vps.sh -o installa.sh
bash installa.sh --dominio materiaetrusca.it --email tu@example.com
```

Fa tutto: pacchetti, Node 22, pnpm, PostgreSQL con utente e database
dedicati, clone del codice, variabili d'ambiente con i segreti generati,
migration, dati minimi, compilazione, servizio di sistema, nginx, certificato
Let's Encrypt, firewall e operazioni pianificate.

Si può **rilanciare**: quello che è già a posto viene saltato, i valori che hai
compilato a mano nel file `.env` non vengono azzerati.

Se il dominio non punta ancora al server, aggiungi `--senza-tls` per provare in
HTTP e chiedere il certificato dopo:

```bash
certbot --nginx -d materiaetrusca.it -d www.materiaetrusca.it
```

### Se il dominio non ce l'hai ancora

Si può installare subito usando l'indirizzo IP del VPS al posto del dominio:

```bash
bash installa.sh --dominio 203.0.113.45
```

Con un IP nudo lo script va da solo in HTTP: nessuna autorità di
certificazione emette un certificato per un indirizzo IP. Il sito si guarda e
si riempie di prodotti, ma **non si vende**: senza HTTPS i pagamenti con carta
non funzionano e il browser segnala il sito come non sicuro.

Quando il dominio arriva, si punta un record `A` all'IP del VPS (e uno per
`www`) e si rilancia lo stesso script con il dominio vero:

```bash
bash installa.sh --dominio materiaetrusca.it --email tu@example.com
```

Riscrive `NEXT_PUBLIC_SITE_URL`, la configurazione di nginx e le operazioni
pianificate, e chiede il certificato. Non si perde niente: i dati restano
dove sono.

### Dopo l'installazione

Le chiavi dei servizi esterni si mettono a mano:

```bash
nano /srv/materia-etrusca/.env
systemctl restart materia-etrusca
```

Le più urgenti sono `RESEND_API_KEY`, `EMAIL_FROM` e `ADMIN_EMAILS`: senza
quelle non si entra nemmeno in `/admin`, perché l'accesso è via link email.

### Comandi di tutti i giorni

```bash
systemctl status materia-etrusca      # come sta
journalctl -u materia-etrusca -f      # cosa sta facendo, in diretta
bash /srv/materia-etrusca/scripts/aggiorna-vps.sh   # pubblica gli aggiornamenti
```

`aggiorna-vps.sh` prende il codice nuovo, applica le migration, ricompila e
riavvia. Se la compilazione fallisce **il sito resta in piedi** con la versione
precedente: il riavvio avviene solo a build riuscita.

### I backup non li fa nessuno al posto tuo

È la differenza vera rispetto a un servizio gestito. Il minimo sindacale:

```bash
cat > /etc/cron.daily/backup-materia <<'EOF'
#!/bin/sh
mkdir -p /var/backups/materia
su postgres -c "pg_dump materia_etrusca" | gzip > \
  "/var/backups/materia/$(date +%F).sql.gz"
find /var/backups/materia -name '*.sql.gz' -mtime +30 -delete
EOF
chmod +x /etc/cron.daily/backup-materia
```

Copia una volta alla settimana quella cartella **fuori dal server**, o il
giorno che il disco muore i backup muoiono con lui. Se il tuo fornitore offre
gli snapshot, tienili accesi: costano poco e salvano la giornata.

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
