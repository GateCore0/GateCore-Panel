# ➕ Hypervisor hinzufügen

Diese Anleitung beschreibt, wie du Remote-Hosts als Hypervisors zu GateCore hinzufügst.

---

## 📋 Was ist ein Hypervisor in GateCore?

Ein Hypervisor ist ein Remote-Linux-Host, der über SSH angebunden wird, um folgende Dienste bereitzustellen:

- 🖥️ **VMs** (KVM/QEMU)
- 📦 **LXC-Container**
- 🔄 **Podman-Container**
- 🐳 **Docker-Container**
- 💾 **ZFS-Speicherpools**

---

## ✅ Unterstützte Betriebssysteme

| Distribution | Paketmanager | Installierte Pakete |
|--------------|-------------|--------------------|
| **Debian** | `apt-get` | `zfsutils-linux`, `qemu-kvm`, `libvirt`, `lxc`, `podman`, `docker.io`, `docker-compose` |
| **Ubuntu** | `apt-get` | `zfsutils-linux`, `qemu-kvm`, `libvirt`, `lxc`, `podman`, `docker.io`, `docker-compose` |
| **Rocky Linux** | `dnf` | `zfs`, `qemu-kvm`, `libvirt`, `lxc`, `podman`, `docker`, `docker-compose` |
| **Alma Linux** | `dnf` | `zfs`, `qemu-kvm`, `libvirt`, `lxc`, `podman`, `docker`, `docker-compose` |
| **Fedora** | `dnf` | `zfs`, `qemu-kvm`, `libvirt`, `lxc`, `podman`, `docker`, `docker-compose` |

---

## 🖥️ Hypervisor im Web-UI hinzufügen

### Schritt 1: Bereich "Hypervisors" öffnen

In der Sidebar auf **Hypervisors** klicken.

### Schritt 2: „Hypervisor Hinzufügen" klicken

### Schritt 3: Formular ausfüllen

| Feld | Beschreibung |
|------|-------------|
| **Name** | Anzeigename des Hosts (z.B. `Proxmox-Node-1`) |
| **IP Adresse** | IP-Adresse des Ziel-Hosts |
| **Port** | SSH-Port (Standard: `22`) |
| **Benutzername** | SSH-Benutzer (Standard: `root`) |
| **Passwort** | SSH-Passwort für die Erst-Provisionierung |
| **OS Typ** | Betriebssystem (`debian`, `ubuntu`, `rocky`, `alma`, `fedora`) |
| **Zweck** | Verwendungszweck des Hosts |
| **Zweck-Optionen** | `LXC` · `VM_KVM` · `DOCKER` · `PODMAN` · `ALL_IN_ONE` |

### Schritt 4: Bestätigen

Nach dem Klick auf **Erstellen** läuft automatisch folgender Ablauf:

---

## ⚙️ Automatischer Ablauf beim Hinzufügen

```
1. SSH-Verbindung mit Passwort herstellen (node-ssh)
2. SSH-Key-Paar generieren (RSA 4096 Bit) falls nicht vorhanden
3. Public Key in ~/.ssh/authorized_keys des Ziel-Hosts eintragen
4. Paketinstallation je nach Distro:
   - apt-get/dnf update
   - ZFS, QEMU/KVM, libvirt, LXC, Podman, Docker, ...
5. Bei Docker-Zweck:
   - Docker-Daemon aktivieren (systemctl enable --now docker)
   - GateCore-Agent-Container starten (gatecore-agent)
6. Host wird in der Datenbank als ONLINE gespeichert
```

---

## 🔎 GateCore-Agent-Container

Für Docker-Zwecke wird automatisch ein Agent-Container auf dem Remote-Host gestartet:

```bash
docker run -d \
  --name gatecore-agent \
  --restart always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -p 9090:9090 \
  alpine sleep infinity
```

Dieser Container dient als Platzhalter/Socket-Proxy für die Docker-Kommunikation mit dem Remote-Host.

---

## 🖧 Manuelle Schritte (falls Automatisierung fehlschlägt)

Falls die automatische Provisionierung fehlschlägt, kannst du den Host manuell vorbereiten:

```bash
# 1. SSH-Key des GateCore-Servers kopieren (Public Key in authorized_keys)
mkdir -p ~/.ssh && chmod 700 ~/.ssh
echo "SSH_PUBLIC_KEY_HIER" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 2. Pakete installieren (Beispiel Debian/Ubuntu)
apt-get update
apt-get install -y zfsutils-linux qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils lxc podman docker.io docker-compose curl wget pciutils usbutils

# 3. Docker aktivieren (falls benötigt)
systemctl enable --now docker
```

---

## 🗑️ Host löschen

1. Im Bereich **Hypervisors** den gewünschten Host auswählen
2. Auf **Löschen** klicken
3. Der Host wird aus der Datenbank entfernt

> ⚠️ Hinweis: Beim Löschen wird der Remote-Host **nicht** deinstalliert. Die installierten Pakete und der SSH-Key bleiben bestehen.

---

## 🔗 Verwandte Seiten

- [Features](Features)
- [VMs (KVM)](VMs-KVM)
- [LXC Container](LXC-Container)
- [Podman](Podman)
- [ZFS-Speicher](ZFS-Speicher)