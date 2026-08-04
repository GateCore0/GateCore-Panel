# =============================================
# GateCore – Multi-Stage Docker Build
# Optimiert für CI/CD (GitHub Actions)
# =============================================

# ---------- Stage 1: Frontend Build ----------
FROM node:20-alpine3.20 AS frontend-builder

WORKDIR /app/frontend

# Zuerst nur package.json + Lockfile kopieren → besseres Layer-Caching
COPY frontend/package*.json ./
RUN npm ci

# Quellcode kopieren und Frontend bauen (Vite)
COPY frontend/ ./
RUN npm run build

# ---------- Stage 2: Backend Build ----------
FROM node:20-alpine3.20 AS backend-builder

WORKDIR /app

# Root-Abhängigkeiten inkl. devDependencies (für tsc)
# --no-optional: cpu-features (SSH2-Beschleuniger) bricht unter QEMU-Emulation (arm64) mit SIGILL ab
COPY package*.json ./
RUN npm ci --no-optional

# Prisma-Schema kopieren und Prisma-Client generieren
COPY prisma ./prisma
RUN npx prisma generate

# TypeScript-Quellcode kopieren
COPY tsconfig.json ./
COPY src ./src
COPY templates.json ./

# Backend kompilieren → dist/
RUN npm run build:backend

# ---------- Stage 3: Produktions-Image ----------
FROM node:20-alpine3.20 AS production

LABEL org.opencontainers.image.source="https://github.com/GateCore0/GateCore-Panel" \
      org.opencontainers.image.description="GateCore - Enterprise Infrastructure Management" \
      org.opencontainers.image.licenses="MIT"

WORKDIR /app

# System-Abhängigkeiten (Docker CLI, QEMU, OpenSSH, ZFS, Podman, etc.)
# liburing, numactl, glib, sqlite-libs, libgpg-error werden von qemu-guest-agent/podman benötigt
RUN apk add --no-cache \
    docker-cli \
    qemu-guest-agent \
    openssh-client \
    zfs \
    podman \
    curl \
    bash \
    openssl \
    util-linux \
    pciutils \
    usbutils \
    liburing \
    numactl \
    glib \
    sqlite-libs \
    libgpg-error

ENV NODE_ENV=production
ENV PORT=3000

# Nur Produktions-Dependencies installieren
# --no-optional: cpu-features (optionales natives Paket von ssh2) bricht unter QEMU-Emulation (arm64) mit exit 132 (SIGILL) ab
COPY package*.json ./
RUN npm ci --omit=dev --no-optional && npm cache clean --force

# Prisma-Schema kopieren (für Laufzeit-Migrationen via start.sh)
COPY prisma ./prisma

# Generierten Prisma-Client aus der Build-Stage kopieren
# (nötig, da die Prisma-CLI nur als devDependency existiert)
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Kompiliertes Backend aus Stage 2 kopieren
COPY --from=backend-builder /app/dist ./dist

# Gebautes Frontend aus Stage 1 kopieren
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Templates + Startskript
COPY templates.json ./
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

CMD ["./start.sh"]