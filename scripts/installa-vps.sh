#!/usr/bin/env bash
#
# Installazione di Materia Etrusca su un VPS Ubuntu o Debian.
#
# Mette tutto sulla stessa macchina: il sito, il database e nginx davanti.
# PostgreSQL resta in ascolto solo su localhost, quindi non è raggiungibile
# da internet: non c'è una porta del database da difendere.
#
# Uso, da root:
#
#   bash installa-vps.sh --dominio materiaetrusca.it --email tu@example.com
#
# Opzioni:
#   --dominio     il dominio che punta a questo server (obbligatorio)
#   --email       serve a Let's Encrypt per avvisarti alla scadenza
#   --senza-tls   salta il certificato (per provare su un dominio finto)
#   --repo        da dove clonare (predefinito: il repository del progetto)
#   --token       token GitHub, se il repository è privato (o GITHUB_TOKEN)
#
# Si può rilanciare: quello che è già a posto viene saltato.

set -euo pipefail

# Nessun comando deve fermarsi ad aspettare una risposta.
export DEBIAN_FRONTEND=noninteractive
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0
export CI=1

DOMINIO=""
EMAIL=""
SENZA_TLS=0
REPO="https://github.com/nvmelessProduction/materia-etrusca.git"
RAMO="main"
# Serve solo se il repository è privato. Meglio passarlo dall'ambiente
# (GITHUB_TOKEN=... bash installa-vps.sh ...) che come argomento: gli argomenti
# si leggono in `ps` e restano nella cronologia della shell.
TOKEN="${GITHUB_TOKEN:-}"

UTENTE="materia"
CARTELLA="/srv/materia-etrusca"
SERVIZIO="materia-etrusca"
PORTA=3000
DB_NOME="materia_etrusca"
DB_UTENTE="materia"

rosso()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde()  { printf '\033[32m%s\033[0m\n' "$*"; }
passo()  { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
muori()  { rosso "Errore: $*"; exit 1; }

# ---------------------------------------------------------------- argomenti

while [ $# -gt 0 ]; do
  case "$1" in
    --dominio)   DOMINIO="${2:-}"; shift 2 ;;
    --email)     EMAIL="${2:-}"; shift 2 ;;
    --repo)      REPO="${2:-}"; shift 2 ;;
    --ramo)      RAMO="${2:-}"; shift 2 ;;
    --token)     TOKEN="${2:-}"; shift 2 ;;
    --senza-tls) SENZA_TLS=1; shift ;;
    -h|--help)   sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *)           muori "opzione sconosciuta: $1" ;;
  esac
done

[ "$(id -u)" -eq 0 ] || muori "va lanciato da root (prova con: sudo bash $0 ...)"
[ -n "$DOMINIO" ] || muori "manca --dominio"

# Let's Encrypt non rilascia certificati per un indirizzo IP: se al posto del
# dominio c'è un IP, si va in HTTP senza chiedere niente a nessuno.
SOLO_IP=0
if printf '%s' "$DOMINIO" | grep -qE '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'; then
  SOLO_IP=1
  SENZA_TLS=1
fi

if [ "$SENZA_TLS" -eq 0 ] && [ -z "$EMAIL" ]; then
  muori "per il certificato serve --email (oppure usa --senza-tls)"
fi

# Tutto quello che il sito scrive negli indirizzi — email, sitemap, link
# canonici, conferme d'ordine — parte da qui: deve dire la verità su come
# è davvero raggiungibile, altrimenti manda la gente su pagine che non aprono.
if [ "$SENZA_TLS" -eq 1 ]; then
  PROTOCOLLO="http"
else
  PROTOCOLLO="https"
fi
INDIRIZZO_SITO="$PROTOCOLLO://$DOMINIO"

# Il "www." ha senso solo davanti a un dominio vero.
if [ "$SOLO_IP" -eq 1 ]; then
  NOMI_SERVER="$DOMINIO"
else
  NOMI_SERVER="$DOMINIO www.$DOMINIO"
fi

