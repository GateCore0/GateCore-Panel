# 💾 ZFS-Speicher

Anleitung zur Erstellung und Verwaltung von ZFS-Pools in GateCore.

---

## 📋 Was ist ZFS?

ZFS ist ein **Enterprise-Dateisystem mit Volume-Manager**, das Datenintegrität (Checksummen), Snapshots, Kompression und RAID-Funktionen in einem System vereint.

---

## 📦 ZFS-Pool erstellen

Im Bereich **Speicher Pools & ZFS** → **ZFS Pool Erstellen**:

| Feld | Beschreibung |
|------|-------------|
| **Host** | Ziel-Hypervisor |
| **Pool-Name** | Eindeutiger Pool-Name (z.B. `tank`, `data`) |
| **RAID Level** | Stripe, Mirror, RAIDZ1, RAIDZ2 oder RAIDZ3 |
| **Festplatten** | Liste der Disk-Devices (z.B. `/dev/sdb /dev/sdc`) |

### Beispiel

```bash
zpool create tank mirror /dev/sdb /dev/sdc
zpool create data raidz2 /dev/sdd /dev/sde /dev/sdf /dev/sdg
```

---

## 🔒 RAID-Level im Überblick

| Level | Mindest-Disks | Kapazität | Ausfallsicherheit |
|-------|---------------|-----------|-------------------|
| **Stripe** | 1 | Summe aller Disks | ❌ Keine (Disk-Verlust = Datenverlust) |
| **Mirror** | 2 | 50% | ✅ 1 Disk |
| **RAIDZ1** | 3 | Summe − 1 Disk | ✅ 1 Disk |
| **RAIDZ2** | 4 | Summe − 2 Disks | ✅ 2 Disks |
| **RAIDZ3** | 5 | Summe − 3 Disks | ✅ 3 Disks |

---

## 📊 ZFS-Pools anzeigen

Alle ZFS-Pools werden im Bereich **Speicher Pools & ZFS** mit Host-Zuordnung aufgelistet.

---

## 🗑️ ZFS-Pool löschen

1. Gewünschten Pool auswählen
2. Auf **Löschen** klicken
3. Der DB-Eintrag wird entfernt

> ⚠️ **Achtung:** Beim Löschen des DB-Eintrags wird der tatsächliche ZFS-Pool auf dem Host **nicht** zerstört. Dieser muss manuell per `zpool destroy <poolname>` entfernt werden.

---

## 🔗 Verwandte Seiten

- [Storage-Pools](Storage-Pools)
- [Festplatten](Festplatten)
- [Hypervisor hinzufügen](Hypervisor-hinzufügen)