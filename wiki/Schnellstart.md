# ⚡ Schnellstart

In dieser Anleitung startest du GateCore in wenigen Minuten.

---

## Voraussetzungen

- Docker & Docker Compose installiert
- Port `3001` frei

---

## Schritt 1: Repository klonen

```bash
git clone https://gitlab.com/gatecore/Gatecore-Panel.git
cd GateCore
```

## Schritt 2: Container starten

```bash
docker compose up --build -d
```

Dies baut das Backend (Express.js) und das Frontend (React/Vite) in einem Multi-Stage-Dockerfile und startet zusätzlich eine PostgreSQL-Datenbank.

## Schritt 3: Auf das Web-Interface zugreifen

Öffne den Browser:

👉 **http://localhost:3001**

## Schritt 4: Anmelden

| Feld | Wert |
|------|------|
| Benutzername | `admin` |
| Passwort | `admin` |

> ⚠️ **Sicherheitshinweis:** Ändere das Standard-Passwort nach dem ersten Login!

---

## Erste Schritte im Dashboard

Nach dem Login findest du in der Sidebar folgende Bereiche:

| Bereich | Beschreibung |
|---------|--------------|
| **Dashboard** | Übersicht aller Ressourcen & Host-Status |
| **Docker & Compose** | Container, Compose-Projekte, Volumes |
| **Hypervisors** | Remote-Hosts verwalten & hinzufügen |
| **VMs / LXC** | Virtuelle Maschinen und LXC-Container |
| **Podman** | Podman-Container |
| **Speicher Pools & ZFS** | Storage-Pools und ZFS-Pools |
| **Hardware Passthrough** | PCIe/USB-Geräte zuweisen |
| **Dateiverwaltung** | Dateien auf Hosts & Containern bearbeiten |
| **Benutzer & LDAP** | Benutzerverwaltung und LDAP/AD |
| **Cluster Nodes** | Weitere GateCore-Nodes verbinden |
| **Monitoring** | Metriken, Verläufe und Prozesse |

---

## Nächste Schritte

1. ➕ [Hypervisor hinzufügen](Hypervisor-hinzufügen) – Remote-Hosts per SSH anbinden
2. 🐳 [Docker & Compose](Docker-und-Compose) – Ersten Container starten
3. 💾 [ZFS-Speicher](ZFS-Speicher) – Speicherpools anlegen
4. 👥 [Benutzerverwaltung](Benutzerverwaltung) – Benutzer & Rollen erstellen
5. 🔌 [Hardware-Passthrough](Hardware-Passthrough) – Hardware durchreichen

---

## 🔗 Verwandte Seiten

- [Installation](Installation)
- [Docker-Deployment](Docker-Deployment)
- [Konfiguration](Konfiguration)
- [FAQ](FAQ)