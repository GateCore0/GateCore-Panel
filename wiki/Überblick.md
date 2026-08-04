# 📖 Über GateCore

**GateCore** ist eine **Enterprise Infrastructure Management Platform**, die eine zentrale, webbasierte Verwaltung für moderne IT-Infrastrukturen bietet – vergleichbar mit Proxmox, jedoch mit einem Fokus auf Docker, Container-Workloads und Multi-Host-Management.

## 🎯 Zielsetzung

GateCore vereinfacht die Verwaltung komplexer Infrastrukturen, indem es folgende Technologien in einer einzigen Oberfläche vereint:

| Technologie | Zweck |
|-------------|-------|
| **Docker** | Container-Workloads & Microservices |
| **Docker Compose** | Multi-Container-Anwendungen |
| **KVM/QEMU** | Vollvirtualisierte virtuelle Maschinen |
| **LXC** | Leichtgewichtige System-Container |
| **Podman** | Daemon-lose Container-Engine |
| **ZFS** | Enterprise Storage mit RAID-Leveln |
| **LDAP/AD** | Zentralisierte Benutzer-Authentifizierung |

## 👥 Zielgruppe

- **IT-Administratoren**, die mehrere Server/Node zentral verwalten möchten
- **DevOps-Teams**, die Docker & Container-Workloads orchestrieren
- **Homelab-Betreiber** mit Proxmox-ähnlichen Anforderungen
- **Unternehmen**, die eine einheitliche Management-Plattform für VMs, Container und Storage suchen

## ✨ Kernwerte

1. **Einheitliche Verwaltung** – Alles an einem Ort (Docker, VMs, LXC, Podman, ZFS, Dateien)
2. **Multi-Host-Fähigkeit** – Remote-Hosts per SSH anbinden und zentral steuern
3. **Sicherheit** – Rollenbasiertes Zugriffskontrollsystem (ADMIN, USER, VIEWER) + LDAP/AD-Anbindung
4. **Benutzerfreundlich** – Moderne Web-Oberfläche mit Dark/Light Mode, mehrsprachig (DE/EN)
5. **Erweiterbar** – Cluster-Fähigkeit über API-Keys und Templates-System

## 🏗️ Plattform-Übersicht

```
┌─────────────────────────────────────────────────┐
│                  Browser (SPA)                   │
│         React + Vite + Tailwind CSS              │
└────────────────────┬────────────────────────────┘
                     │ HTTP / WebSocket
┌────────────────────▼────────────────────────────┐
│              GateCore Backend                    │
│         Express.js + TypeScript                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Docker  │ │Hypervisor│ │  File Manager    │ │
│  │ Service  │ │ Service  │ │  LDAP Service    │ │
│  └──────────┘ └────┬─────┘ └──────────────────┘ │
│                    │ SSH                         │
│              ┌─────▼─────┐                       │
│              │SSH Service│                       │
│              └───────────┘                       │
└────────┬───────────────────────────┬────────────┘
         │                           │
┌────────▼────────┐        ┌─────────▼────────────┐
│   PostgreSQL    │        │  Remote Hypervisors  │
│   (Prisma ORM)  │        │  (LXC/VM/Docker/…)   │
└─────────────────┘        └──────────────────────┘
```

## 🔗 Verwandte Seiten

- [Architektur](Architektur)
- [Features](Features)
- [Installation](Installation)
- [Schnellstart](Schnellstart)