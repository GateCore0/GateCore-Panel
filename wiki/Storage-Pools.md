# 🗄️ Storage-Pools

Anleitung zur Verwaltung von Storage-Pools in GateCore.

---

## 📋 Was ist ein Storage-Pool?

Ein Storage-Pool ist ein definierter Speicherort auf einem Host, der einem bestimmten Zweck zugeordnet ist – z.B. für ISO-Images, Docker-Images, VM-Disks oder Container-Templates.

---

## 📂 Pool-Typen

| Typ | Zweck |
|-----|-------|
| `ISO` | ISO-Images für VMs |
| `DOCKER_IMAGE` | Docker-Images |
| `LXC_TEMPLATE` | LXC-Container-Templates |
| `PODMAN_IMAGE` | Podman-Images |
| `DOCKER_COMPOSE` | Docker-Compose-Dateien |
| `VM_DISK` | VM-Festplatten (QCOW2) |
| `DOCKER_VOLUME` | Docker-Volumes (mit Host-Pfad) |

---

## 📦 Storage-Pool erstellen

Im Bereich **Speicher Pools & ZFS** → **Speicher Pool Erstellen**:

| Feld | Beschreibung |
|------|-------------|
| **Name** | Eindeutiger Pool-Name |
| **Typ** | Einer der 7 Pool-Typen |
| **Pfad** | Verzeichnis auf dem Host |
| **Host** | Ziel-Host |

### Docker-Volumes

Bei `DOCKER_VOLUME` wird automatisch das Verzeichnis auf dem Host angelegt:

```bash
mkdir -p /var/lib/docker/volumes/<name>/_data
```

> 💡 Docker-Volumes aus einem Pool werden als Bind-Mount in Container eingebunden.

---

## 🗑️ Storage-Pool löschen

1. Pool auswählen → **Löschen**
2. DB-Eintrag wird entfernt

> ⚠️ Das Verzeichnis auf dem Host bleibt bestehen und muss manuell entfernt werden.

---

## 🔗 Verwandte Seiten

- [ZFS-Speicher](ZFS-Speicher)
- [Festplatten](Festplatten)
- [Docker & Compose](Docker-und-Compose)