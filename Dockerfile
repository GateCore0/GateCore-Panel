# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Backend & Runtime ---
FROM node:20-alpine
WORKDIR /app

# Install system dependencies (Docker CLI, QEMU, OpenSSH, ZFS Tools, Podman, OpenSSL, lsblk, PCI/USB-Tools)
RUN apk add --no-cache docker-cli qemu-guest-agent openssh-client zfs podman curl bash openssl util-linux pciutils usbutils

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY templates.json ./

RUN npm run build:backend

# Copy built frontend assets
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy startup script
COPY start.sh ./
RUN chmod +x start.sh

EXPOSE 3000

CMD ["./start.sh"]