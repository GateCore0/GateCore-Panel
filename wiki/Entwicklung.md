# 👩💻 Entwicklung

Anleitung für Entwickler, die an GateCore mitarbeiten möchten.

---

## 🛠️ Tech-Stack

### Backend

| Technologie | Version |
|-------------|---------|
| Node.js | 20 |
| TypeScript | 5.9 |
| Express | 4.18 |
| Prisma | 5.10 |
| JWT | jsonwebtoken 9 |
| SSH | node-ssh 13 |
| LDAP | ldapjs 3 |

### Frontend

| Technologie | Version |
|-------------|---------|
| React | 18 |
| Vite | 5 |
| Tailwind CSS | 3 |
| TypeScript | 5 |
| xterm.js | Web-Shell |

---

## 📁 Projektstruktur

```
GateCore/
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── App.tsx            # Komplette UI (Sidebar, Tabs, Views)
│   │   ├── i18n.ts            # Sprachumschaltung DE/EN
│   │   ├── main.tsx           # Einstiegspunkt
│   │   └── index.css          # Tailwind & Farben
│   ├── tailwind.config.js     # Tailwind-Konfiguration
│   └── vite.config.ts         # Vite-Konfiguration (Proxy → :3000)
├── prisma/
│   ├── schema.prisma          # Datenbankschema
│   └── migrations/            # SQL-Migrationen
├── src/
│   └── backend/
│       ├── index.ts           # Express-Server, alle REST/WS-Routen
│       └── services/          # Business-Logik
│           ├── dockerService.ts
│           ├── fileManagerService.ts
│           ├── hypervisorService.ts
│           ├── ldapService.ts
│           ├── monitoringService.ts
│           └── sshService.ts
├── .env                       # Umgebungsvariablen
├── docker-compose.yml         # Docker-Setup
├── Dockerfile                 # Multi-Stage-Build
├── package.json               # Backend-Abhängigkeiten & Scripts
├── start.sh                   # Entrypoint (Migrationen + Server)
├── templates.json             # LXC-/ISO-Templates
└── tsconfig.json              # TypeScript-Konfiguration
```

---

## 🚀 Dev-Setup

### 1. Abhängigkeiten installieren

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. PostgreSQL starten

```bash
docker compose up -d gatecore-db
```

Oder per Docker:

```bash
docker run -d \
  --name gatecore-db \
  -e POSTGRES_USER=gatecore \
  -e POSTGRES_PASSWORD=gatecore_password \
  -e POSTGRES_DB=gatecore \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. `.env`-Datei anlegen

```env
DATABASE_URL=postgresql://gatecore:gatecore_password@localhost:5432/gatecore?schema=public
JWT_SECRET=dev-secret
PORT=3000
```

### 4. Prisma-Migrationen

```bash
npx prisma migrate dev
```

### 5. Backend starten (Dev-Mode)

```bash
npm run dev:backend
```

### 6. Frontend starten (Dev-Mode)

```bash
npm run dev:frontend
```

Frontend: **http://localhost:5173** (Vite-Proxy leitet API-Anfragen an Port 3000 weiter)

---

## 📦 Nützliche Scripts

| Script | Beschreibung |
|--------|-------------|
| `npm run build:frontend` | Frontend bauen (Vite build) |
| `npm run build:backend` | Backend bauen (tsc) |
| `npm run build` | Kompletter Build |
| `npm run start` | Production-Start (`node dist/backend/index.js`) |
| `npm run dev:backend` | Backend mit Hot-Reload (ts-node-dev) |
| `npm run dev:frontend` | Frontend mit HMR (Vite) |
| `npm run prisma:generate` | Prisma-Client generieren |
| `npm run prisma:migrate` | Neue Migration erstellen |

---

## 🗄️ Prisma-Migration

Neue Änderungen am Schema (`prisma/schema.prisma`):

```bash
# Neue Migration erstellen
npx prisma migrate dev --name <beschreibung>

# In Produktion anwenden
npx prisma migrate deploy
```

---

## 🧪 Testing

> Hinweis: Aktuell sind keine automatisierten Tests eingerichtet. Manuelles Testen über das Web-Interface oder die REST-API ist erforderlich.

---

## 🔗 Verwandte Seiten

- [Projektstruktur](Projektstruktur)
- [API-Referenz](API-Referenz)
- [Architektur](Architektur)
- [Changelog](Changelog)