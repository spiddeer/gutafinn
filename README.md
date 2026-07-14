# Gotlandsguiden

En mobilforst webbapp for att hitta platser pa Gotland med karta, sok, filtrering och favoriter.

## Live

- Produktion: https://gotland.tobtech.se

## Vad vi bygger

Gotlandsguiden ar en platsguide som kombinerar:

- Interaktiv karta (Leaflet)
- Sokning och kategorifilter
- Favoriter i webblasaren
- Detaljvy for varje plats
- Backend-API for lasning/skapande av platser
- Driftbar setup i Proxmox med Docker Compose, backup och Cloudflare-routing

## Huvudfunktioner

- Karta centrerad pa Gotland
- Filter per kategori: strander, sevardheter, mat och dryck, smultronstallen
- Sokruta over namn/beskrivning
- Geolokalisering och avstandsvisning
- Favoriter via localStorage
- Light/dark mode
- Marker clustering for battre prestanda med manga platser

## Tech stack

### Frontend

- Vanilla JavaScript
- Leaflet + Leaflet MarkerCluster
- HTML/CSS (mobilforst, responsiv)

### Backend

- Node.js + Express
- SQLite (better-sqlite3)

### Drift

- Docker + Docker Compose
- Proxmox LXC
- Cloudflare Tunnel for publik doman

## Projektstruktur

```text
backend/
  db.js
  server.js
  seed.js
  seed-data.json
  Dockerfile
  package.json

public/
  index.html
  css/style.css
  js/app.js
  js/places-data.js

deploy/
  nginx.conf
  proxmox/
    docker-compose.yml
    deploy.sh
    backup.sh
    gotlandsguiden.service
    gotlandsguiden-backup.service
    gotlandsguiden-backup.timer
    README.md
```

## API

### Hamta alla platser

- Method: GET
- Path: /api/places

### Skapa plats

- Method: POST
- Path: /api/places
- Header: X-API-Key (kravs om API_KEY ar satt)
- Body:

```json
{
  "name": "Min plats",
  "category": "mat",
  "lat": 57.64,
  "lng": 18.29,
  "description": "Kort beskrivning"
}
```

Tillatna kategorier:

- strand
- sevardhet
- mat
- smultronstallen

## Kora lokalt (snabbstart)

### Alternativ A: Docker Compose

```bash
git clone https://github.com/spiddeer/gotlandguiden.git
cd gotlandguiden
docker compose up -d --build
```

App: http://localhost:3003

### Alternativ B: Frontend-only

Oppna public/index.html i en lokal webserver.

## Produktion och drift

Nuvarande produktion kor i Proxmox med separat app-container och Cloudflare edge.

- App-runbook: [deploy/proxmox/README.md](deploy/proxmox/README.md)
- Agentkontext: [AGENTS.md](AGENTS.md)
- Hook-dokumentation: [.github/hooks/README.md](.github/hooks/README.md)

## Deployflode

I app-containern (CT 201):

```bash
cd /opt/gotlandsguiden
./deploy/proxmox/deploy.sh
```

Scriptet gor:

1. git pull --ff-only
2. docker-compose up -d --build
3. visar containerstatus

## Backup

Manuell backup:

```bash
cd /opt/gotlandsguiden/deploy/proxmox
./backup.sh
```

Nattlig backup hanteras via systemd timer:

- gotlandsguiden-backup.timer
- gotlandsguiden-backup.service

## Status

Projektet ar aktivt i produktion och dokumentation ar uppdaterad for att andra utvecklare och AI-tjanster snabbt ska kunna forsta helheten.
