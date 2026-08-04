# 📁 Projektstruktur

Übersicht über die Datei- und Verzeichnisstruktur des GateCore-Projekts.

---

## 🗂️ Gesamtstruktur

```
GateCore/
├── 📄 .env                          # Umgebungsvariablen (DATABASE_URL, JWT_SECRET, ...)
├── 📄 docker-compose.yml            # Docker-Compose-Konfiguration (App + PostgreSQL)
├── 📄 Dockerfile                    # Multi-Stage-Build (Frontend + Backend)
├── 📄 package.json                  # Backend-Abhängigkeiten & Scripts
├── 📄 package-lock.json             # Lockfile
├── 📄 README.md                     # Projekt-README
├── 📄 start.sh                      # Entrypoint (Prisma-Migrationen + Serverstart)
├── 📄 templates.json                # LXC-Templates & ISO-Images
├── 📄 tsconfig.json                 # TypeScript-Konfiguration
│
├── 📁 frontend/                     # React SPA
│   ├── 📄 index.html                # HTML-Einstiegspunkt
│   ├── 📄 package.json              # Frontend-Abhängigkeiten
│   ├── 📄 postcss.config.js         # PostCSS-Konfiguration
│   ├── 📄 tailwind.config.js        # Tailwind-CSS-Konfiguration
│   ├── 📄 tsconfig.json             # TypeScript-Konfiguration (Frontend)
│   ├── 📄 vite.config.ts            # Vite-Konfiguration (Proxy → :3000)
│   └── 📁 src/
│       ├── 📄 App.tsx               # Komplette UI (Sidebar, Tabs, alle Views)
│       ├── 📄 i18n.ts               # Sprachumschaltung DE/EN
│       ├── 📄 index.css             # Tailwind-Direktiven & Custom-Farben
│       └── 📄 main.tsx              # React-Einstiegspunkt
│
├── 📁 prisma/                       # Datenbank
│   ├── 📄 schema.prisma             # Prisma-Schema (Modelle, Enums, Relationen)
│   └── 📁 migrations/               # SQL-Migrationen
│       ├── 📄 migration_lock.toml
│       ├── 📁 20240301000000_init/           # Initiale Migration
│       ├── 📁 20240803000000_docker_hosts_volumes/  # Docker-Hosts/Volumes
│       └── 📁 20260804080726_add_system_metric_history/  # Metrik-Verlauf
│
└── 📁 src/
    └── 📁 backend/
        ├── 📄 index.ts              # Express-Server (alle REST-/WS-Endpoints)
        └── 📁 services/             # Business-Logik
            ├── 📄 dockerService.ts          # Docker & Compose
            ├── 📄 fileManagerService.ts     # Dateiverwaltung (Host & Container)
            ├── 📄 hypervisorService.ts      # VMs, LXC, Podman, ZFS, Disks
            ├── 📄 ldapService.ts            # LDAP/AD-Authentifizierung
            ├── 📄 monitoringService.ts      # Metriken & Top-Prozesse
            └── 📄 sshService.ts             # SSH-Key-Generierung & Remote-Ausführung
```

---

## 📄 Wichtige Konfigurationsdateien

| Datei | Zweck |
|-------|-------|
| `.env` | Umgebungsvariablen (nicht im Git!) |
| `docker-compose.yml` | Container-Definition (App + DB) |
| `Dockerfile` | Multi-Stage-Build |
| `templates.json` | Verfügbare LXC-/ISO-Templates |
| `tsconfig.json` | TypeScript-Kompilierung |
| `frontend/tailwind.config.js` | Tailwind-Farben & Design-System |
| `frontend/vite.config.ts` | Vite-Dev-Server & API-Proxy |
| `prisma/schema.prisma` | Datenbankschema |

---

## 🗄️ Datenbank-Schema (Prisma-Modelle)

| Modell | Beschreibung |
|--------|-------------|
| `User` | Benutzerkonten & Rollen |
| `LdapConfig` | LDAP/AD-Konfiguration |
| `Host` | Angeschlossene Hypervisor-Hosts |
| `ClusterNode` | Weitere GateCore-Instanzen |
| `StoragePool` | Speicherorte nach Typ |
| `ZFSPool` | ZFS-Pools (RAID-Level & Disks) |
| `VM` | Virtuelle Maschinen |
| `LXCContainer` | LXC-Container |
| `PodmanContainer` | Podman-Container |
| `DockerContainer` | Docker-Container |
| `DockerComposeProject` | Compose-Projekte |
| `HardwarePassthrough` | PCIe/USB-Zuweisungen |
| `SystemMetricHistory` | Metrik-Snapshots (48h) |

---

## 🔗 Verwandte Seiten

- [Entwicklung](Entwicklung)
- [Architektur](Architektur)
- [API-Referenz](API-Referenz)