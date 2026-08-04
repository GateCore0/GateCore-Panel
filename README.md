<<<<<<< README.md
# GateCore Enterprise Infrastructure Platform

**GateCore** ist eine Proxmox-ähnliche Web-Management-Plattform für die zentrale Verwaltung von Docker, Docker Compose, VMs (KVM/QEMU), LXC-Containern, Podman, ZFS-Storage, Hardware-Passthrough und Multi-Host-Clustern.

Farbschema: **Orange (#FF6B00) × Lila (#7C3AED)** · Dark & Light Mode · Deutsch / English

---

## Features

### Docker & Compose
- Docker-Container erstellen, löschen und verwalten
- Docker Compose Projekte erstellen und starten
- Docker Volumes erstellen und zuweisen
- Interaktive Web-Shell (WebSocket) in Container

### Hypervisor-Management
- Remote-Hosts per SSH hinzufügen (Debian, Ubuntu, Rocky Linux, Alma Linux, Fedora)
- Automatische SSH-Key-Generierung und passwortloses Login
- Automatische Installation von Verwaltungstools (ZFS, QEMU/KVM, LXC, Podman, Docker)
- VMs (QEMU/KVM) erstellen und löschen
- LXC-Container erstellen und löschen (Templates: Debian, Ubuntu, Rocky, Alpine)
- Podman-Container erstellen und löschen

### Storage & ZFS
- ZFS-Pools erstellen (Stripe, Mirror, RAIDZ1/2/3)
- Festplatten formatieren (ext4, XFS, ZFS)
- Speicher-Pools für ISO, Docker Images, LXC Templates, Podman Images, Compose-Dateien, VM Disks

### Hardware Passthrough
- PCIe-Passthrough für VMs, Docker, Podman, LXC
- USB-Passthrough für VMs, Docker, Podman, LXC

### Dateiverwaltung
- Host-Dateisystem browsen
- Dateien lesen, bearbeiten und speichern
- Dateien/Ordner löschen

### Benutzer & LDAP/AD
- Lokale Benutzerverwaltung (Anlegen, Löschen, Passwort ändern)
- Rollen: ADMIN, USER, VIEWER
- LDAP/Active Directory Anbindung

### Cluster
- Andere GateCore-Nodes per API-Key verbinden
- Multi-Host Cluster-Ansicht

### UI
- Proxmox-ähnliche Seiten-Navigation (Sidebar)
- Dark / Light Mode
- Mehrsprachig: Deutsch & Englisch
- Orange-Lila Farbschema

---

## Architektur

```
┌─────────────────────────────────────────────────┐
│                  Browser (SPA)                   │
│         React + Vite + Tailwind CSS              │
└────────────────────┬────────────────────────────┘
                     │ HTTP / WebSocket
┌────────────────────▼────────────────────────────┐
│              GateCore Backend                    │
│         Express.js + TypeScript                  │
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

## Voraussetzungen

- Docker & Docker Compose
- (Optional) Root-Zugang zu Remote-Hosts für Hypervisor-Funktionen

---

## Installation & Start

```bash
# Repository klonen / in das Projektverzeichnis wechseln
cd GateCore

# Container bauen und starten
sudo docker compose up --build -d

# Logs ansehen
sudo docker logs -f gatecore-server
```

Die Anwendung ist erreichbar unter:

| URL | Beschreibung |
|-----|-------------|
| http://localhost:3001 | Web-Interface |
| http://localhost:3001/api/... | REST API |

### Standard-Login

| Feld | Wert |
|------|------|
| Benutzername | `admin` |
| Passwort | `admin` |

> **Wichtig:** Passwort nach dem ersten Login ändern!

---

## Docker Compose Services

| Service | Image | Port | Beschreibung |
|---------|-------|------|--------------|
| `gatecore-server` | gatecore-gatecore-app | 3001→3000 | Backend + Frontend |
| `gatecore-postgres` | postgres:16-alpine | intern 5432 | PostgreSQL Datenbank |

---

## API-Übersicht

### Auth
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/auth/login` | Login (lokal + LDAP) |
| GET | `/api/auth/me` | Aktuelle Session |
| POST | `/api/auth/logout` | Logout |

### Users
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/users` | Alle Benutzer |
| POST | `/api/users` | Benutzer anlegen |
| DELETE | `/api/users/:id` | Benutzer löschen |
| PUT | `/api/users/:id/password` | Passwort ändern |

### LDAP
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/ldap/config` | LDAP-Config abrufen |
| POST | `/api/ldap/config` | LDAP-Config speichern |

### Hypervisors
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/hypervisors` | Alle Hosts (inkl. VMs/LXC/Podman) |
| POST | `/api/hypervisors` | Host hinzufügen + provisionieren |
| DELETE | `/api/hypervisors/:id` | Host löschen |

### Docker
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/docker/containers` | Container auflisten |
| POST | `/api/docker/containers` | Container erstellen |
| DELETE | `/api/docker/containers/:id` | Container löschen |
| GET | `/api/docker/compose` | Compose-Projekte |
| POST | `/api/docker/compose` | Compose-Projekt starten |
| DELETE | `/api/docker/compose/:id` | Compose-Projekt stoppen |
| POST | `/api/docker/volumes` | Volume erstellen |
| GET | `/api/docker/volumes` | Volumes auflisten |
| WS | `/ws/docker/shell/:name` | Interaktive Shell |

### VMs / LXC / Podman
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| POST | `/api/vm` | VM erstellen |
| DELETE | `/api/vm/:id` | VM löschen |
| POST | `/api/lxc` | LXC erstellen |
| DELETE | `/api/lxc/:id` | LXC löschen |
| POST | `/api/podman` | Podman erstellen |
| DELETE | `/api/podman/:id` | Podman löschen |

### Storage & ZFS
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/zfs` | ZFS-Pools auflisten |
| POST | `/api/zfs` | ZFS-Pool erstellen |
| DELETE | `/api/zfs/:id` | ZFS-Pool löschen |
| GET | `/api/storage-pools` | Speicher-Pools |
| POST | `/api/storage-pools` | Speicher-Pool anlegen |
| DELETE | `/api/storage-pools/:id` | Speicher-Pool löschen |
| POST | `/api/disks/format` | Festplatte formatieren |

### Hardware Passthrough
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/passthrough` | Passthrough-Zuweisungen |
| POST | `/api/passthrough` | Passthrough zuweisen |
| DELETE | `/api/passthrough/:id` | Zuweisung entfernen |
| GET | `/api/hardware/:hostId` | PCIe/USB Geräte listen |

### Dateien
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/files/host?path=` | Verzeichnis listen |
| GET | `/api/files/host/read?path=` | Datei lesen |
| POST | `/api/files/host/save` | Datei speichern |
| DELETE | `/api/files/host?path=` | Datei/Ordner löschen |

### Cluster
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/cluster/nodes` | Cluster-Nodes |
| POST | `/api/cluster/nodes` | Node hinzufügen |
| DELETE | `/api/cluster/nodes/:id` | Node entfernen |

### Templates
| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/templates` | LXC/ISO Templates (aus `templates.json`) |

---

## Hypervisor hinzufügen – Ablauf

1. Im Web-UI unter **Hypervisors** auf „Hypervisor Hinzufügen" klicken
2. IP, SSH-Port, Root-Zugangsdaten, OS-Typ und Zweck angeben
3. GateCore verbindet sich per SSH, generiert ein RSA-4096-Schlüsselpaar
4. Public Key wird auf dem Host in `~/.ssh/authorized_keys` eingetragen
5. Je nach Distro werden Pakete installiert:
   - **Debian/Ubuntu:** `zfsutils-linux`, `qemu-kvm`, `libvirt`, `lxc`, `podman`, `docker.io`, `docker-compose`
   - **Rocky/Alma/Fedora:** `zfs`, `qemu-kvm`, `libvirt`, `lxc`, `podman`, `docker`, `docker-compose`
6. Bei Docker-Zweck wird der Docker-Daemon aktiviert und ein GateCore-Agent-Container gestartet
7. Host erscheint im Dashboard als **ONLINE**

---

## LXC Templates

Templates werden in `templates.json` verwaltet und können per URL heruntergeladen werden:

| Distro | Version | Quelle |
|--------|---------|--------|
| Debian | 12 Bookworm | linuxcontainers.org |
| Ubuntu | 22.04 LTS Jammy | linuxcontainers.org |
| Rocky Linux | 9 | linuxcontainers.org |
| Alpine Linux | 3.19 | linuxcontainers.org |

Eigene Templates und ISO-Images können in `templates.json` ergänzt werden.

---

## Projektstruktur

```
GateCore/
├── docker-compose.yml          # Orchestration (App + PostgreSQL)
├── Dockerfile                  # Multi-Stage Build (Frontend + Backend)
├── start.sh                    # Startup: migrate → seed → server
├── package.json                # Backend Dependencies
├── templates.json              # LXC/ISO Template-URLs
├── prisma/
│   ├── schema.prisma           # Datenbankschema
│   └── migrations/             # SQL-Migrationen
├── src/backend/
│   ├── index.ts                # Express API + WebSocket
│   └── services/
│       ├── dockerService.ts    # Docker/Compose Verwaltung
│       ├── hypervisorService.ts# VM/LXC/Podman/ZFS via SSH
│       ├── sshService.ts       # SSH-Key + Host-Provisioning
│       ├── fileManagerService.ts # Host/Container Dateisystem
│       └── ldapService.ts      # LDAP/AD Authentifizierung
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── App.tsx             # Komplettes Web-Interface
        ├── index.css           # Tailwind Directives
        └── main.tsx
```

---

## Entwicklung (ohne Docker)

```bash
# Backend Dependencies
npm install

# Frontend Dependencies
cd frontend && npm install && cd ..

# PostgreSQL starten (oder DATABASE_URL anpassen)
# .env: DATABASE_URL=postgresql://gatecore:gatecore@localhost:5432/gatecore

# Prisma Migration
npx prisma migrate deploy
npx prisma generate

# Backend bauen
npm run build:backend

# Frontend bauen
cd frontend && npm run build && cd ..

# Server starten
node dist/backend/index.js

# Oder Dev-Mode Frontend
cd frontend && npm run dev   # Vite Dev-Server auf :5173
```

---

## Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `PORT` | `3000` | Backend-Port |
| `DATABASE_URL` | (compose) | PostgreSQL Connection String |
| `JWT_SECRET` | `gatecore-super-secret-key` | JWT Signing Key |
| `NODE_ENV` | `production` | Environment |

---

## Tech-Stack

| Schicht | Technologie |
|---------|-------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons |
| Backend | Node.js 20, Express, express-ws, TypeScript |
| ORM | Prisma |
| Datenbank | PostgreSQL 16 |
| Auth | JWT + bcrypt + LDAP/AD |
| SSH | node-ssh |
| Container | Docker Multi-Stage Build, Alpine |

---

## Lizenz

Proprietary – GateCore Enterprise Infrastructure Platform
=======