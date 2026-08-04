# 📦 Templates

Verfügbare LXC-Templates und ISO-Images für die Container- und VM-Erstellung.

---

## 📋 Übersicht

Die verfügbaren Templates werden in der Datei **`templates.json`** im Projektverzeichnis definiert. Sie werden über die API unter `GET /api/templates` ausgeliefert.

---

## 🧱 LXC-Templates

Aktuell sind folgende Templates in `templates.json` definiert:

| Name | Distro | Version |
|------|--------|---------|
| Debian 12 Bookworm | `debian` | `12` |
| Ubuntu 22.04 LTS Jammy | `ubuntu` | `22.04` |
| Rocky Linux 9 | `rocky` | `9` |
| Alpine Linux 3.19 | `alpine` | `3.19` |

> 📥 Quelle: `https://images.linuxcontainers.org/images/<distro>/<version>/amd64/default/rootfs.tar.xz`

---

## 💿 ISO-Images

| Name | URL |
|------|-----|
| Debian 12 NetInst ISO | `https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-12.5.0-amd64-netinst.iso` |
| Ubuntu Server 22.04 ISO | `https://releases.ubuntu.com/22.04/ubuntu-22.04.4-live-server-amd64.iso` |

---

## 🛠️ Eigene Templates hinzufügen

1. **`templates.json`** öffnen
2. Neuen Eintrag ergänzen

```json
{
  "lxcTemplates": [
    {
      "name": "Meine Custom Distro",
      "distro": "debian",
      "version": "12",
      "url": "https://example.com/my-rootfs.tar.xz"
    }
  ],
  "isoImages": [
    {
      "name": "Mein Custom ISO",
      "url": "https://example.com/my.iso"
    }
  ]
}
```

3. Server neu starten

---

## 🔗 Verwandte Seiten

- [LXC Container](LXC-Container)
- [VMs (KVM)](VMs-KVM)
- [Konfiguration](Konfiguration)