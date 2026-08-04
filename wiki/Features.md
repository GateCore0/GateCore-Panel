# ✨ Features

Eine vollständige Übersicht aller Funktionen von GateCore.

---

## 🐳 Docker & Compose

| Funktion | Beschreibung |
|----------|--------------|
| **Container erstellen** | Docker-Container mit Name, Image, Volume & Mount-Pfad anlegen und starten |
| **Container verwalten** | Start, Stop, Neustart, Löschen |
| **Live-Logs** | Container-Logs in Echtzeit ansehen |
| **Container-Konfiguration** | Ports & Volumes nachträglich ändern (Container-Recreate) |
| **Compose-Projekte** | `docker-compose.yml` hochladen, starten, stoppen, Logs ansehen |
| **Volumes** | Docker-Volumes erstellen, auflisten, umbenennen und löschen |
| **Interaktive Web-Shell** | WebSocket-basierte Shell direkt im Browser (xterm.js) |
| **Multi-Host Docker** | Docker-Befehle auf beliebigen verbundenen Hosts ausführen |

### Container-Config bearbeiten

Über die API kann die Konfiguration eines **einzelnen** Containers verändert werden:
- Ports freigeben oder blockieren
- Volumes hinzufügen oder entfernen

> ⚠️ Container, die von **Docker Compose** verwaltet werden, sind geschützt – deren Konfiguration muss in der `docker-compose.yml` geändert werden.

---

## 🖥️ Hypervisor-Management

| Funktion | Beschreibung |
|----------|--------------|
| **Remote-Hosts anbinden** | Per SSH hinzufügen (Debian, Ubuntu, Rocky Linux, Alma Linux, Fedora) |
| **SSH-Key-Generierung** | Automatisch RSA-4096-Schlüssel erzeugen & installieren |
| **Passwortloses Login** | Public Key wird in `~/.ssh/authorized_keys` eingetragen |
| **Automatische Provisionierung** | Installation von ZFS, QEMU/KVM, LXC, Podman, Docker |
| **VMs (KVM/QEMU)** | Virtuelle Maschinen mit vCPU, RAM, Disk-Größe erstellen |
| **LXC-Container** | Leichtgewichtige Container aus Templates (Debian, Ubuntu, Rocky, Alpine) |
| **Podman-Container** | Daemon-lose Container erstellen & verwalten |
| **Status-Verwaltung** | Hosts als ONLINE/OFFLINE überwachen |

---

## 💾 Storage & ZFS

| Funktion | Beschreibung |
|----------|--------------|
| **ZFS-Pools** | Erstellen mit Stripe, Mirror, RAIDZ1, RAIDZ2 oder RAIDZ3 |
| **Festplatten formatieren** | ext4, XFS oder ZFS |
| **Storage-Pools** | Für ISO, Docker Images, LXC Templates, Podman Images, Compose-Dateien, VM Disks, Docker Volumes |
| **Docker-Volumes mit Pfad** | Volume-Verzeichnisse auf dem Host anlegen und verwalten |

### ZFS RAID-Level

| Level | Mindest-Disks | Beschreibung |
|-------|---------------|--------------|
| **Stripe** | 1 | Kein Schutz, maximale Kapazität |
| **Mirror** | 2 | 1:1 Spiegelung |
| **RAIDZ1** | 3 | Ein Paritätslaufwerk |
| **RAIDZ2** | 4 | Zwei Paritätslaufwerke |
| **RAIDZ3** | 5 | Drei Paritätslaufwerke |

---

## 🔌 Hardware Passthrough

| Funktion | Beschreibung |
|----------|--------------|
| **PCIe-Passthrough** | PCIe-Geräte an VMs, Docker, Podman oder LXC durchreichen |
| **USB-Passthrough** | USB-Geräte (z.B. über Vendor/Product-ID) zuweisen |
| **Hardware-Erkennung** | Automatische Auflistung aller PCIe- & USB-Geräte via `lspci`/`lsusb` |
| **Fallback-Erkennung** | Funktioniert auch ohne `lspci`/`lsusb` über `/sys` (z.B. im Docker-Container) |

---

## 📁 Dateiverwaltung

| Funktion | Beschreibung |
|----------|--------------|
| **Host-Dateisystem browsen** | Verzeichnisse lokal und remote durchsuchen |
| **Dateien lesen/bearbeiten** | Inhalte ansehen und speichern |
| **Dateien löschen** | Dateien & Ordner rekursiv löschen |
| **Container-Dateisystem** | Dateien in Docker-Containern verwalten (lokal & remote) |
| **Local Host Access** | Zugriff auf das Host-Dateisystem des Docker-Hosts via `gatecore-host-access`-Agent-Container |

---

## 👥 Benutzer & LDAP/AD

| Funktion | Beschreibung |
|----------|--------------|
| **Lokale Benutzer** | Benutzer anlegen, löschen, Passwort ändern |
| **Rollen** | `ADMIN`, `USER`, `VIEWER` |
| **LDAP/Active Directory** | Authentifizierung gegen bestehende Verzeichnisdienste |
| **LDAP-Konfiguration** | Zentrale Konfiguration über das Web-Interface |

---

## 🌐 Cluster

| Funktion | Beschreibung |
|----------|--------------|
| **Cluster-Nodes** | Andere GateCore-Nodes per API-Key verbinden |
| **Multi-Host-Ansicht** | Alle verbundenen Hosts zentral überwachen |
| **Status** | `CONNECTED` / `DISCONNECTED` |

---

## 📊 Monitoring

| Funktion | Beschreibung |
|----------|--------------|
| **CPU-Auslastung** | Aktuelle Auslastung in % inkl. Kerne & Load Average |
| **Arbeitsspeicher** | Gesamt, Belegt, Frei (GB + %) |
| **Festplatten** | Belegung je Mount-Point |
| **Netzwerk** | RX/TX-Bytes je Interface |
| **Uptime** | Tage, Stunden, Minuten |
| **OS-Info** | Name & Version des Betriebssystems |
| **Top-Prozesse** | Prozesse nach CPU-Auslastung |
| **Metrik-Verlauf** | 48-Stunden-Historie (alle 60 Sekunden ein Snapshot) |

---

## 🖥️ UI & Benutzerfreundlichkeit

- **Proxmox-ähnliche Navigation** – Sidebar mit allen Ressourcen-Bereichen
- **Dark/ Light Mode** – Umschaltbar per Klick (Cookie-basiert)
- **Mehrsprachig** – Deutsch & Englisch
- **Responsive Design** – Tailwind CSS basiert
- **Orange × Lila Farbschema** – `#FF6B00` × `#7C3AED`

---

## 🔗 Verwandte Seiten

- [Überblick](Überblick)
- [Architektur](Architektur)
- [Schnellstart](Schnellstart)