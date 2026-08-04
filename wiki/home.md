# 🏠 GateCore Wiki – Willkommen

![GateCore](https://img.shields.io/badge/GateCore-Enterprise%20Infrastructure-orange)

**GateCore** ist eine Proxmox-ähnliche Web-Management-Plattform für die zentrale Verwaltung von:

- 🐳 Docker & Docker Compose
- 🖥️ Virtuellen Maschinen (KVM/QEMU)
- 📦 LXC-Containern
- 🔄 Podman-Containern
- 💾 ZFS-Speicherpools
- 🔌 Hardware-Passthrough (PCIe & USB)
- 🌐 Multi-Host-Clustern

---

## 📚 Wiki-Übersicht

| Bereich | Seite |
|---------|-------|
| **Einführung** | [Über GateCore](Überblick) · [Architektur](Architektur) · [Features](Features) |
| **Installation** | [Installation](Installation) · [Docker-Compose](Docker-Deployment) · [Konfiguration](Konfiguration) |
| **Erste Schritte** | [Schnellstart](Schnellstart) · [Standard-Login](Schnellstart#-standard-login) |
| **Benutzer & Sicherheit** | [Benutzerverwaltung](Benutzerverwaltung) · [LDAP/AD](LDAP-Konfiguration) · [Sicherheit](Sicherheit) |
| **Ressourcen** | [Hypervisor hinzufügen](Hypervisor-hinzufügen) · [Docker & Compose](Docker-und-Compose) · [VMs (KVM)](VMs-KVM) · [LXC Container](LXC-Container) · [Podman](Podman) |
| **Storage** | [ZFS-Speicher](ZFS-Speicher) · [Storage-Pools](Storage-Pools) · [Festplatten](Festplatten) |
| **Hardware** | [Hardware-Passthrough](Hardware-Passthrough) |
| **Dateien** | [Dateiverwaltung](Dateiverwaltung) |
| **Monitoring** | [Monitoring](Monitoring) |
| **Cluster** | [Cluster-Nodes](Cluster-Nodes) |
| **Entwicklung** | [Entwicklung](Entwicklung) · [API-Referenz](API-Referenz) · [Projektstruktur](Projektstruktur) |
| **Weiteres** | [Templates](Templates) · [Fehlerbehebung](Fehlerbehebung) · [FAQ](FAQ) · [Changelog](Changelog) · [Roadmap](Roadmap) |

---

## 🚀 Schnellstart

```bash
# Repository klonen
git clone https://gitlab.com/gatecore/Gatecore-Panel.git
cd GateCore

# Build & Start
docker compose up --build -d
```

Die Anwendung ist danach erreichbar unter: **http://localhost:3001**

| Login | Wert |
|-------|------|
| Benutzername | `admin` |
| Passwort | `admin` |

> ⚠️ **Wichtig:** Nach dem ersten Login das Standard-Passwort ändern!

---

## 🎨 Farbschema & UI

- **Primärfarbe:** Orange `#FF6B00` × Lila `#7C3AED`
- **Modi:** Dark & Light Mode
- **Sprachen:** Deutsch & Englisch
- **Layout:** Proxmox-ähnliche Sidebar-Navigation

---

*Letzte Aktualisierung: August 2026*