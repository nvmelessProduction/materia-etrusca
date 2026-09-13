# Materia Etrusca

E-commerce dei vasi-scultura in cemento colato a mano di **Cerveteri**.

La funzione che giustifica un sito su misura invece di uno Shopify è
**«Progetta il tuo angolo»**: il cliente manda la foto del suo spazio, l'artigiano
risponde con una proposta visiva su una pagina privata, e da lì si riempie il
carrello in un clic. Tutto il resto è al servizio di quel flusso.

---

## Partire in locale

Serve **Node 20+**, **pnpm** e un **PostgreSQL** raggiungibile.

```bash
pnpm install
cp .env.example .env.local        # basta valorizzare DATABASE_URL per cominciare
pnpm db:migrate
pnpm db:seed                      # 3 collezioni, 12 prodotti, 2 richieste di progetto
pnpm dev
```

Il sito risponde su <http://localhost:3000>.

Per entrare nel pannello senza configurare l'invio email, in `.env.local`:

```bash
ADMIN_DEV_EMAIL="tu@example.com"   # vale solo in sviluppo, in produzione è inerte
```

---

## Comandi

| Comando             | Cosa fa                                       |
| ------------------- | --------------------------------------------- |
| `pnpm dev`          | sviluppo                                      |
| `pnpm build`        | build di produzione                           |
| `pnpm verifica`     | lint + tipi + test + build, tutto in fila     |
| `pnpm test`         | test unitari (Vitest)                         |
| `pnpm test:e2e`     | i due percorsi critici (Playwright)           |
| `pnpm db:generate`  | genera le migration dallo schema              |
| `pnpm db:migrate`   | applica le migration                          |
| `pnpm db:seed`      | dati di esempio — **cancella quello che c'è** |
| `pnpm db:seed:prod` | solo spedizioni e FAQ, senza prodotti finti   |
| `pnpm email:dev`    | anteprima delle email transazionali           |

I test unitari che toccano il database si saltano da soli se `DATABASE_URL` non
è impostata, così `pnpm test` gira ovunque.

---

## Com'è fatto

| Ambito     | Scelta                                                    |
| ---------- | --------------------------------------------------------- |
| Framework  | Next.js 15, App Router, Server Components di default      |
| Linguaggio | TypeScript strict — zero `any`, zero `@ts-ignore`         |
| Stile      | Tailwind CSS v4 con i token del progetto + base shadcn/ui |
| Database   | PostgreSQL + Drizzle ORM                                  |
| Auth       | Auth.js, link via email — **l'account è facoltativo**     |
| Pagamenti  | Stripe Checkout, PayPal, bonifico                         |
| Email      | Resend + React Email                                      |
| Upload     | Uploadthing                                               |
| Test       | Vitest + Playwright                                       |
| i18n       | next-intl — `it` attivo, `en` predisposto                 |

```
src/
  app/
    (negozio)/    vetrina pubblica
    admin/        backoffice, protetto da ruolo
    api/          webhook, cron, feed
  components/     ui/ (base), layout/, e componenti di dominio
  db/             schema, query tipizzate, seed
  emails/         template React Email
  lib/            dominio (prezzi, disponibilità), spedizioni, carrello, validazioni
```

Le convenzioni, i design token e le regole visive stanno in
[`CLAUDE.md`](./CLAUDE.md). Le istruzioni di messa in produzione in
[`docs/deploy.md`](./docs/deploy.md).

---

## Le tre cose da sapere prima di metterci mano

1. **I prezzi sono interi in centesimi, sempre.** Mai float, mai euro in un
   `number`. I pesi sono `numeric` di Postgres, convertiti in un punto solo
   (`src/db/queries/mappatori.ts`).

2. **Un pezzo unico non può essere venduto due volte.** Le giacenze si scalano
   dentro la stessa transazione che segna l'ordine pagato, bloccando le righe
   delle varianti con `for update`. Il webhook Stripe è idempotente per id
   evento. C'è un test di integrazione che prova esattamente questo
   (`src/db/queries/ordini.integrazione.test.ts`): se lo tocchi, deve restare
   verde.

3. **La spedizione si calcola prima del carrello.** Su pezzi che pesano
   quaranta chili, scoprire il costo al momento di pagare è la prima causa di
   abbandono. Sopra i 70 kg il sito smette di fare prezzo e passa a preventivo.

---

## Cosa manca prima di andare online

Il codice è completo; questi sono dati che solo il cliente può dare:

- [ ] **Le foto vere.** Adesso ci sono segnaposto. Su un prodotto artigianale
      valgono più di qualsiasi funzionalità.
- [ ] **I dati fiscali** in `src/lib/site.ts`: ragione sociale, partita IVA, REA,
      indirizzo, telefono, coordinate del laboratorio.
- [ ] **Il listino vero del corriere**, da inserire in `/admin/spedizioni`.
- [ ] Le chiavi dei servizi esterni: vedi [`docs/deploy.md`](./docs/deploy.md).
