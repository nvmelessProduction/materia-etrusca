# Materia Etrusca — memoria di progetto

E-commerce su misura per un artigiano di **Cerveteri** che produce vasi-scultura in
**cemento colato a mano**, ispirati alle forme etrusche.

La funzione che giustifica questo sito invece di uno Shopify è **«Progetta il tuo angolo»**:
il cliente manda la foto del suo spazio, l'artigiano risponde con una proposta visiva su
una pagina privata, e da lì si riempie il carrello in un clic. Tutto il resto è al servizio
di quel flusso.

## Stack

| Ambito      | Scelta                                                        |
| ----------- | ------------------------------------------------------------- |
| Framework   | Next.js 15, App Router, Server Components di default          |
| Linguaggio  | TypeScript strict — zero `any`, zero `@ts-ignore`             |
| Stile       | Tailwind CSS v4 (token in `src/app/globals.css`) + shadcn/ui  |
| Database    | PostgreSQL + Drizzle ORM (`drizzle-kit` per le migration)     |
| Auth        | Auth.js, magic link via email — **l'account è facoltativo**   |
| Pagamenti   | Stripe Checkout (carte, Apple/Google Pay), PayPal, bonifico   |
| Email       | Resend + React Email (`src/emails/`)                          |
| Upload      | Uploadthing                                                   |
| Validazione | Zod ovunque (client **e** server), react-hook-form nei moduli |
| Test        | Vitest (unità) + Playwright (end-to-end)                      |
| i18n        | next-intl — solo `it` attivo, `en` predisposto                |

## Comandi

```bash
pnpm dev              # sviluppo
pnpm build            # build di produzione
pnpm lint             # ESLint
pnpm typecheck        # tsc --noEmit
pnpm test             # Vitest
pnpm test:e2e         # Playwright
pnpm db:generate      # genera le migration dallo schema
pnpm db:migrate       # applica le migration
pnpm db:seed          # popola il database di esempio
pnpm email:dev        # anteprima delle email transazionali
```

## Design token

Sono variabili CSS in `src/app/globals.css`, esposte come classi Tailwind.
**Nessun colore va scritto a mano nei componenti.**

| Token          | Valore    | Uso                                   |
| -------------- | --------- | ------------------------------------- |
| `--calce`      | `#F7F4EE` | sfondo pagina (`bg-calce`)            |
| `--tufo`       | `#E8E1D5` | superfici secondarie (`bg-tufo`)      |
| `--cemento`    | `#C4B9A5` | bordi, stati disabilitati             |
| `--terracotta` | `#8C4A2F` | colore d'azione — **un solo accento** |
| `--oliva`      | `#6B7355` | conferme, stati positivi              |
| `--antracite`  | `#2B2825` | testo, sezioni scure                  |

Alias semantici disponibili: `bg-sfondo`, `bg-superficie`, `border-bordo`, `text-testo`,
`text-testo-tenue`, `bg-azione`, `text-positivo`, `text-errore`.

**Tipografia:** `font-display` = Cormorant Garamond (titoli), `font-sans` = Inter (interfaccia).

## Regole visive non negoziabili

- `border-radius: 0` **ovunque**. Il cemento non ha angoli morbidi (è forzato nel reset di base).
- Molto whitespace, immagini grandi, poche parole.
- **Un solo pulsante primario per schermata** (`variant="primario"`). Gli altri sono
  `secondario`, `tenue`, `scuro`, `fantasma`, `collegamento`.
- Nessuna ombra colorata, nessun gradiente sgargiante, **nessuna emoji nell'interfaccia**.
- Transizioni lente: 300–500ms, mai lampeggianti.
- Mobile-first: si progetta a 375px, poi si adatta. Testo mai sotto 16px su mobile.
- Un solo `<h1>` per pagina, focus sempre visibile, contrasto WCAG AA.

## Tono di voce

Prima persona, artigianale, asciutto. L'artigiano parla, non il marketing.

> «Ogni pezzo è colato e rifinito a mano: le piccole variazioni sono la firma, non un difetto.»

Niente superlativi, niente punti esclamativi, niente "scopri di più".

## Convenzioni di codice

- **I prezzi sono sempre interi in centesimi.** Mai float, mai `number` in euro.
  I pesi sono in kg come `numeric` di Postgres, letti come stringa e convertiti dal livello dati.
- Nomi di dominio in italiano (`carrello`, `spedizione`, `richiesta`), API di libreria in inglese.
- **Nessuna query nei componenti**: tutto passa da `src/db/queries/*`, tipizzato.
- Ogni funzione di dominio (prezzi, spedizioni, stock) ha i suoi test unitari accanto
  (`*.test.ts`).
- Validazione Zod condivisa fra client e server in `src/lib/validazioni/`.
- Le rotte che leggono il database sono dinamiche: la build non deve mai richiedere un
  database raggiungibile.
- Un commit per feature, in conventional commits.

## Struttura

```
src/
  app/              rotte (App Router)
    (negozio)/      vetrina pubblica
    admin/          backoffice, protetto da ruolo
    api/            webhook e endpoint
  components/
    ui/             base shadcn/ui adattata ai token
    layout/         intestazione, piede, navigazione
    …               componenti di dominio
  db/
    schema.ts       tabelle Drizzle
    queries/        query helper tipizzate
    seed.ts         dati di esempio
  emails/           template React Email
  lib/
    carrello/       stato e regole del carrello
    spedizioni/     motore di calcolo, con test
    validazioni/    schemi Zod condivisi
  i18n/             configurazione next-intl
messages/           it.json (attivo), en.json (predisposto)
```

## Cose da non dimenticare

- **Il peso e le misure vanno visibili senza aprire nulla**: sono la prima domanda dei clienti.
- La **stima di spedizione va fatta prima del carrello**: su pezzi pesanti la sorpresa al
  checkout è la prima causa di abbandono.
- Sopra i **70 kg** non si fa prezzo automatico: si passa a preventivo su richiesta.
- Un **pezzo unico non può essere venduto due volte**: lo stock si decrementa in transazione,
  dentro il webhook, che deve essere idempotente.
- Le foto dei progetti si cancellano automaticamente dopo **12 mesi**.
- Il backoffice lo usa un artigiano dal telefono, non un operatore e-commerce.