if [ ! -r /etc/os-release ]; then
  muori "non riconosco questo sistema: lo script è per Ubuntu o Debian"
fi
# shellcheck disable=SC1091
. /etc/os-release
case "${ID:-}${ID_LIKE:-}" in
  *debian*|*ubuntu*) : ;;
  *) muori "questo script è per Ubuntu o Debian, qui trovo ${PRETTY_NAME:-ignoto}" ;;
esac

# ------------------------------------------------------------------ pacchetti

passo "Aggiorno l'elenco dei pacchetti"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq

passo "Installo i pacchetti di sistema"
apt-get install -y -qq \
  ca-certificates curl git gnupg ufw nginx postgresql postgresql-contrib \
  certbot python3-certbot-nginx build-essential >/dev/null

passo "Installo Node.js 22"
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" != "22" ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null
  apt-get install -y -qq nodejs >/dev/null
fi
verde "Node $(node -v)"

# ------------------------------------------------------------------- utente

passo "Preparo l'utente di sistema"
if ! id -u "$UTENTE" >/dev/null 2>&1; then
  adduser --system --group --home "$CARTELLA" --shell /bin/bash "$UTENTE"
fi
mkdir -p "$CARTELLA"
chown -R "$UTENTE:$UTENTE" "$CARTELLA"

# ----------------------------------------------------------------- database

passo "Preparo PostgreSQL"
systemctl enable --now postgresql >/dev/null 2>&1 || true

esiste_ruolo=$(su postgres -c "psql -tAc \"select 1 from pg_roles where rolname='$DB_UTENTE'\"" || true)
if [ "$esiste_ruolo" != "1" ]; then
  DB_PASSWORD="$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-32)"
  su postgres -c "psql -qc \"create role $DB_UTENTE login password '$DB_PASSWORD'\"" >/dev/null
  verde "Ruolo $DB_UTENTE creato."
else
  # Il ruolo c'era già: la password non si può rileggere, quindi se ne impone
  # una nuova e si riscrive nel file d'ambiente più avanti.
  DB_PASSWORD="$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-32)"
  su postgres -c "psql -qc \"alter role $DB_UTENTE password '$DB_PASSWORD'\"" >/dev/null
  verde "Ruolo $DB_UTENTE già presente: password rigenerata."
fi

esiste_db=$(su postgres -c "psql -tAc \"select 1 from pg_database where datname='$DB_NOME'\"" || true)
if [ "$esiste_db" != "1" ]; then
  su postgres -c "createdb -O $DB_UTENTE $DB_NOME"
  verde "Database $DB_NOME creato."
fi

# PostgreSQL resta su localhost: è la scelta che rende inutile difendere la
# porta 5432, perché da fuori non la raggiunge nessuno.
DATABASE_URL="postgresql://$DB_UTENTE:$DB_PASSWORD@127.0.0.1:5432/$DB_NOME"

# ------------------------------------------------------------------ codice

passo "Prendo il codice"
# Non si usa `git clone`: la cartella non è mai davvero vuota — ci sono i file
# creati da adduser, e dopo un tentativo interrotto anche dei residui. Con
# init + fetch la cosa funziona comunque, e lo script resta rilanciabile.
su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && git init -q"
su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && git remote add origin '$REPO' 2>/dev/null || git remote set-url origin '$REPO'"

# Repository privato: le credenziali vanno in un file letto da git, non
# nell'indirizzo del remoto. Così il token non finisce né in `ps`, né in
# .git/config, né nei messaggi d'errore — e aggiorna-vps.sh lo riusa da sé.
CREDENZIALI="$CARTELLA/.git-credentials"
if [ -n "$TOKEN" ]; then
  HOST="$(printf '%s' "$REPO" | sed -E 's#^https://([^/]+)/.*#\1#')"
  install -o "$UTENTE" -g "$UTENTE" -m 600 /dev/null "$CREDENZIALI"
  printf 'https://x-access-token:%s@%s\n' "$TOKEN" "$HOST" > "$CREDENZIALI"
  su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && git config credential.helper 'store --file=$CREDENZIALI'"
