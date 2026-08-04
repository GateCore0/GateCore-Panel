# 📝 Changelog

Versionierung und Änderungshistorie von GateCore.

---

## 🏷️ Versionierung

GateCore verwendet **Semantic Versioning** (SemVer):

```
MAJOR.MINOR.PATCH
```

- **MAJOR** – Inkompatible Änderungen
- **MINOR** – Neue Features (rückwärtskompatibel)
- **PATCH** – Bugfixes (rückwärtskompatibel)

---

## 📅 Aktuelle Version

| Version | Datum | Beschreibung |
|---------|-------|--------------|
| **1.0.0** | August 2026 | Initiale Veröffentlichung |

---

## 🔄 Änderungshistorie

### v1.0.0 – Initiale Veröffentlichung (August 2026)

#### ✨ Neue Features

**Docker & Compose**
- Docker-Container erstellen, starten, stoppen, neu starten, löschen
- Docker-Container-Konfiguration (Ports & Volumes) bearbeiten
- Docker-Volumes erstellen, umbenennen, löschen
- Compose-Projekte erstellen und verwalten (`up`, `down`, `restart`, Logs)
- Interaktive Web-Shell für Container (WebSocket + xterm.js)

**Hypervisor-Management**
- Remote-Hosts per SSH hinzufügen (Debian, Ubuntu, Rocky, Alma, Fedora)
- Automatische SSH-Key-Generierung (RSA 4096)
- Automatische Provisionierung (ZFS, KVM, LXC, Podman, Docker)
- Host-Status-Überwachung (ONLINE/OFFLINE)

**Virtualisierung**
- VMs (KVM/QEMU) erstellen und verwalten
- LXC-Container aus Templates erstellen
- Podman-Container erstellen und verwalten

**Storage**
- ZFS-Pools erstellen (Stripe, Mirror, RAIDZ1, RAIDZ2, RAIDZ3)
- Storage-Pools für 7 Typen (ISO, Docker, LXC, Podman, Compose, VM, Volume)
- Festplatten formatieren (ext4, XFS, ZFS)
- Festplatten auflisten (lsblk)

**Hardware**
- PCIe- & USB-Hardware-Erkennung (lspci/lsusb, Fallback über /sys)
- Hardware-Passthrough-Zuweisungen (VM, LXC, Docker, Podman)

**Dateiverwaltung**
- Host-Dateisystem browsen, lesen, speichern, löschen (lokal & remote)
- Container-Dateisystem verwalten

**Benutzer & Sicherheit**
- Rollenbasiertes Zugriffskontrollsystem (ADMIN, USER, VIEWER)
- Benutzerverwaltung (anlegen, löschen, Passwort ändern)
- LDAP/Active-Directory-Authentifizierung

**Monitoring**
- System-Metriken (CPU, RAM, Disks, Netzwerk)
- Top-Prozesse
- 48h-Metrik-Verlauf (alle 60 Sekunden)

**Cluster**
- Cluster-Nodes über API-Keys verbinden

**UI**
- Dark/Light Mode
- Mehrsprachig (Deutsch & Englisch)
- Responsive Proxmox-ähnliche Oberfläche

#### 🔧 Datenbank & Migrationen

| Migration | Datum | Inhalt |
|-----------|-------|--------|
| `20240301000000_init` | März 2024 | Initiales Schema (User, Host, VMs, LXC, Podman, Docker, Storage) |
| `20240803000000_docker_hosts_volumes` | August 2024 | Docker-Hosts & Volumes |
| `20260804080726_add_system_metric_history` | August 2026 | System-Metrik-Verlauf (48h) |

---

## 🔗 Verwandte Seiten

- [Features](Features)
- [Entwicklung](Entwicklung)
- [Roadmap](Roadmap)