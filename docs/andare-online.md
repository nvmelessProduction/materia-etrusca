# Andare online, dall'inizio alla fine

Guida completa per portare **Materia Etrusca** da «demo su Vercel» a «negozio
vero che incassa». Scritta per chi non ha mai amministrato un server: non serve
capire, serve seguire l'ordine.

Tempo reale: **un pomeriggio** per la parte tecnica, più i giorni di attesa per
il dominio e per le verifiche di Stripe.

## L'ordine conta

Alcune cose dipendono da altre. Questo è l'ordine giusto, e saltare un passo
significa tornare indietro:

```
1. dominio          →  serve per tutto il resto
2. server           →  può andare in parallelo al dominio
3. dominio → server →  si aspetta la propagazione
4. installazione    →  qui nasce il sito con HTTPS
5. email            →  serve per entrare nel pannello
6. pagamenti        →  serve per incassare
7. contenuti        →  i pezzi veri, le foto vere
8. pagine legali    →  obbligatorie per vendere
9. controlli        →  prima di dirlo a qualcuno
```

---

## 1. Il dominio

### Dove comprarlo

Un registrar qualunque: Namecheap, Porkbun, OVH, Aruba, Register.it. Per un
`.it` si spendono **10–20 euro all'anno**.

Non comprarlo da Contabo insieme al server: non è il loro mestiere e non
guadagni niente in comodità.

### Cosa scegliere

Un `.it` se il negozio vende in Italia. Corto, che si scriva come si pronuncia,
senza trattini: un cliente se lo deve poter ripetere al telefono.

### A nome di chi

**Del proprietario del negozio**, con la sua email e la sua partita IVA. Non a
nome di chi costruisce il sito. Un dominio intestato alla persona sbagliata è
una rogna che salta fuori due anni dopo, sempre nel momento peggiore.

### Segnati questo

Dopo l'acquisto ti serve l'accesso al **pannello DNS** del registrar. Ci
tornerai due volte: adesso per puntare il dominio al server, e più avanti per
far verificare il dominio a Resend.

---

## 2. Il server

### Quale prendere

Su Contabo, il taglio più piccolo basta e avanza per un negozio. Se sulla
stessa macchina ci gireranno anche altri siti, sali di un gradino: la RAM
serve quando si ricompila un sito mentre gli altri stanno rispondendo.

Una cosa da guardare al momento dell'ordine: il prezzo in vetrina è **IVA
esclusa**, e spesso c'è un **costo di attivazione una tantum**. Il totale vero
lo vedi solo al carrello.

### Come ordinarlo

- **Sistema operativo: Ubuntu 24.04.** Non Windows: lo script di installazione
  parla Linux e su Windows non gira.
- Niente pannelli di controllo aggiuntivi (cPanel, Plesk): non servono e
  intralciano.

Quando è pronto ti arriva un'email con **l'indirizzo IP** e **la password di
root**.

### Primo accesso

Dal Terminale di Windows (tasto Windows → scrivi `terminale`):

```bash
ssh root@IL_TUO_IP
```

La prima volta chiede se ti fidi: rispondi `yes`. Poi la password — **mentre la
digiti non compare niente**, è normale.

Appena dentro, cambia la password, perché quella è girata in chiaro per email:

```bash
passwd
```

---

## 3. Puntare il dominio al server

Nel pannello DNS del registrar, due righe:

| Tipo | Nome  | Valore          | TTL        |
| ---- | ----- | --------------- | ---------- |
| A    | `@`   | l'IP del server | automatico |
| A    | `www` | l'IP del server | automatico |

Poi si aspetta. Di solito sono minuti, a volte qualche ora.

**Come sai che è pronto:** dal terminale del server,

```bash
ping -c 2 iltuodominio.it
```

Se risponde con l'IP del tuo server, puoi andare avanti. Se risponde con un
altro IP o non risponde, aspetta ancora.