fi

if ! su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && git fetch --depth 1 origin $RAMO"; then
  if [ -z "$TOKEN" ]; then
    muori "non riesco a scaricare il codice. Se il repository è privato serve un token di sola lettura: GITHUB_TOKEN=... bash $0 --dominio $DOMINIO ..."
  fi
  muori "non riesco a scaricare il codice: il token è scaduto o non ha accesso a $REPO"
fi
su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && git checkout -f -B $RAMO FETCH_HEAD"

# ------------------------------------------------------------------ ambiente

passo "Scrivo le variabili d'ambiente"
AMBIENTE="$CARTELLA/.env"

leggi_esistente() {
  # Conserva i valori già compilati a mano (chiavi di Stripe, Resend…)
  # invece di azzerarli a ogni riesecuzione.
  local chiave="$1"
  [ -f "$AMBIENTE" ] || return 0
  grep -E "^$chiave=" "$AMBIENTE" | head -1 | cut -d= -f2- | tr -d '"' || true
}

genera_se_vuoto() {
  local valore="$1"
  [ -n "$valore" ] && printf '%s' "$valore" || openssl rand -base64 32 | tr -d '\n'
}

AUTH_SECRET="$(genera_se_vuoto "$(leggi_esistente AUTH_SECRET)")"
CRON_SECRET="$(genera_se_vuoto "$(leggi_esistente CRON_SECRET)")"

cat > "$AMBIENTE" <<EOF
# Scritto da installa-vps.sh il $(date '+%d/%m/%Y %H:%M').
# Le righe vuote vanno riempite a mano: finché restano vuote, quella
# funzione semplicemente non compare sul sito.

NEXT_PUBLIC_SITE_URL="$INDIRIZZO_SITO"
DATABASE_URL="$DATABASE_URL"
AUTH_SECRET="$AUTH_SECRET"
AUTH_TRUST_HOST="true"
CRON_SECRET="$CRON_SECRET"
NODE_ENV="production"

# Chi entra nel pannello /admin
ADMIN_EMAILS="$(leggi_esistente ADMIN_EMAILS)"
ARTISAN_EMAIL="$(leggi_esistente ARTISAN_EMAIL)"

# Email transazionali (Resend). Senza, non si può nemmeno accedere ad /admin.
RESEND_API_KEY="$(leggi_esistente RESEND_API_KEY)"
EMAIL_FROM="$(leggi_esistente EMAIL_FROM)"

# Pagamenti. Senza chiavi, il metodo non compare al checkout.
STRIPE_SECRET_KEY="$(leggi_esistente STRIPE_SECRET_KEY)"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$(leggi_esistente NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)"
STRIPE_WEBHOOK_SECRET="$(leggi_esistente STRIPE_WEBHOOK_SECRET)"
NEXT_PUBLIC_PAYPAL_CLIENT_ID="$(leggi_esistente NEXT_PUBLIC_PAYPAL_CLIENT_ID)"
PAYPAL_CLIENT_SECRET="$(leggi_esistente PAYPAL_CLIENT_SECRET)"
PAYPAL_ENVIRONMENT="$(leggi_esistente PAYPAL_ENVIRONMENT)"
PAYPAL_WEBHOOK_ID="$(leggi_esistente PAYPAL_WEBHOOK_ID)"

# Bonifico
BANK_TRANSFER_IBAN="$(leggi_esistente BANK_TRANSFER_IBAN)"
BANK_TRANSFER_HOLDER="$(leggi_esistente BANK_TRANSFER_HOLDER)"
BANK_TRANSFER_BANK="$(leggi_esistente BANK_TRANSFER_BANK)"

# Foto dei progetti
UPLOADTHING_TOKEN="$(leggi_esistente UPLOADTHING_TOKEN)"
EOF

chown "$UTENTE:$UTENTE" "$AMBIENTE"
chmod 600 "$AMBIENTE"

# ------------------------------------------------------- dipendenze e build

