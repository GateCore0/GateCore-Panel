# 💿 Festplatten

Anleitung zum Formatieren und Verwalten von Festplatten in GateCore.

---

## 📋 Übersicht

GateCore kann Festplatten auf verbundenen Hosts:

- 🔍 **Auflisten** – Mit Größe, UUID, Modell, Seriennummer & Mount-Points
- ⚙️ **Formatieren** – Als ext4, XFS oder ZFS

---

## 🔍 Festplatten auflisten

Die Festplatten eines Hosts werden über die API abgerufen:

```http
GET /api/hosts/:id/disks
```

### Datenquellen

1. **`lsblk`** (primär) – Liefert detaillierte Informationen als JSON
2. **`/proc/partitions` + `/sys/block`** (Fallback) – Funktioniert auch in Docker-Containern

| Feld | Beschreibung |
|------|-------------|
| `name` | Gerätename (z.B. `sda`, `nvme0n1`) |
| `size` | Größe (z.B. `931.5G`) |
| `type` | `disk` oder `part` |
| `uuid` | Dateisystem-UUID |
| `model` | Festplattenmodell |
| `serial` | Seriennummer |
| `mountpoints` | Gemountete Verzeichnisse |

---

## ⚙️ Festplatte formatieren

Im Bereich **Speicher Pools & ZFS** → **Festplatte Formatieren**:

| Feld | Beschreibung |
|------|-------------|
| **Host** | Ziel-Hypervisor |
| **Gerätepfad** | Z.B. `/dev/sdb` |
| **Dateisystem** | `ext4`, `xfs` oder `zfs` |

### Ausgeführte Befehle

| Dateisystem | Befehl |
|-------------|--------|
| **ext4** | `mkfs.ext4 /dev/sdb -F` |
| **xfs** | `mkfs.xfs /dev/sdb -F` |
| **zfs** | `zpool create -f pool_<timestamp> /dev/sdb` |

---

## ⚠️ Warnungen

> ⚠️ **Datenverlust!** Das Formatieren einer Festplatte löscht **alle Daten** unwiderruflich.

> ⚠️ Vor dem Formatieren sicherstellen, dass das richtige Gerät (`/dev/sdX`) ausgewählt ist!

---

## 🔗 Verwandte Seiten

- [ZFS-Speicher](ZFS-Speicher)
- [Storage-Pools](Storage-Pools)
- [Hardware-Passthrough](Hardware-Passthrough)