> Non installare prima che il dominio punti qui: il certificato HTTPS si ottiene
> solo se Let's Encrypt riesce a raggiungere il dominio sul tuo server.

---

## 4. L'installazione

Due righe, da root:

```bash
curl -fsSL https://raw.githubusercontent.com/nvmelessProduction/materia-etrusca/main/scripts/installa-vps.sh -o installa.sh
bash installa.sh --dominio iltuodominio.it --email tua@email.it
```

L'email serve a Let's Encrypt per avvisarti se il certificato sta per scadere.

Ci mette una decina di minuti e fa tutto: pacchetti di sistema, Node, pnpm,
PostgreSQL con utente e database dedicati, il codice, le chiavi generate a
caso, le tabelle, i dati minimi, la compilazione, il servizio di sistema,
nginx, il certificato HTTPS, il firewall e le operazioni pianificate.

**Si può rilanciare** quante volte vuoi: salta quello che è già a posto e non
azzera i valori che hai scritto a mano.

Alla fine stampa l'indirizzo del sito e la lista di quello che manca.

---

## 5. Le email

Senza questo non entri nemmeno nel pannello, perché l'accesso è via link email.

### Account

Su **resend.com**, gratuito fino a 3.000 email al mese.

### Verifica il dominio

_Domains_ → _Add Domain_ → scrivi il tuo dominio. Ti dà **tre o quattro record
DNS** da copiare nel pannello del registrar (sono di tipo `TXT` e `MX`).
Copiali, aspetta qualche minuto, poi torna su Resend e premi _Verify_.

Finché il dominio non è verificato, Resend manda **solo al tuo indirizzo**. È
il motivo per cui in demo il cliente non riceve niente.

### Chiave

_API Keys_ → _Create API Key_ → copia il valore, comincia con `re_`.

### Scrivila nel server

```bash
nano /srv/materia-etrusca/.env
```

Nell'editor: frecce per muoversi, **Ctrl+O** e Invio per salvare, **Ctrl+X**
per uscire.

| Riga             | Cosa ci va                                                    |
| ---------------- | ------------------------------------------------------------- |
| `RESEND_API_KEY` | la chiave `re_...`                                            |
| `EMAIL_FROM`     | `Materia Etrusca <ciao@iltuodominio.it>`                      |
| `ADMIN_EMAILS`   | le email che possono entrare in `/admin`, separate da virgola |
| `ARTISAN_EMAIL`  | dove arrivano gli avvisi delle richieste dei clienti          |

Poi:

```bash
systemctl restart materia-etrusca
```

### Prova

Vai su `https://iltuodominio.it/accedi`, metti la tua email, e controlla che il
link arrivi. Se non arriva, guarda nello spam; se non c'è nemmeno lì, su Resend
la sezione _Emails_ dice cosa è successo a ogni messaggio.

---

## 6. I pagamenti

### Solo bonifico: una configurazione legittima

Non sei obbligato a collegare Stripe. **Se non metti nessuna chiave, il
checkout mostra solo il bonifico e lo seleziona da sé** — nessun pulsante
rotto, nessuna voce a vuoto.

È la scelta a commissione zero, e su pezzi da qualche centinaio di euro la
differenza non è trascurabile. In cambio ti prendi un lavoro manuale e un
rischio, e devono essere chiari a chi gestisce il negozio:

1. Il cliente ordina e riceve per email l'IBAN e il numero d'ordine
2. Fa il bonifico, che arriva in uno o due giorni lavorativi
3. L'artigiano lo vede sul conto ed entra in `/admin/ordini`
4. Sull'ordine c'è **«Bonifico non ancora incassato»**: preme il pulsante
5. **Solo allora** la giacenza si scala e parte la conferma al cliente

Il punto delicato è il passo 5: **finché il bonifico non è segnato, il pezzo
resta comprabile da chiunque altro.** Su un pezzo unico vuol dire che due
persone possono ordinarlo e solo la prima pagata se lo porta a casa. Il sito
non combina guai — quando segni il secondo bonifico ti avvisa che la giacenza
non c'è più e non fa niente — ma la telefonata di scuse la fa l'artigiano.

