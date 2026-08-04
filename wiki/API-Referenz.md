# 🔌 API-Referenz

Vollständige Referenz der REST-API und WebSocket-Endpoints von GateCore.

---

## 🔐 Authentifizierung

### POST /api/auth/login

Authentifiziert einen Benutzer und setzt ein JWT-Cookie.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### GET /api/auth/me

Gibt den aktuell angemeldeten Benutzer zurück.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### POST /api/auth/logout

Meldet den Benutzer ab (Cookie wird gelöscht).

---

## 👥 Benutzerverwaltung

### GET /api/users

Listet alle Benutzer auf (ohne Passwörter).

| Query | Typ | Beschreibung |
|-------|-----|-------------|
| – | – | – |

### POST /api/users

Erstellt einen neuen Benutzer.

```json
{
  "username": "max",
  "password": "sicheres-passwort",
  "role": "USER"
}
```

**Rollen:** `ADMIN` · `USER` · `VIEWER`

### DELETE /api/users/:id

Löscht einen Benutzer.

### PUT /api/users/:id/password

Ändert das Passwort eines Benutzers.

```json
{
  "newPassword": "neues-passwort"
}
```

---

## 🔐 LDAP

### GET /api/ldap/config

Gibt die LDAP-Konfiguration zurück.

### POST /api/ldap/config

Speichert die LDAP-Konfiguration.

```json
{
  "enabled": true,
  "url": "ldap://dc.example.com:389",
  "bindDn": "CN=svc,DC=example,DC=com",
  "bindPassword": "passwort",
  "searchBase": "OU=Users,DC=example,DC=com",
  "userFilter": "(sAMAccountName={{username}})"
}
```

---

## 🖥️ Hypervisors

### POST /api/hypervisors

Fügt einen neuen Hypervisor hinzu (inkl. automatischer Provisionierung per SSH).

```json
{
  "name": "Server-01",
  "ip": "192.168.1.10",
  "port": 22,
  "username": "root",
  "password": "root-passwort",
  "osType": "debian",
  "purpose": "ALL_IN_ONE"
}
```

**Purpose:** `LXC` · `VM_KVM` · `DOCKER` · `PODMAN` · `ALL_IN_ONE`

### GET /api/hypervisors

Listet alle verbundenen Hypervisor-Hosts auf.

### DELETE /api/hypervisors/:id

Entfernt einen Hypervisor.

---

## 🐳 Docker

### GET /api/docker/containers

Listet alle Docker-Container auf (lokal & remote per SSH).

| Query | Beispiel |
|-------|---------|
| `hostId` | `uuid` |

### POST /api/docker/containers

Erstellt einen Docker-Container.

```json
{
  "name": "myapp",
  "image": "nginx:latest",
  "volumeName": "my-volume",
  "mountPath": "/data",
  "hostId": "uuid"
}
```

### POST /api/docker/containers/:id/action

Führt eine Aktion auf einem Container aus.

```json
{ "action": "start" }
```

**Aktionen:** `start` · `stop` · `restart`

### GET /api/docker/containers/:id/logs

Gibt die letzten 200 Log-Zeilen des Containers zurück.

### GET /api/docker/containers/:id/config

Gibt die Container-Konfiguration (Ports & Volumes) zurück.

### PUT /api/docker/containers/:id/config

Aktualisiert Container-Konfiguration (Ports & Volumes).

```json
{
  "ports": [
    { "hostPort": 8080, "containerPort": 80, "protocol": "tcp" }
  ],
  "volumes": [
    { "hostPath": "/data", "containerPath": "/app/data", "mode": "rw" }
  ]
}
```

### DELETE /api/docker/containers/:id

Löscht einen Docker-Container.

---

## 📦 Docker Volumes

### GET /api/docker/volumes

Listet alle Docker-Volumes inkl. zugehöriger Storage-Pools auf.

| Query | Beispiel |
|-------|---------|
| `hostId` | `uuid` |

### POST /api/docker/volumes

Erstellt ein Docker-Volume.

