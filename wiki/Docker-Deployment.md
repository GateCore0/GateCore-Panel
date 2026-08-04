# 🐳 Docker-Deployment

Dieses Dokument beschreibt das Docker-Deployment von GateCore, einschließlich der Container-Architektur und der Konfiguration.

---

## 📦 Container-Services

| Service | Container-Name | Image | Port | Zweck |
|---------|---------------|-------|------|-------|
| `gatecore-app` | `gatecore-server` | Multi-Stage-Build (`node:20-alpine`) | `3001→3000` | Backend + statisches Frontend |
| `gatecore-db` | `gatecore-postgres` | `postgres:15-alpine` | intern `5432` | PostgreSQL-Datenbank |

---

## 🏗️ Multi-Stage Dockerfile

Das `Dockerfile` besteht aus zwei Stages:

### Stage 1: Frontend-Build

```dockerfile
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build
```

### Stage 2: Backend & Runtime

```dockerfile
FROM node:20-alpine
WORKDIR /app

# System-Abhängigkeiten (Docker CLI, QEMU, SSH, ZFS, Podman, ...)
RUN apk add --no-cache docker-cli qemu-guest-agent openssh-client zfs podman curl bash openssl util-linux pciutils usbutils

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY templates.json ./

RUN npm run build:backend

COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000
CMD ["./start.sh"]
```

> 💡 Der Container enthält **Docker-CLI**, **OpenSSH**, **ZFS**, **Podman**, **QEMU**, **pciutils** und **usbutils**, damit Remote-Hosts provisioniert und Hardware erkannt werden kann.

---

## 🚀 Start

```bash
# Bauen & Starten
docker compose up --build -d

# Logs
docker logs -f gatecore-server

# Status
docker compose ps
```

---

## ⚙️ Wichtige Konfiguration

### `.env`-Variablen

Die Umgebungsvariablen werden über die `environment`-Sektion in `docker-compose.yml` oder über eine `.env`-Datei gesetzt:

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `PORT` | `3000` | Port des Backends (im Container) |
| `DATABASE_URL` | — | PostgreSQL Connection String |
| `JWT_SECRET` | `gatecore-super-secret-key` | Signing-Key für JWT-Tokens |

### Standard DATABASE_URL (Docker-Compose)

```
postgresql://gatecore:gatecore_password@gatecore-db:5432/gatecore?schema=public
```

---

## 📂 Volume-Mounts

| Host-Pfad | Container-Pfad | Modus | Zweck |
|-----------|---------------|-------|-------|
| `/var/run/docker.sock` | `/var/run/docker.sock` | rw | Host-Docker-Daemon (Docker-in-Docker) |
| `/etc/gatecore` | `/etc/gatecore` | rw | Konfigurationsdateien |
| `/dev` | `/dev` | rw | Gerätezugriff (Disks, Passthrough) |
| `/run/udev` | `/run/udev` | ro | Hardware-Erkennung |
| `/sys` | `/sys` | ro | Sysfs-Informationen |

> ⚠️ Der Container läuft mit **`privileged: true`**. Dies ist notwendig für den vollen Hardware-Zugriff, stellt aber ein erhöhtes Sicherheitsrisiko dar.

---

## 🗄️ Datenbank

- **Datenbank:** PostgreSQL 15 (Alpine)
- **Persistenz:** Named Volume `postgres_data`
- **Migrationen:** Werden beim Start automatisch via `start.sh` ausgeführt (`npx prisma migrate deploy`)

### Datenbank-Reset

```bash
# Alle Container + Datenbank-Volume löschen (Daten gehen verloren!)
docker compose down -v
```

---

## 🔁 Nützliche Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `docker compose up --build -d` | Bauen und starten |
| `docker compose down` | Stoppen (Daten bleiben erhalten) |
| `docker compose down -v` | Stoppen und Volume löschen |
| `docker compose logs -f gatecore-server` | Live-Logs |
| `docker exec -it gatecore-server sh` | Shell im Container |
| `docker inspect gatecore-server` | Details anzeigen |

---

## 🔗 Verwandte Seiten

- [Installation](Installation)
- [Konfiguration](Konfiguration)
- [Architektur](Architektur)
- [Fehlerbehebung](Fehlerbehebung)