passo "Installo pnpm"
# Non si usa `corepack enable`: alla prima esecuzione corepack scarica pnpm e
# **chiede conferma**, e uno script che si installa da solo non deve fermarsi
# ad aspettare che qualcuno prema invio. Si installa la versione esatta che il
# progetto dichiara, una volta sola, per tutti gli utenti.
VERSIONE_PNPM="$(sed -n 's/.*"packageManager": *"pnpm@\([^"+]*\).*/\1/p' "$CARTELLA/package.json" | head -1)"
[ -n "$VERSIONE_PNPM" ] || VERSIONE_PNPM="latest"

# Se su questa macchina qualcuno ha già lanciato `corepack enable`, i suoi
# shim hanno la precedenza e riaprirebbero il problema del download a metà
# installazione: si tolgono di mezzo ovunque stiano, non solo accanto a node.
corepack disable >/dev/null 2>&1 || true
for cartella in /usr/bin /usr/local/bin "$(npm prefix -g 2>/dev/null || echo /usr)/bin"; do
  for shim in pnpm pnpx; do
    if [ -L "$cartella/$shim" ]; then rm -f "$cartella/$shim"; fi
  done
done

# --prefix /usr/local non è un dettaglio: senza, npm sceglie da sé dove mettere
# i programmi globali, e dove sceglie dipende da come è stato installato Node.
# Indovinarlo è stato il difetto di prima. /usr/local/bin è la prima voce del
# PATH che `su` assegna agli altri utenti, quindi lì lo trovano tutti.
npm install -g --prefix /usr/local "pnpm@$VERSIONE_PNPM" >/dev/null

# npm eredita la umask di chi lo lancia. Se è restrittiva — e su parecchie
# immagini di server lo è — i file globali nascono illeggibili per tutti
# tranne root, e il servizio non riesce a eseguirli. root non se ne accorge
# mai, perché i permessi non lo riguardano: il guasto salta fuori solo al
# primo comando lanciato come utente normale.
chmod -R a+rX /usr/local/lib/node_modules 2>/dev/null || true

# Node e npm possono stare fuori dal PATH degli altri utenti: un collegamento
# dove guardano tutti costa niente e toglie il problema alla radice.
for binario in node npm npx; do
  origine="$(command -v "$binario" 2>/dev/null || true)"
  if [ -n "$origine" ] && [ "$origine" != "/usr/local/bin/$binario" ]; then
    ln -sfn "$origine" "/usr/local/bin/$binario"
  fi
done

PNPM="/usr/local/bin/pnpm"

# Se una configurazione di npm sovrascrive --prefix, il binario finisce altrove:
# lo si cerca e gli si mette il collegamento dove il servizio lo aspetta.
if [ ! -x "$PNPM" ]; then
  altrove="$(command -v pnpm 2>/dev/null || true)"
  if [ -n "$altrove" ]; then ln -sfn "$altrove" "$PNPM"; fi
fi

# Il `cd` non è pignoleria: `su` non cambia cartella, quindi il comando
# partirebbe da dove si trova chi lancia lo script — di solito /root, che
# l'utente del servizio non può leggere. pnpm guarda la cartella corrente
# all'avvio e si ferma lì, con un errore che sembra un problema di
# installazione e non lo è.
if ! ESITO_PNPM="$(su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && $PNPM --version" 2>&1)"; then
  rosso "pnpm non è raggiungibile dall'utente $UTENTE. Quello che vedo:"
  rosso "  errore           $ESITO_PNPM"
  rosso "  node             $(command -v node 2>/dev/null || echo 'non trovato')"
  rosso "  npm              $(command -v npm 2>/dev/null || echo 'non trovato')"
  rosso "  npm prefix -g    $(npm prefix -g 2>/dev/null || echo '?')"
  rosso "  $PNPM  $([ -x "$PNPM" ] && echo 'presente' || echo 'MANCANTE')"
  rosso "  PATH di $UTENTE  $(su "$UTENTE" -s /bin/bash -c 'echo $PATH' 2>/dev/null || echo '?')"
  muori "manda queste righe a chi ti assiste: dicono esattamente cosa manca"
fi

verde "pnpm $(su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && $PNPM --version")"