Chi vende pezzi unici dovrebbe quindi **controllare il conto ogni giorno**, e
mettere nelle condizioni di vendita che la disponibilità è garantita
dall'incasso, non dall'ordine.

Le chiavi da riempire sono tre, e sono più in basso in questa stessa sezione.

Stripe si può aggiungere in qualsiasi momento: si mettono le chiavi, si
riavvia, e il metodo compare da solo nel checkout. Non serve rifare niente.

### Stripe — carte, Apple Pay, Google Pay

Su **stripe.com**, con la partita IVA del negozio. Chiedono i dati aziendali e
l'IBAN dove versare gli incassi, e possono metterci qualche giorno a
verificare l'attività: **non lasciarlo per l'ultimo giorno**.

Prendi le chiavi da _Developers_ → _API keys_:

| Riga nel `.env`                      | Valore                                        |
| ------------------------------------ | --------------------------------------------- |
| `STRIPE_SECRET_KEY`                  | la _Secret key_, comincia con `sk_live_`      |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | la _Publishable key_, comincia con `pk_live_` |

Poi il webhook, che è **come Stripe avvisa il sito che un pagamento è andato a
buon fine**. Senza, il cliente paga e l'ordine resta in sospeso.

_Developers_ → _Webhooks_ → _Add endpoint_:

- URL: `https://iltuodominio.it/api/webhooks/stripe`
- Eventi: `checkout.session.completed`, `checkout.session.expired`,
  `payment_intent.payment_failed`

Ti dà un _Signing secret_ che comincia con `whsec_`: va in
`STRIPE_WEBHOOK_SECRET`.

### PayPal — facoltativo

Se lo vuoi, da **developer.paypal.com** prendi _Client ID_ e _Secret_, e crea
un webhook verso `https://iltuodominio.it/api/webhooks/paypal`.

| Riga nel `.env`                | Valore                       |
| ------------------------------ | ---------------------------- |
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | il Client ID                 |
| `PAYPAL_CLIENT_SECRET`         | il Secret                    |
| `PAYPAL_ENVIRONMENT`           | `live` (era `sandbox`)       |
| `PAYPAL_WEBHOOK_ID`            | l'identificativo del webhook |

### Bonifico — nessun costo, nessuna configurazione esterna

| Riga nel `.env`        | Valore              |
| ---------------------- | ------------------- |
| `BANK_TRANSFER_IBAN`   | l'IBAN del negozio  |
| `BANK_TRANSFER_HOLDER` | l'intestatario      |
| `BANK_TRANSFER_BANK`   | il nome della banca |

È l'unico metodo a commissione zero, ed è quello che conviene suggerire sui
pezzi grossi.

### Le foto dei clienti

Su **uploadthing.com**, gratuito fino a 2 GB. Una chiave sola:
`UPLOADTHING_TOKEN`. Senza, «Progetta il tuo angolo» non può ricevere le foto —
cioè la funzione principale del sito non funziona.

Dopo ogni modifica al file:

```bash
systemctl restart materia-etrusca
```

---

## 7. Riempire il sito

Tutto da `https://iltuodominio.it/admin`, anche dal telefono.

### I pezzi

Per ognuno servono **altezza, diametro, peso e finitura**: non sono dettagli
estetici, sono i dati con cui il sito calcola la spedizione e risponde alla
prima domanda che fanno i clienti.

Se un pezzo è unico, mettilo a **1**: il sito garantisce che non venga venduto
due volte, anche se due persone pagano nello stesso istante.

### Le foto

Grandi, poche, vere. Le foto segnaposto della demo vanno tolte tutte. Su un
prodotto artigianale la foto è il prodotto.

### Le spedizioni

`/admin/spedizioni`. Le tariffe che trovi sono **indicative**: vanno sostituite
con quelle vere del corriere che userà. Sopra i **70 kg** il sito smette di
fare prezzo automatico e passa al preventivo su richiesta.

