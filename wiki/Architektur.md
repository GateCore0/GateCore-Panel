# 🏗️ Architektur

Dieses Dokument beschreibt die technische Architektur von GateCore – von der Frontend- bis zur Backend-Schicht sowie die Kommunikation mit Remote-Hypervisoren und der Datenbank.

---

## 📐 Systemarchitektur

```
┌─────────────────────────────────────────────────┐
│                  Browser (SPA)                   │
│         React + Vite + Tailwind CSS              │
│         (Dark/Light Mode, i18n DE/EN)            │
└────────────────────┬────────────────────────────┘
                     │ HTTP (REST) / WebSocket
┌────────────────────▼────────────────────────────┐
│              GateCore Backend                    │
│         Express.js + TypeScript                  │
│                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Docker  │ │Hypervisor│ │  File Manager    │ │
│  │ Service  │ │ Service  │ │  LDAP Service    │ │
│  └──────────┘ └────┬─────┘ └──────────────────┘ │
│                    │ SSH                         │
│              ┌─────▼─────┐                       │
│              │SSH Service│                       │
│              └───────────┘                       │
└────────┬───────────────────────────┬────────────┘
         │                           │
┌────────▼────────┐        ┌─────────▼────────────┐
│   PostgreSQL    │        │  Remote Hypervisors  │
│   (Prisma ORM)  │        │  (LXC/VM/Docker/…)   │
└─────────────────┘        └──────────────────────┘
```

---

## 🧩 Komponenten im Detail

### 1. Frontend (Browser-SPA)

| Aspekt | Technologie |
|--------|------------|
| Framework | React 18 |
| Build-Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | Lucide Icons |
| Terminal | xterm.js + xterm-addon-fit (Web-Shell) |
| Sprache | TypeScript |
| i18n | Deutsch & Englisch (selbst gebaut, keine externe Bibliothek) |

**Dateien:**
- `frontend/src/App.tsx` – Komplettes Web-Interface in einer Datei (Sidebar-Navigation, Tab-Management, alle CRUD-Views)
- `frontend/src/i18n.ts` – Sprachumschaltung (DE/EN)
- `frontend/src/main.tsx` – Einstiegspunkt
- `frontend/src/index.css` – Tailwind-Direktiven & benutzerdefinierte Farben

### 2. Backend (Express.js)

| Aspekt | Technologie |
|--------|------------|
| Framework | Express 4 + express-ws |
| Sprache | TypeScript (Node.js 20) |
| Auth | JWT (jsonwebtoken) + bcrypt |
| SSH | node-ssh |
| LDAP | ldapjs |
| ORM | Prisma 5 |

**Zentrale Datei:** `src/backend/index.ts` (ca. 1000 Zeilen) – enthält alle REST-Endpoints, WebSocket-Handler und das Seeding (Default-Admin + lokaler Docker-Host).

### 3. Services (Business-Logik)

| Service | Datei | Verantwortung |
|---------|-------|---------------|
| `SSHService` | `src/backend/services/sshService.ts` | SSH-Key-Generierung, Host-Provisioning, Remote-Kommandoausführung |
| `HypervisorService` | `src/backend/services/hypervisorService.ts` | VMs (KVM), LXC, Podman, ZFS-Pools, Festplatten, Hardware-Erkennung |
| `DockerService` | `src/backend/services/dockerService.ts` | Container, Compose, Volumes, Port-Konfiguration |
| `FileManagerService` | `src/backend/services/fileManagerService.ts` | Host- & Container-Dateisystem (lokal + remote), Host-Access-Agent |
| `LDAPService` | `src/backend/services/ldapService.ts` | LDAP/AD-Authentifizierung |
| `MonitoringService` | `src/backend/services/monitoringService.ts` | CPU/RAM/Disk/Netzwerk-Metriken, Top-Prozesse, 48h-Verlauf |

### 4. Datenbank (PostgreSQL + Prisma)

- **Provider:** PostgreSQL 16 (im Docker-Compose: postgres:15-alpine)
- **ORM:** Prisma 5
- **Migrationen:** `prisma/migrations/`

**Hauptmodelle:**
- `User` – Benutzerkonten mit Rollen ADMIN/USER/VIEWER
- `Host` – Angeschlossene Hypervisor-Hosts
- `VM`, `LXCContainer`, `PodmanContainer`, `DockerContainer`, `DockerComposeProject`
- `StoragePool`, `ZFSPool`
- `HardwarePassthrough`
- `SystemMetricHistory` – Metrik-Snapshots (48h)
- `LdapConfig`, `ClusterNode`

---

## 🔁 Kommunikationspfade

### Frontend ↔ Backend
- **REST-API:** `/api/*` (JSON, JWT-Auth über Header oder Cookie)
- **WebSocket:** `/ws/docker/shell/:containerName` (interaktive Container-Shell)

### Backend ↔ Remote-Hosts
- **SSH** (`node-ssh`) mit generiertem RSA-4096-Schlüssel
- Key wird bei der Erst-Einrichtung in `~/.ssh/authorized_keys` des Ziel-Hosts eingetragen
- Root-Zugriff wird für Provisioning benötigt

### Backend ↔ Docker (lokal)
- **Unix-Socket** `/var/run/docker.sock` (im Container gemountet)
- `exec`-Aufrufe von Docker-CLI-Befehlen

---

## 🐳 Docker-Deployment

Siehe auch: [Docker-Deployment](Docker-Deployment)

### Container-Services

| Service | Image | Port | Funktion |
|---------|-------|------|----------|
| `gatecore-app` | Multi-Stage-Build (node:20-alpine) | 3000→3000 | Backend + statisches Frontend |
| `gatecore-db` | postgres:15-alpine | 5432 (intern) | PostgreSQL-Datenbank |

### Wichtige Mounts des App-Containers

| Mount | Zweck |
|-------|-------|
| `/var/run/docker.sock` | Zugriff auf Host-Docker-Daemon |
| `/etc/gatecore` | Konfigurationsverzeichnis |
| `/dev` | Gerätezugriff (Passthrough, Disks) |
| `/run/udev` | Hardware-Erkennung |
| `/sys` | Hardware-Informationen |

> ⚠️ Der Container läuft mit `privileged: true` für vollen Hardware-Zugriff.

---

## 🔐 Authentifizierungs-Architektur

1. **Login** (`POST /api/auth/login`)
   - Zuerst lokale Datenbank (`User` + bcrypt)
   - Fallback: **LDAP/AD** (`LDAPService.authenticate`)
2. **JWT-Token** wird erzeugt (24h gültig)
3. Token wird als **httpOnly-Cookie** (`gatecore_token`) gesetzt
4. **Authorization-Header** oder **Cookie** wird bei jeder API-Anfrage geprüft

---

## 📊 Monitoring-Architektur

- **Alle 60 Sekunden** speichert der Server Metrik-Snapshots für jeden Host
- Datenquelle: `/proc/stat`, `free -m`, `df -hP`, `/proc/net/dev`, `/proc/uptime`, `/etc/os-release`
- **Aufbewahrung:** 48 Stunden (alte Einträge werden automatisch gelöscht)
- Abruf: `GET /api/hosts/:id/metrics/history`

---

## 🔗 Verwandte Seiten

- [Überblick](Überblick)
- [Features](Features)
- [Projektstruktur](Projektstruktur)
- [Entwicklung](Entwicklung)
- [API-Referenz](API-Referenz)