passo "Installo le dipendenze e compilo (ci vuole qualche minuto)"
su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && $PNPM install --frozen-lockfile"
su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && set -a && . ./.env && set +a && $PNPM db:migrate && $PNPM db:seed:prod && $PNPM build"

# ------------------------------------------------------------------ servizio

passo "Configuro il servizio di sistema"
cat > "/etc/systemd/system/$SERVIZIO.service" <<EOF
[Unit]
Description=Materia Etrusca
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$UTENTE
WorkingDirectory=$CARTELLA
EnvironmentFile=$CARTELLA/.env
Environment=PORT=$PORTA
ExecStart=/usr/local/bin/pnpm start
Restart=always
RestartSec=5
# Il processo non ha bisogno di scrivere fuori dalla sua cartella.
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=false

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "$SERVIZIO" >/dev/null
systemctl restart "$SERVIZIO"

# --------------------------------------------------------------------- nginx

passo "Configuro nginx"
# Non tutti i VPS hanno IPv6 attivo: se non c'è, la riga `listen [::]:80`
# impedisce a nginx di partire del tutto. Si mette solo quando serve.
if [ -f /proc/net/if_inet6 ]; then
  ASCOLTO_IPV6="    listen [::]:80;"
else
  ASCOLTO_IPV6=""
fi