```json
{
  "volumeName": "my-volume",
  "hostId": "uuid",
  "path": "/var/lib/docker/volumes/my-volume/_data"
}
```

### PUT /api/docker/volumes/:name

Benennt ein Volume um (Daten werden kopiert).

```json
{ "newName": "new-volume-name" }
```

### DELETE /api/docker/volumes/:name

Löscht ein Volume.

---

## 📃 Docker Compose

### GET /api/docker/compose

Listet alle Compose-Projekte auf.

| Query | Beispiel |
|-------|---------|
| `hostId` | `uuid` |

### POST /api/docker/compose

Erstellt ein Compose-Projekt.

```json
{
  "name": "wordpress",
  "content": "version: '3'\nservices:\n  web:\n    image: wordpress",
  "hostId": "uuid"
}
```

### POST /api/docker/compose/:id/action

Projekt-Aktion.

```json
{ "action": "up" }
```

**Aktionen:** `up` · `down` · `restart`

### GET /api/docker/compose/:id/logs

Gibt die Compose-Logs zurück.

### DELETE /api/docker/compose/:id

Löscht das Compose-Projekt.

---

## 🖥️ VMs, LXC & Podman

### POST /api/vm

Erstellt eine VM.

```json
{
  "hostId": "uuid",
  "name": "webserver",
  "vcpus": 4,
  "memoryMB": 8192,
  "diskSizeGB": 100,
  "storagePath": "/mnt/vm-storage"
}
```

### DELETE /api/vm/:id

Löscht eine VM.

### POST /api/lxc

Erstellt einen LXC-Container.

```json
{
  "hostId": "uuid",
  "name": "my-lxc",
  "template": "debian",
  "memoryMB": 2048,
  "storagePath": "/var/lib/lxc"
}
```

### DELETE /api/lxc/:id

Löscht einen LXC-Container.

### POST /api/podman

Erstellt einen Podman-Container.

```json
{
  "hostId": "uuid",
  "name": "my-podman",
  "image": "nginx:latest"
}
```

### DELETE /api/podman/:id

Löscht einen Podman-Container.

---

## 📊 Monitoring

### GET /api/hosts/:id/metrics

Aktuelle System-Metriken eines Hosts.

**Response:**
```json
{
  "cpu": 23.5,
  "memory": { "total": 32648, "used": 12490, "usagePercent": 38.3 },
  "disks": [ { "mount": "/", "usagePercent": 48 } ],
  "network": [ { "interface": "eth0", "rxBytes": 123, "txBytes": 456 } ]
}
```

### GET /api/hosts/:id/processes

Top-Prozesse nach CPU-Auslastung.

### GET /api/hosts/:id/metrics/history

Metrik-Verlauf der letzten 48 Stunden.

---

## 💾 Storage, ZFS & Disks

### GET /api/storage-pools

Listet alle Storage-Pools auf.

### POST /api/storage-pools

Erstellt einen Storage-Pool.

```json
{
  "name": "docker-images",
  "type": "DOCKER_IMAGE",
  "path": "/srv/storage/docker-images",
  "hostId": "uuid"
}
```

**Typen:** `ISO` · `DOCKER_IMAGE` · `LXC_TEMPLATE` · `PODMAN_IMAGE` · `DOCKER_COMPOSE` · `VM_DISK` · `DOCKER_VOLUME`

### DELETE /api/storage-pools/:id

Löscht einen Storage-Pool.

### GET /api/zfs

Listet alle ZFS-Pools auf.

### POST /api/zfs

Erstellt einen ZFS-Pool.

```json
{
  "hostId": "uuid",
  "poolName": "tank",
  "raidLevel": "raidz1",
  "disks": ["/dev/sdb", "/dev/sdc", "/dev/sdd"]
}
```

**RAID-Level:** `stripe` · `mirror` · `raidz1` · `raidz2` · `raidz3`

### DELETE /api/zfs/:id

Löscht einen ZFS-Pool (nur DB-Eintrag).

### POST /api/disks/format

Formatiert eine Festplatte.

