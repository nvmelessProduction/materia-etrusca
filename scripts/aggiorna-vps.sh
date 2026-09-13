#!/usr/bin/env bash
#
# Pubblica sul VPS gli aggiornamenti del sito.
#
#   bash /srv/materia-etrusca/scripts/aggiorna-vps.sh
#
# Prende il codice nuovo, applica le migration, ricompila e riavvia.
# Se qualcosa va storto durante la compilazione il sito **resta in piedi**
# con la versione precedente: si riavvia solo a build riuscita.

set -euo pipefail

CARTELLA="${CARTELLA:-/srv/materia-etrusca}"
SERVIZIO="${SERVIZIO:-materia-etrusca}"
UTENTE="${UTENTE:-materia}"
RAMO="${RAMO:-main}"

passo() { printf '\n\033[1m▸ %s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
muori() { printf '\033[31mErrore: %s\033[0m\n' "$*"; exit 1; }

[ "$(id -u)" -eq 0 ] || muori "va lanciato da root"
[ -d "$CARTELLA/.git" ] || muori "non trovo l'installazione in $CARTELLA"

passo "Prendo il codice nuovo"
prima="$(su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && git rev-parse --short HEAD")"
su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && git fetch origin $RAMO && git reset --hard origin/$RAMO"
dopo="$(su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && git rev-parse --short HEAD")"

if [ "$prima" = "$dopo" ]; then
  verde "Non c'è niente di nuovo ($dopo). Non tocco nulla."
  exit 0
fi
verde "Da $prima a $dopo."

passo "Installo le dipendenze"
su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && pnpm install --frozen-lockfile"

passo "Applico le migration"
su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && set -a && . ./.env && set +a && pnpm db:migrate"

passo "Compilo"
# Finché questo comando non finisce bene, il sito continua a servire la
# versione di prima: il riavvio viene dopo, non prima.
su "$UTENTE" -s /bin/bash -c "cd $CARTELLA && set -a && . ./.env && set +a && pnpm build"

passo "Riavvio"
systemctl restart "$SERVIZIO"
sleep 3
systemctl is-active --quiet "$SERVIZIO" || {
  printf '\033[31mIl servizio non è ripartito. Ultime righe:\033[0m\n'
  journalctl -u "$SERVIZIO" -n 30 --no-pager
  exit 1
}

verde "Fatto: il sito gira sulla versione $dopo."
