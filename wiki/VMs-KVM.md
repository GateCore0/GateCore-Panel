# 🖥️ Virtuelle Maschinen (KVM/QEMU)

Anleitung zur Erstellung und Verwaltung von VMs über GateCore.

---

## 📋 Voraussetzungen

Damit VMs erstellt werden können, muss ein Ziel-Host verbunden sein (lokal oder remote):

- **Lokaler Host:** KVM/QEMU muss auf dem Panelserver installiert sein
- **Remote-Host:** Host mit dem Zweck `VM_KVM` oder `ALL_IN_ONE` hinzufügen
- Tools auf dem Ziel-Host: `qemu-kvm`, `libvirt`, `virt-install`, `qemu-img`

---

## ✨ VM erstellen

Im Bereich **VMs / LXC** → **VM Erstellen**:

| Feld | Beschreibung |
|------|-------------|
| **Host** | Ziel-Hypervisor (Remote-Host) |
| **Name** | Eindeutiger VM-Name |
| **vCPUs** | Anzahl der virtuellen CPUs |
| **Speicher (MB)** | RAM in Megabyte |
| **Disk Größe (GB)** | Festplattengröße in Gigabyte |
| **Speicher Pfad** | Verzeichnis für die VM-Disk (z.B. Storage-Pool) |

### Ablauf im Hintergrund

```
1. qemu-img create -f qcow2 <storpath>/<name>.qcow2 <size>G
2. virt-install --name <name> --ram <mb> --vcpus <n>
   --disk path=<img> --import --noautoconsole --graphics vnc
3. VM wird in der Datenbank als RUNNING gespeichert
```

---

## 🖧 VM-Aktionen

| Aktion | Beschreibung |
|--------|--------------|
| ▶️ **Start** | VM starten |
| ⏹ **Stop** | VM stoppen |
| 🔄 **Restart** | VM neu starten |
| 🗑️ **Löschen** | VM entfernen (DB-Eintrag) |

> Hinweis: Die VM-Disk (`qcow2`) bleibt beim Löschen des DB-Eintrags auf dem Host bestehen und muss manuell entfernt werden.

---

## 📊 VM-Eigenschaften

| Eigenschaft | Typ | Beispiel |
|-------------|-----|---------|
| Name | String | `webserver-01` |
| vCPUs | Int | `4` |
| Arbeitsspeicher | Int (MB) | `8192` |
| Disk-Größe | Int (GB) | `100` |
| Storage-Pfad | String | `/mnt/vm-storage` |
| Status | String | `RUNNING` / `STOPPED` |

---

## 🔗 Verwandte Seiten

- [Hypervisor hinzufügen](Hypervisor-hinzufügen)
- [LXC Container](LXC-Container)
- [Storage-Pools](Storage-Pools)