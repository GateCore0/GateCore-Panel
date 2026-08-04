# 📁 Dateiverwaltung

GateCore bietet eine integrierte Dateiverwaltung für Hosts und Docker-Container.

---

## 🖥️ Host-Dateisystem

### Lokal (Panel-Server)

Über den Agent-Container `gatecore-host-access` wird das Dateisystem des Docker-Hosts durchsuchbar gemacht. Der Agent mountet `/` des Hosts unter `/host` in einen Alpne-Container.

### Remote (per SSH)

Dateien werden direkt über SSH auf dem entfernten Host gelesen, bearbeitet und gelöscht.

### Unterstützte Aktionen

| Aktion | Beschreibung |
|--------|--------------|
| 📂 **Auflisten** | `ls -la` auf dem Ziel-Host |
| 📄 **Lesen** | Dateiinhalt als Text anzeigen |
| ✏️ **Speichern** | Datei-Inhalt auf dem Host persistieren |
| 🗑️ **Löschen** | Dateien/Ordner rekursiv löschen (`rm -rf`) |

---

## 📦 Container-Dateisystem

Docker-Container-Dateisysteme können ebenfalls verwaltet werden:

| Aktion | Lokal | Remote |
|--------|-------|--------|
| Auflisten | `docker exec <container> ls` | SSH + `docker exec` |
| Lesen | `docker exec <container> cat` | SSH + `docker exec` |
| Speichern | `docker cp` | SSH + `docker cp` |
| Löschen | `docker exec rm -rf` | SSH + `docker exec` |

---

## 🔗 Verwandte Seiten

- [Docker & Compose](Docker-und-Compose)
- [Hypervisor hinzufügen](Hypervisor-hinzufügen)
- [Features](Features)