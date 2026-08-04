# 🔌 Hardware-Passthrough

Anleitung zum Durchreichen (Passthrough) von PCIe- und USB-Geräten an VMs, Container und Podman in GateCore.

---

## 📋 Was ist Hardware-Passthrough?

Hardware-Passthrough erlaubt es, physische Geräte (z.B. Grafikkarten, NVMe-SSDs, USB-Geräte) direkt an einen Gast (VM, LXC, Docker, Podman) durchzureichen – für maximale Leistung und direkten Hardware-Zugriff.

---

## 🖥️ Unterstützte Gast-Typen

| Gast-Typ | Beschreibung |
|----------|--------------|
| `VM` | Virtuelle Maschine (KVM/QEMU) |
| `LXC` | LXC-Container |
| `DOCKER` | Docker-Container |
| `PODMAN` | Podman-Container |

---

## 🔍 Hardware erkennen

Im Bereich **Hardware Passthrough**:

1. **Host auswählen** – (PCIe- und USB-Geräte werden erkannt)
2. **Hardware laden** klicken
3. Alle PCIe- & USB-Geräte erscheinen in der Liste

### Erkennung

- **PCIe:** via `lspci` (Fallback: `/sys/bus/pci/devices`)
- **USB:** via `lsusb` (Fallback: `/sys/bus/usb/devices`)

---

## ➕ Passthrough zuweisen

| Feld | Beschreibung |
|------|-------------|
| **Typ** | `PCIE` oder `USB` |
| **Geräte ID** | Z.B. PCI-Adresse `00:1f.2` oder USB `8087:8000` |
| **Beschreibung** | Freitext (z.B. "NVIDIA GPU") |
| **Gast Typ** | VM, LXC, DOCKER oder PODMAN |
| **Gast ID** | ID des Ziel-Gasts |
| **Host** | Host, auf dem das Gerät angeschlossen ist |

---

## 🗑️ Passthrough entfernen

1. Zuweisung in der Liste auswählen
2. **Löschen** klicken
3. Der DB-Eintrag wird entfernt

---

## ⚠️ Hinweise

> ⚠️ Für PCIe-Passthrough wird **IOMMU/VT-d** auf dem Host benötigt.

> ⚠️ Hardware-Passthrough erfordert `privileged` Container-Zugriff auf `/dev`.

> 💡 Die tatsächliche Geräte-Zuweisung an den Gast muss auf Hypervisor-Ebene erfolgen.

---

## 🔗 Verwandte Seiten

- [Features](Features)
- [VMs (KVM)](VMs-KVM)
- [LXC Container](LXC-Container)
- [Festplatten](Festplatten)