cat > "/etc/nginx/sites-available/$SERVIZIO" <<EOF
server {
    listen 80;
$ASCOLTO_IPV6
    server_name $NOMI_SERVER;

    # Le foto dei progetti arrivano già ridotte dal browser, ma il margine serve.
    client_max_body_size 25m;

    # I file di Next hanno l'impronta nel nome: si possono tenere per sempre.
    location /_next/static/ {
        proxy_pass http://127.0.0.1:$PORTA;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:$PORTA;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        # Il limite anti-spam del modulo progetto conta sugli indirizzi veri.
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               application/xml image/svg+xml;
    gzip_min_length 1024;
}
EOF

ln -sf "/etc/nginx/sites-available/$SERVIZIO" "/etc/nginx/sites-enabled/$SERVIZIO"
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# ------------------------------------------------------------------ firewall

passo "Chiudo le porte che non servono"
ufw allow OpenSSH >/dev/null
ufw allow 'Nginx Full' >/dev/null
ufw --force enable >/dev/null
verde "Aperte solo SSH, 80 e 443. Il database non è raggiungibile da fuori."

# ------------------------------------------------------------------- backup

passo "Imposto il backup del database"
# Una copia al giorno, trenta giorni di storico. Sta sullo stesso disco, quindi
# **non è un backup vero**: protegge da un errore umano o da una migration
# sbagliata, non dalla perdita della macchina. Per quello servono gli snapshot
# del provider, o una copia scaricata altrove.
CARTELLA_BACKUP="/var/backups/materia-etrusca"
install -d -o postgres -g postgres -m 700 "$CARTELLA_BACKUP"

cat > /usr/local/bin/materia-etrusca-backup <<EOF
#!/bin/bash
# Copia giornaliera del database, con trenta giorni di storico.
set -euo pipefail
NOME="$CARTELLA_BACKUP/\$(date +%F).sql.gz"
pg_dump --no-owner --no-privileges "$DB_NOME" | gzip -9 > "\$NOME.parziale"
mv "\$NOME.parziale" "\$NOME"
find "$CARTELLA_BACKUP" -name '*.sql.gz' -mtime +30 -delete
# Un tentativo fallito lascia il file a metà: si scrive su .parziale proprio
# perché una copia rotta non sovrascriva mai l'ultima buona.
find "$CARTELLA_BACKUP" -name '*.parziale' -mtime +1 -delete
EOF
chmod 750 /usr/local/bin/materia-etrusca-backup

cat > /etc/cron.d/materia-etrusca-backup <<EOF
# Backup del database di Materia Etrusca.
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

30 3 * * * postgres /usr/local/bin/materia-etrusca-backup
EOF

# Il primo si fa adesso: un backup che nessuno ha mai visto funzionare non è
# un backup, è una speranza.
if su postgres -s /bin/bash -c /usr/local/bin/materia-etrusca-backup; then
  verde "Backup giornaliero alle 3:30 in $CARTELLA_BACKUP (30 giorni di storico). Il primo è già fatto."
else
  rosso "Il backup non è partito: controlla con  su postgres -c /usr/local/bin/materia-etrusca-backup"
fi

# --------------------------------------------------------------------- TLS

if [ "$SENZA_TLS" -eq 0 ]; then
  passo "Chiedo il certificato a Let's Encrypt"
  certbot --nginx -d "$DOMINIO" -d "www.$DOMINIO" \
    --non-interactive --agree-tos --email "$EMAIL" --redirect || \
    rosso "Certificato non ottenuto. Controlla che $DOMINIO punti davvero a questo server, poi rilancia: certbot --nginx -d $DOMINIO"
fi

# ------------------------------------------------------- operazioni a orario

passo "Programmo le operazioni automatiche"
BASE="$INDIRIZZO_SITO"

cat > /etc/cron.d/materia-etrusca <<EOF
# Operazioni pianificate di Materia Etrusca.
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin

# promemoria dei carrelli lasciati a metà (dopo 24 ore)
0 10 * * * root curl -fsS -m 60 -H "Authorization: Bearer $CRON_SECRET" $BASE/api/cron/carrelli-abbandonati >/dev/null
# richieste di recensione (15 giorni dalla consegna)
30 10 * * * root curl -fsS -m 60 -H "Authorization: Bearer $CRON_SECRET" $BASE/api/cron/richieste-recensione >/dev/null
# proposte in scadenza e chiusura di quelle scadute
0 9 * * * root curl -fsS -m 60 -H "Authorization: Bearer $CRON_SECRET" $BASE/api/cron/promemoria-proposte >/dev/null
# cancellazione delle foto di progetto dopo dodici mesi
0 4 * * 1 root curl -fsS -m 120 -H "Authorization: Bearer $CRON_SECRET" $BASE/api/cron/cancella-foto-progetti >/dev/null
# riepilogo vendite del lunedì
0 8 * * 1 root curl -fsS -m 60 -H "Authorization: Bearer $CRON_SECRET" $BASE/api/cron/riepilogo-settimanale >/dev/null
EOF
chmod 644 /etc/cron.d/materia-etrusca

# ------------------------------------------------------------------ riepilogo

passo "Fatto"
INDIRIZZO="$INDIRIZZO_SITO"

cat <<EOF

  Il sito è su $INDIRIZZO
EOF

if [ "$SENZA_TLS" -eq 1 ]; then
  cat <<EOF
  ATTENZIONE: stai andando in HTTP, senza certificato.
  Va bene per guardarlo, non per vendere: senza HTTPS i pagamenti con carta
  non funzionano e il browser segnala il sito come non sicuro.
  Quando avrai un dominio che punta qui:
      bash $0 --dominio iltuodominio.it --email tu@example.com
EOF
fi

cat <<EOF
  Il catalogo è vuoto: i pezzi si inseriscono da $INDIRIZZO/admin

  Prima di aprire davvero, riempi le righe vuote in:
      $CARTELLA/.env

  Le più urgenti:
    RESEND_API_KEY, EMAIL_FROM, ADMIN_EMAILS   senza queste non entri in /admin
    STRIPE_SECRET_KEY e compagnia              per incassare con carta
    UPLOADTHING_TOKEN                          per le foto di "Progetta il tuo angolo"

  Dopo averle riempite:
      systemctl restart $SERVIZIO

  Comandi che ti serviranno:
      systemctl status $SERVIZIO      come sta
      journalctl -u $SERVIZIO -f      cosa sta facendo
      bash $CARTELLA/scripts/aggiorna-vps.sh   per pubblicare gli aggiornamenti

EOF