### I testi

`/admin/contenuti` per storia, FAQ, cura del cemento, condizioni. Scritti in
prima persona: parla l'artigiano, non il marketing.

---

## 8. Le pagine legali

Le pagine ci sono già nel sito, il testo dentro no. Per vendere online in
Italia servono:

- **Dati dell'attività** nel piè di pagina: ragione sociale, indirizzo, partita
  IVA, email di contatto
- **Condizioni di vendita**, con tempi di consegna e costi di spedizione
- **Diritto di recesso**: 14 giorni, con la procedura per esercitarlo
- **Informativa privacy** e **cookie**

**Questa parte non è mia e non è tua: è del commercialista del negozio.** Un
testo copiato da un altro sito non protegge nessuno. Chiedigli i testi e
incollali da `/admin/contenuti`.

---

## 9. I controlli prima di aprire

Da fare **dal telefono**, non dal computer: è da lì che arriveranno i clienti.

- [ ] `https://iltuodominio.it` si apre e il lucchetto è chiuso
- [ ] Anche `https://www.iltuodominio.it` funziona
- [ ] Un ordine di prova completo **pagando con bonifico**: il più semplice, e
      passa comunque da tutta la logica di prezzi e spedizione
- [ ] L'email di conferma dell'ordine arriva davvero
- [ ] Un ordine di prova **con carta**, con una carta vera e un pezzo
      economico: poi lo rimborsi da Stripe. È l'unico modo di sapere che il
      webhook funziona
- [ ] Una richiesta di prova da «Progetta il tuo angolo», con una foto
- [ ] Peso e misure si vedono nella scheda prodotto senza aprire niente
- [ ] La stima di spedizione compare **prima** del carrello
- [ ] `https://iltuodominio.it/sitemap.xml` e `/robots.txt` rispondono
- [ ] Nel piè di pagina ci sono partita IVA e dati dell'attività
- [ ] Se avevi usato `/api/installa`, la variabile `SETUP_SECRET` è stata tolta

---

## 10. Dopo l'apertura

### Le cinque righe che userai

```bash
ssh root@IL_TUO_IP                                   # entrare
nano /srv/materia-etrusca/.env                       # cambiare le chiavi
systemctl restart materia-etrusca                    # far ripartire il sito
systemctl status materia-etrusca                     # vedere come sta
bash /srv/materia-etrusca/scripts/aggiorna-vps.sh    # pubblicare aggiornamenti
```

### Quando qualcosa non va

```bash
journalctl -u materia-etrusca -n 50
```

Dice cosa è successo. Copialo e portalo a chi ti aiuta: senza quello si va a
indovinare.

### I backup

Lo script ne imposta uno automatico del database. **Ma un backup che sta sullo
stesso disco non è un backup**: una volta al mese scaricane una copia sul tuo
computer, o attiva gli snapshot dal pannello Contabo.

### Gli aggiornamenti di sistema

Una volta al mese:

```bash
apt update && apt upgrade -y
reboot
```

Il sito riparte da solo dopo il riavvio.

---

## Quanto costa, in tutto

| Voce                       | Quanto        | Quando                        |
| -------------------------- | ------------- | ----------------------------- |
| Dominio `.it`              | 10–20 €       | ogni anno                     |
| Server                     | 5–8 €         | ogni mese                     |
| Email (Resend)             | 0 €           | fino a 3.000 email al mese    |
| Foto clienti (Uploadthing) | 0 €           | fino a 2 GB                   |
| Certificato HTTPS          | 0 €           | sempre                        |
| Stripe                     | 1,5% + 0,25 € | solo sulle vendite con carta  |
| PayPal                     | 3,4% + 0,35 € | solo sulle vendite con PayPal |
| Bonifico                   | 0 €           | sempre                        |

**Circa 80–100 € il primo anno**, poi 70–90 € all'anno. Nessun canone di
piattaforma: il sito è di proprietà, non in affitto.
