# 📊 Monitoring

Übersicht über die Monitoring-Funktionen von GateCore.

---

## 📋 Überwachte Metriken

| Metrik | Datenquelle | Beschreibung |
|--------|-------------|--------------|
| **CPU** | `/proc/stat` | Auslastung in %, Kerne, Load Average |
| **Arbeitsspeicher** | `free -m` | Gesamt, belegt, frei (GB + %) |
| **Festplatten** | `df -hP` | Belegung je Mount-Point |
| **Netzwerk** | `/proc/net/dev` | RX/TX-Bytes je Interface |
| **Uptime** | `/proc/uptime` | Tage, Stunden, Minuten |
| **OS-Info** | `/etc/os-release` | Name & Version |

---

## ⏱️ Metrik-Verlauf (48h)

- **Intervall:** Alle **60 Sekunden** wird ein Snapshot für jeden Host gespeichert
- **Aufbewahrung:** 48 Stunden
- **Storage:** PostgreSQL (`SystemMetricHistory`)
- **Abruf:** API-Endpoint `GET /api/hosts/:id/metrics/history`

### Beispiel-Datenstruktur

```json
{
  "timestamp": "2026-08-04T10:30:00.000Z",
  "cpu": 23.5,
  "memory": {
    "total": 32648,
    "used": 12490,
    "free": 20158,
    "usagePercent": 38.3
  },
  "disks": [
    { "mount": "/", "total": "97G", "used": "44G", "avail": "49G", "usagePercent": 48 }
  ],
  "network": [
    { "interface": "eth0", "rxBytes": 123456789, "txBytes": 98765432 }
  ],
  "uptime": {
    "days": 12,
    "hours": 5,
    "minutes": 30
  },
  "os": {
    "name": "Debian GNU/Linux",
    "version": "12 (bookworm)"
  }
}
```

---

## 🔝 Top-Prozesse

Die Top-Prozesse nach CPU-Auslastung werden angezeigt:

| Feld | Beschreibung |
|------|-------------|
| **PID** | Prozess-ID |
| **Benutzer** | Prozess-Eigentümer |
| **% CPU** | CPU-Auslastung |
| **% MEM** | Speichernutzung |
| **Befehl** | Ausführbarer Befehl |

---

## 📈 Diagramme & Visualisierung

Im Dashboard und in der Host-Detailansicht werden die Metriken als **Verlaufsdiagramme** dargestellt:
- 📈 CPU-Verlauf (48h)
- 📈 RAM-Verlauf (48h)
- 📈 Netzwerk-Verlauf (48h)

---

## 🔗 Verwandte Seiten

- [Features](Features)
- [Hypervisor hinzufügen](Hypervisor-hinzufügen)
- [Architektur](Architektur)