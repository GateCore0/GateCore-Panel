# 🐳 Docker & Compose

Anleitung zur Verwaltung von Docker-Containern, Volumes und Compose-Projekten in GateCore.

---

## 📋 Container

### Container erstellen

Im Bereich **Docker & Compose** → **Container Erstellen**:

| Feld | Beschreibung |
|------|-------------|
| **Name** | Eindeutiger Containername |
| **Image** | Docker-Image (z.B. `nginx:latest`) |
| **Volume** | Optional: Bestehendes Volume aus Storage-Pool |
| **Mount-Pfad** | Pfad im Container (Standard: `/data`) |
| **Host** | Ziel-Host (Standard: Lokaler Docker-Host) |

### Container-Aktionen

| Aktion | Beschreibung |
|--------|--------------|
| ▶️ **Start** | Gestoppten Container starten |
| ⏹ **Stop** | Laufenden Container stoppen |
| 🔄 **Restart** | Container neu starten |
| 📜 **Logs** | Container-Logs anzeigen (200 Zeilen) |
| ✏️ **Bearbeiten** | Ports & Volumes der Container-Konfiguration ändern |
| 🗑️ **Löschen** | Container entfernen (auch von Remote-Hosts) |
| 💻 **Shell** | Interaktive Shell im Container (WebSocket) |

### Container-Konfiguration bearbeiten

Ports und Volumes können nachträglich geändert werden. Der Container wird dabei neu erstellt (Recreate).

> ⚠️ **Compose-verwaltete Container** können nicht bearbeitet werden – Konfiguration muss in der `docker-compose.yml` geändert werden.

---

## 📊 Volumes

### Volume erstellen

```http
POST /api/docker/volumes
```

| Parameter | Beschreibung |
|-----------|-------------|
| `volumeName` | Name des Volumes |
| `hostId` | Ziel-Host (optional) |
| `path` | Host-Pfad (Standard: `/var/lib/docker/volumes/<name>/_data`) |

### Volume-Aktionen

- 🔍 **Auflisten** – Alle Volumes inkl. Storage-Pools
- ✏️ **Umbenennen** – Volume & Daten werden kopiert
- 🗑️ **Löschen** – Volume wird entfernt (Datenverlust!)

---

## 📦 Compose-Projekte

### Compose-Projekt erstellen

Im Bereich **Docker & Compose** → **Compose-Projekte** → Neues Projekt:

1. **Name** eingeben
2. **`docker-compose.yml`-Inhalt** einfügen
3. **Host** auswählen
4. **Erstellen** klicken

### Compose-Aktionen

| Aktion | Beschreibung |
|--------|--------------|
| ▶️ **Up** | Projekt starten (`docker-compose up -d`) |
| ⏹ **Down** | Projekt stoppen (`docker-compose down`) |
| 🔄 **Restart** | Projekt neu starten |
| 📜 **Logs** | Compose-Logs anzeigen |
| 🗑️ **Löschen** | Projekt entfernen (inkl. `down`) |

### Dateiablage

Compose-Dateien werden lokal unter `storage/compose/<name>/docker-compose.yml` gespeichert. Bei Remote-Hosts werden sie nach `/opt/gatecore/compose/<name>/` hochgeladen.

---

## 💻 Interaktive Web-Shell

Die Web-Shell nutzt **WebSocket** (`/ws/docker/shell/:containerName`) und **xterm.js**:

1. Container in der Liste auswählen
2. **Shell** klicken
3. Terminal öffnet sich direkt im Browser

```bash
# Beispiel-Befehle in der Web-Shell
ls -la
cat /etc/os-release
apt-get update
```

---

## 🌐 Multi-Host Docker

Jeder Docker-Befehl kann auf einem beliebigen verbundenen Host ausgeführt werden:

- **Lokale Hosts** → Ausführung via Unix-Socket (`/var/run/docker.sock`)
- **Remote-Hosts** → Ausführung per SSH (mit gespeichertem Schlüssel)

---

## 🛠️ Direkte Docker-Befehle (SSH)

Remote-Befehle werden wie folgt ausgeführt:

```bash
# Auf dem Remote-Host
docker ps -a
docker logs --tail 200 <container>
docker volume ls
docker compose -f /opt/gatecore/compose/<name>/docker-compose.yml logs
```

---

## 🔗 Verwandte Seiten

- [Features](Features)
- [Hypervisor hinzufügen](Hypervisor-hinzufügen)
- [Storage-Pools](Storage-Pools)
- [Dateiverwaltung](Dateiverwaltung)