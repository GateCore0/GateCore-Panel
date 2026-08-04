# 📦 LXC Container

Anleitung zur Verwaltung von LXC-Containern in GateCore.

---

## 📋 Was ist LXC?

LXC (Linux Containers) ist eine Betriebssystem-Virtualisierung, die mehrere isolierte Linux-Systeme auf einem einzigen Host ausführt – ohne die Overhead einer vollständigen VM.

---

## 📦 Container erstellen

Im Bereich **VMs / LXC** → **LXC Erstellen**:

| Feld | Beschreibung |
|------|-------------|
| **Host** | Ziel-Hypervisor |
| **Name** | Eindeutiger Containername |
| **Template** | Basis-Template (z.B. `debian`) |
| **Speicher (MB)** | RAM-Zuweisung |
| **Speicher Pfad** | Verzeichnis für das Root-Filesystem (z.B. Storage-Pool) |

### Ablauf im Hintergrund

```
lxc-create -n <name> -t <template> -- dir=<storagePath>
```

Der Container wird danach in der Datenbank mit Status `RUNNING` gespeichert.

---

## 📚 Verfügbare Templates

Die verfügbaren Templates werden über `templates.json` definiert (siehe [Templates](Templates)):

| Distro | Version |
|--------|---------|
| Debian | 12 Bookworm |
| Ubuntu | 22.04 LTS Jammy |
| Rocky Linux | 9 |
| Alpine Linux | 3.19 |

> Die Templates werden von `images.linuxcontainers.org` bezogen und können in `templates.json` erweitert werden.

---

## 🖧 Container-Aktionen

| Aktion | Beschreibung |
|--------|--------------|
| ▶️ **Start** | LXC-Container starten |
| ⏹ **Stop** | LXC-Container stoppen |
| 🔄 **Restart** | LXC-Container neu starten |
| 🗑️ **Löschen** | LXC-Container entfernen (DB-Eintrag) |

---

## 📊 Eigenschaften

| Eigenschaft | Typ | Beispiel |
|-------------|-----|---------|
| Name | String | `app-container` |
| Template | String | `debian` |
| Speicher | Int (MB) | `2048` |
| Storage-Pfad | String | `/var/lib/lxc` |
| Status | String | `RUNNING` / `STOPPED` |

---

## 🔗 Verwandte Seiten

- [Hypervisor hinzufügen](Hypervisor-hinzufügen)
- [Templates](Templates)
- [VMs (KVM)](VMs-KVM)