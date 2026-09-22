# Primi passi, senza saperne niente

Questa guida presume che tu non abbia mai usato un terminale. Non serve capire
cosa fai: serve copiare, incollare e premere Invio. Le cose da sapere davvero
sono cinque, e stanno qui sotto.

## Le cinque cose da sapere

1. Il **terminale** è una finestra nera dove si scrivono comandi. Ogni riga si
   conferma con **Invio**.
2. Per **incollare** nel terminale si preme il **tasto destro** del mouse
   (oppure `Ctrl+Shift+V`). Il solito `Ctrl+V` a volte non funziona.
3. Quando digiti una **password non compare niente**, nemmeno i puntini. È
   normale: scrivi al buio e premi Invio.
4. Se qualcosa parte e non vuoi più aspettare, si ferma con **`Ctrl+C`**.
5. Se **chiudi la finestra non rompi niente**. Il server continua per conto suo.
   Ti ricolleghi e sei dove eri.

---

## 1. Trova indirizzo e password del server

Vai su **my.contabo.com** e accedi. Il tuo VPS è nell'elenco.

Ti servono due cose:

- **L'indirizzo IP**: quattro numeri separati da punti, tipo `203.0.113.45`.
  È scritto nella scheda del server. Segnatelo.
- **La password di root**: è nell'email che Contabo ti ha mandato quando il
  server è stato attivato. Se non la trovi, dal pannello si può reimpostare.

Controlla anche **quale sistema è installato**. Deve essere **Ubuntu** o
**Debian**. Se c'è scritto Windows Server, dal pannello reinstalla scegliendo
**Ubuntu 24.04** (la reinstallazione cancella il disco: se non ci hai ancora
messo niente, non perdi nulla).

## 2. Apri il terminale su Windows

Premi il tasto **Windows**, scrivi `terminale`, premi Invio.

Si apre una finestra. Scrivi questo, mettendo il tuo IP al posto dell'esempio:

```
ssh root@203.0.113.45
```

Premi Invio.

**La prima volta** ti chiede se ti fidi di quel server, con una domanda che
finisce per `(yes/no/[fingerprint])?`. Scrivi `yes` e Invio.

Poi chiede la password. Incollala col tasto destro (non vedrai niente) e premi
Invio.

Se è andata, la riga diventa più o meno così:

```
root@vmi1234567:~#
```

Da qui in poi quello che scrivi lo esegue il server, non il tuo computer.

**Se dice `ssh non riconosciuto`:** Impostazioni → App → Funzionalità
facoltative → Aggiungi una funzionalità → «Client OpenSSH» → Installa. Poi
chiudi e riapri il terminale.

## 3. Installa il sito

Copia questa riga, incollala nel terminale col tasto destro, premi Invio:

```bash
curl -fsSL https://raw.githubusercontent.com/nvmelessProduction/materia-etrusca/main/scripts/installa-vps.sh -o installa.sh
```

Non succede niente di visibile: ha solo scaricato le istruzioni. Ora la
seconda riga, con il tuo IP al posto dell'esempio:

```bash
bash installa.sh --dominio 203.0.113.45
```

Parte e scrive tanta roba per una decina di minuti. **Lascia la finestra
aperta** e non toccare niente. Quando ha finito stampa l'indirizzo del sito e
l'elenco delle cose che restano da fare.

Se si interrompe a metà, rilancia la stessa riga: riprende da dove era e non
rovina quello che aveva già fatto.

## 4. Guarda il sito

Apri il browser e vai su `http://` seguito dal tuo IP, per esempio
`http://203.0.113.45`.

Il browser dirà che il sito **non è sicuro**. Per ora è giusto così: senza un
dominio non si può avere il certificato HTTPS. Si sistema quando compri il
dominio.

Il catalogo è vuoto: i pezzi si inseriscono dopo, da `/admin`.

## 5. Metti le chiavi

Senza queste tre non riesci nemmeno a entrare nel pannello di gestione, perché
si entra con un link mandato via email.

Serve un account gratuito su **resend.com**: ti dà la chiave per spedire le
email. Fatto quello, nel terminale:

```bash
nano /srv/materia-etrusca/.env
```

Si apre un editor di testo dentro il terminale. Ci si muove **solo con le
frecce** (il mouse non serve a niente). Trova queste righe e riempile fra le
virgolette:

| Riga             | Cosa ci va                                                          |
| ---------------- | ------------------------------------------------------------------- |
| `RESEND_API_KEY` | la chiave copiata da Resend                                         |
| `EMAIL_FROM`     | il mittente delle email, es. `Materia Etrusca <ciao@tuodominio.it>` |
| `ADMIN_EMAILS`   | **la tua email**: è questa che ti fa entrare in `/admin`            |
| `ARTISAN_EMAIL`  | la tua email, dove arrivano le richieste dei clienti                |

Per salvare: **`Ctrl+O`**, poi **Invio**. Per uscire: **`Ctrl+X`**.

Poi fai ripartire il sito perché legga i valori nuovi:

```bash
systemctl restart materia-etrusca
```

## 6. Entra nel pannello

Vai su `http://IL-TUO-IP/admin`, scrivi la tua email, e ti arriva un link per
entrare. Da lì si inseriscono i pezzi, si guardano gli ordini e si risponde
alle richieste di «Progetta il tuo angolo».

Il resto delle chiavi (Stripe per le carte, Uploadthing per le foto dei
clienti) si mette allo stesso modo, quando serve: si riapre lo stesso file con
`nano` e si rifà `systemctl restart materia-etrusca`.

---

## Quando qualcosa non va

Prima di tutto, queste due righe dicono quasi sempre cos'è successo:

```bash
systemctl status materia-etrusca
journalctl -u materia-etrusca -n 50
```

Copia quello che esce e mettilo da parte: è la cosa da mostrare a chi ti aiuta.

| Sintomo                                    | Cosa fare                                                   |
| ------------------------------------------ | ----------------------------------------------------------- |
| Il sito non si apre nel browser            | `systemctl restart materia-etrusca`, aspetta un minuto      |
| Non ricevi il link per entrare in `/admin` | controlla `RESEND_API_KEY` e `ADMIN_EMAILS` nel file `.env` |
| Il terminale si è chiuso da solo           | non è un problema: rifai `ssh root@IL-TUO-IP`               |
| Hai perso la password di root              | si reimposta dal pannello Contabo                           |

## Le poche righe che userai davvero

```bash
ssh root@IL-TUO-IP                                   # entrare nel server
nano /srv/materia-etrusca/.env                       # modificare le chiavi
systemctl restart materia-etrusca                    # far ripartire il sito
systemctl status materia-etrusca                     # vedere come sta
bash /srv/materia-etrusca/scripts/aggiorna-vps.sh    # pubblicare gli aggiornamenti
```

Sono cinque. Non ne servono altre per mandare avanti il negozio.
