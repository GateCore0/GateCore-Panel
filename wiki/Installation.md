# 🚀 Installation

Dieses Dokument beschreibt alle Möglichkeiten, GateCore zu installieren und zu starten.

---

## 📋 Voraussetzungen

| Anforderung | Beschreibung |
|-------------|--------------|
| **Docker** | Docker Engine & Docker Compose (v2 empfohlen) |
| **Betriebssystem** | Linux (für volle Funktionalität, auf Windows/macOS eingeschränkt) |
| **Root-Zugriff** | Optional für Hypervisor-Funktionen auf Remote-Hosts |
| **Hardware-Zugriff** | `/dev`, `/sys`, `/run/udev` für Passthrough & Hardware-Erkennung |

> 💡 Für den Betrieb im Docker-Container wird **privileged mode** benötigt, um auf Docker-Socket, `/dev` und `/sys` zuzugreifen.

---

## 🐳 Installation mit Docker Compose (empfohlen)

### 1. Repository klonen

```bash
git clone https://gitlab.com/gatecore/Gatecore-Panel.git
cd GateCore
```

### 2. Container bauen und starten

```bash
docker compose up --build -d
```

### 3. Logs beobachten

```bash
docker logs -f gatecore-server
```

### 4. Zugriff

| URL | Beschreibung |
|-----|-------------|
| http://localhost:3001 | Web-Interface |
| http://localhost:3001/api/... | REST API |

---

## 🔐 Standard-Login

| Feld | Wert |
|------|------|
| Benutzername | `admin` |
| Passwort | `admin` |

> ⚠️ **Wichtig:** Nach dem ersten Login das Passwort sofort ändern!
> Der Default-Admin wird automatisch beim ersten Serverstart angelegt (`seedDefaultUser`).

---

## ⚙️ Docker-Compose Services

| Service | Image | Port | Beschreibung |
|---------|-------|------|--------------|
| `gatecore-app` | Multi-Stage-Build (node:20-alpine) | `3001→3000` | Backend + statisches Frontend |
| `gatecore-db` | `postgres:15-alpine` | intern `5432` | PostgreSQL-Datenbank |

### Wichtige Volume-Mounts des App-Containers

| Mount | Beschreibung |
|-------|-------------|
| `/var/run/docker.sock:/var/run/docker.sock` | Zugriff auf den Host-Docker-Daemon |
| `/etc/gatecore:/etc/gatecore` | Konfigurationsdateien |
| `/dev:/dev` | Gerätezugriff für Passthrough/VMs |
| `/run/udev:/run/udev:ro` | udev-Datenbank (Hardware-Erkennung) |
| `/sys:/sys:ro` | Sysfs-Informationen |

---

## 🔧 Installation ohne Docker (Entwicklung)

Für die Entwicklung oder wenn Docker nicht gewünscht ist:

### 1. Backend-Abhängigkeiten installieren

```bash
npm install
```

### 2. Frontend-Abhängigkeiten installieren

```bash
cd frontend && npm install && cd ..
```

### 3. PostgreSQL starten

Es wird eine PostgreSQL-Instanz benötigt. Entweder eine lokale Installation oder:

```bash
docker run -d \
  --name gatecore-db \
  -e POSTGRES_USER=gatecore \
  -e POSTGRES_PASSWORD=gatecore_password \
  -e POSTGRES_DB=gatecore \
  -p 5432:5432 \
  postgres:15-alpine
```

### 4. Umgebungsvariablen setzen

```bash
export DATABASE_URL="postgresql://gatecore:gatecore_password@localhost:5432/gatecore?schema=public"
export JWT_SECRET="dein-geheimer-schluessel"
export NODE_ENV="development"
```

Oder die `.env`-Datei im Projektverzeichnis anlegen:

```env
DATABASE_URL=postgresql://gatecore:gatecore_password@localhost:5432/gatecore?schema=public
JWT_SECRET=dein-geheimer-schluessel
PORT=3000
```

### 5. Datenbank-Migrationen ausführen

```bash
npx prisma migrate deploy
npx prisma generate
```

### 6. Backend bauen & starten

```bash
npm run build:backend
node dist/backend/index.js
```

### 7. Frontend (Dev-Mode oder Production-Build)

**Dev-Mode** (Vite-Hot-Reload):

```bash
cd frontend && npm run dev
```
→ Vite Dev-Server läuft auf **http://localhost:5173**

**Production-Build:**

```bash
cd frontend && npm run build && cd ..
```

---

## ✅ Verifizierung

Nach erfolgreichem Start:

1. Öffne **http://localhost:3001** im Browser
2. Melde dich mit `admin` / `admin` an
3. Das **Dashboard** erscheint mit dem lokalen Docker-Host

Der Server erstellt automatisch:
- 🔑 **Default-Admin-Benutzer** (`admin` / `admin`)
- 🖥️ **Lokalen Docker-Host** (`Docker Host (Panel)`)

---

## 🛠️ Nützliche Docker-Befehle

```bash
# Container neu bauen
docker compose up --build -d

# Container stoppen
docker compose down

# Datenbank-Volume löschen (Daten gehen verloren!)
docker compose down -v

# Logs live ansehen
docker logs -f gatecore-server

# In den Container einsteigen
docker exec -it gatecore-server sh

# Status prüfen
docker compose ps
```

---

## 🔗 Verwandte Seiten

- [Schnellstart](Schnellstart)
- [Docker-Deployment](Docker-Deployment)
- [Konfiguration](Konfiguration)
- [Fehlerbehebung](Fehlerbehebung)