```json
{
  "hostId": "uuid",
  "devicePath": "/dev/sdb",
  "fsType": "ext4"
}
```

**Dateisysteme:** `ext4` · `xfs` · `zfs`

### GET /api/hosts/:id/disks

Listet die Festplatten eines Hosts auf (via `lsblk`).

---

## 🔌 Hardware Passthrough

### GET /api/hardware/:hostId

Erkennt PCIe- & USB-Geräte auf einem Host.

**Response:**
```json
{
  "pci": [ { "id": "00:1f.2", "description": "SATA controller" } ],
  "usb": [ { "id": "8087:8000", "description": "Intel Corp." } ]
}
```

### GET /api/passthrough

Listet alle Passthrough-Zuweisungen auf.

### POST /api/passthrough

Erstellt eine Passthrough-Zuweisung.

```json
{
  "type": "PCIE",
  "deviceId": "00:1f.2",
  "description": "SATA Controller",
  "guestType": "VM",
  "guestId": "uuid",
  "hostId": "uuid"
}
```

**Guest-Typen:** `VM` · `LXC` · `DOCKER` · `PODMAN`

### DELETE /api/passthrough/:id

Entfernt eine Passthrough-Zuweisung.

---

## 📁 Dateiverwaltung

### Lokale Host-Dateien

| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/files/host/local` | GET | Verzeichnis auflisten |
| `/api/files/host/local/read` | GET | Datei lesen |
| `/api/files/host/local/save` | POST | Datei speichern |
| `/api/files/host/local` | DELETE | Datei löschen |

### Remote Host-Dateien (SSH)

| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/files/host` | GET | Verzeichnis auflisten |
| `/api/files/host/read` | GET | Datei lesen |
| `/api/files/host/save` | POST | Datei speichern |
| `/api/files/host` | DELETE | Datei löschen |

### Lokale Docker-Container-Dateien

| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/files/docker/container/local` | GET | Verzeichnis auflisten |
| `/api/files/docker/container/local/read` | GET | Datei lesen |
| `/api/files/docker/container/local/save` | POST | Datei speichern |
| `/api/files/docker/container/local` | DELETE | Datei löschen |

### Remote Docker-Container-Dateien (SSH)

| Endpoint | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/files/docker/container` | GET | Verzeichnis auflisten |
| `/api/files/docker/container/read` | GET | Datei lesen |
| `/api/files/docker/container/save` | POST | Datei speichern |
| `/api/files/docker/container` | DELETE | Datei löschen |

---

## 🌐 Cluster

### GET /api/cluster/nodes

Listet alle Cluster-Nodes auf.

### POST /api/cluster/nodes

Fügt einen Cluster-Node hinzu.

```json
{
  "name": "Remote-Node",
  "endpoint": "http://remote-node:3000",
  "apiKey": "api-key"
}
```

### DELETE /api/cluster/nodes/:id

Entfernt einen Cluster-Node.

---

## 📦 Templates

### GET /api/templates

Gibt die LXC-Templates & ISO-Images aus `templates.json` zurück.

```json
{
  "lxcTemplates": [ { "name": "Debian 12", "distro": "debian", "version": "12" } ],
  "isoImages": [ { "name": "Debian 12 NetInst", "url": "..." } ]
}
```

---

## 🐳 Docker-Container-Instanzen

### GET /api/docker/instances

Listet alle Docker-Container des lokalen Docker-Daemons auf.

### GET /api/hosts/:id/docker-containers

Listet Docker-Container eines bestimmten Hosts auf (lokal via Socket, remote per SSH).

---

## 🔌 WebSocket

### WS /ws/docker/shell/:containerName

Interaktive Shell in einem Docker-Container.

```
WebSocket → wss://host:3000/ws/docker/shell/mein-container

Client → { "type": "input", "data": "ls -la\n" }
Server → { "type": "output", "data": "total 16\n..." }
```

---

## 🔗 Verwandte Seiten

- [Architektur](Architektur)
- [Entwicklung](Entwicklung)
- [Projektstruktur](Projektstruktur)