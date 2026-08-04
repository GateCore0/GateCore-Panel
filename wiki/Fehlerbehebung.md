# 🔧 Fehlerbehebung (Troubleshooting)

Hilfreiche Lösungen für häufige Probleme mit GateCore.

---

## 🚀 Startprobleme

### Container startet nicht

| Symptom | Lösung |
|---------|--------|
| `port is already allocated` | Port 3000 ist bereits belegt. Anderen Port verwenden: `ports: "3001:3000"` |
| `Permission denied` auf Docker-Socket | Docker-User muss zur `docker`-Gruppe gehören oder Container mit Root ausführen |
| `Cannot connect to the Docker daemon` | Docker-Daemon prüfen: `systemctl status docker` |

### Logs ansehen

```bash
docker logs -f gatecore-server
```

### DB-Verbindungsfehler

```bash
# Prüfen, ob PostgreSQL läuft
docker ps | grep gatecore-db

# Verbindung testen
docker exec -it gatecore-server sh
npx prisma migrate status
```

---

## 🔐 Login-Probleme

### Standard-Login funktioniert nicht

1. Prüfen, ob der Server läuft
2. Prüfen, ob die DB erreichbar ist
3. Falls nötig: Benutzer direkt in der DB zurücksetzen

```bash
docker exec -it gatecore-postgres psql -U gatecore -d gatecore
UPDATE "User" SET "password" = '$2a$10$...' WHERE "username" = 'admin';
```

### Nach Passwort-Änderung ausgesperrt

- Passwort direkt in der Datenbank ändern (siehe oben)
- Oder Datenbank-Reset: `docker compose down -v` (⚠️ löscht **alle** Daten)

---

## 🖧 SSH-/Hypervisor-Probleme

### "Host unreachable" beim Hinzufügen

| Check | Befehl |
|-------|--------|
| Ping | `ping <host-ip>` |
| SSH-Port offen | `nc -zv <host-ip> 22` |
| SSH-Dienst läuft | `systemctl status sshd` |

### "Permission denied (publickey)"

1. SSH-Key manuell installieren:
```bash
cat ~/.ssh/gatecore_rsa.pub | ssh root@<host> "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

2. `PermitRootLogin` prüfen:
```bash
grep -E "^PermitRootLogin|^PubkeyAuthentication" /etc/ssh/sshd_config
```

3. SSH-Dienst neu laden:
```bash
systemctl restart sshd
```

### Provisionierung schlägt fehl

- **apt/dnf-Update läuft lange:** Fehler in den Logs prüfen
- **Paket nicht gefunden:** Distribution prüfen (`debian` vs `ubuntu` vs `rocky` unterscheiden sich)
- **Kein Internetzugang:** Paket-Repos erreichbar? `curl -I https://deb.debian.org`

---

## 🐳 Docker-Probleme

### Container wird nicht erstellt

- Image existiert? `docker images`
- Volume existiert? `docker volume ls`
- Logs prüfen: `docker logs <container>`

### "Compose Container protected"

Compose-verwaltete Container können nicht über das Panel bearbeitet werden. Die Konfiguration muss in der `docker-compose.yml` geändert und das Projekt neu gestartet werden.

### Web-Shell verbindet nicht

- WebSocket-Endpoint prüfen: `ws://<host>:3000/ws/docker/shell/<container>`
- Container muss laufen
- Firewall: Port 3000 freigeben

---

## 💾 ZFS-Probleme

### "Pool not found"

```bash
# Auf dem Ziel-Host prüfen
zpool list
```

### Disk wird nicht gefunden

```bash
# Alle Disks anzeigen (Host-System!)
lsblk
ls /dev/sd*
```

---

## 📊 Monitoring-Probleme

### Keine Metriken vorhanden

1. Host-Status prüfen (muss ONLINE sein)
2. Metrik-Service läuft alle 60 Sekunden – kurz warten
3. DB prüfen:

```bash
docker exec -it gatecore-postgres psql -U gatecore -d gatecore
SELECT COUNT(*) FROM "SystemMetricHistory";
```

---

## 🗄️ Datenbank-Probleme

### Migrationen schlagen fehl

```bash
# Prisma-Migrationsstatus prüfen
docker exec -it gatecore-server npx prisma migrate status

# Weitere Migrationen erzwungen
docker exec -it gatecore-server npx prisma migrate deploy
```

### Kompletter Datenbank-Reset

> ⚠️ **ACHTUNG:** Löscht alle Benutzer, Hosts, Container & Metriken!

```bash
docker compose down -v
docker compose up --build -d
# Neuer Standard-Admin: admin / admin
```

---

## 🖥️ Frontend-Probleme

### Leere Seite / White Screen

1. Browser-Konsole öffnen (F12) – Fehler prüfen
2. Cache leeren (Ctrl+Shift+R)
3. API erreichbar? `curl http://localhost:3000/api/auth/me`

### Sprach- oder Dark-Mode-Einstellungen

- Cookies löschen (`gatecore_darkmode`)
- Oder anderen Browser testen

---

## 🔧 Logs & Diagnose

### Alle relevanten Logs

```bash
# App-Logs
docker logs -f gatecore-server

# DB-Logs
docker logs gatecore-postgres

# Alle laufenden Container
docker ps
```

---

## 🔗 Verwandte Seiten

- [Installation](Installation)
- [Docker-Deployment](Docker-Deployment)
- [FAQ](FAQ)
- [Sicherheit](Sicherheit)