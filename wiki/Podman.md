# 🔄 Podman

Anleitung zur Verwaltung von Podman-Containern in GateCore.

---

## 📋 Was ist Podman?

Podman ist eine **daemon-lose Container-Engine** – Docker-kompatibel, aber ohne zentralen Daemon. Container werden direkt als Kindprozesse von Podman ausgeführt.

> **Vorteile:** Mehr Sicherheit (rootless möglich), systemd-Integration (`podman generate systemd`), weniger Angriffsfläche.

---

## 📦 Podman-Container erstellen

Im Bereich **Podman** → **Podman Erstellen**:

| Feld | Beschreibung |
|------|-------------|
| **Host** | Ziel-Hypervisor |
| **Name** | Eindeutiger Containername |
| **Image** | Container-Image (z.B. `nginx:latest`) |

### Ablauf im Hintergrund

```
podman run -d --name <name> <image>
```

Der Container wird danach in der Datenbank mit Status `RUNNING` gespeichert.

---

## 🖧 Container-Aktionen

| Aktion | Beschreibung |
|--------|--------------|
| ▶️ **Start** | Podman-Container starten |
| ⏹ **Stop** | Podman-Container stoppen |
| 🔄 **Restart** | Podman-Container neu starten |
| 🗑️ **Löschen** | Podman-Container entfernen (DB-Eintrag) |

---

## 📊 Eigenschaften

| Eigenschaft | Typ | Beispiel |
|-------------|-----|---------|
| Name | String | `web-podman` |
| Image | String | `nginx:alpine` |
| Host | Relation | Host-ID |
| Status | String | `RUNNING` / `STOPPED` |

---

## 🔗 Verwandte Seiten

- [Hypervisor hinzufügen](Hypervisor-hinzufügen)
- [Docker & Compose](Docker-und-Compose)
- [Features](Features)