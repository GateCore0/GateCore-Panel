# ❓ Häufig gestellte Fragen (FAQ)

Antworten auf die häufigsten Fragen zu GateCore.

---

## 🚀 Allgemein

### Was ist GateCore?

GateCore ist eine **Enterprise Infrastructure Management Platform** für die zentrale Verwaltung von Docker, Docker Compose, VMs (KVM), LXC-Containern, Podman, ZFS-Speicher und Hardware-Passthrough – mit einer modernen Proxmox-ähnlichen Web-Oberfläche.

### Ist GateCore kostenlos?

GateCore ist ein Open-Source-Projekt, das auf GitLab gehostet wird.

### Welche Browser werden unterstützt?

Moderne Browser mit ES6+-Unterstützung: Chrome, Firefox, Edge, Safari (aktuelle Versionen).

---

## 🔐 Login & Benutzer

### Wie lauten die Standard-Zugangsdaten?

| Benutzername | Passwort |
|--------------|----------|
| `admin` | `admin` |

> ⚠️ **Wichtig:** Nach dem ersten Login das Passwort ändern!

### Was tun, wenn ich das Admin-Passwort vergessen habe?

Siehe [Fehlerbehebung](Fehlerbehebung#-login-probleme) – das Passwort kann direkt in der Datenbank zurückgesetzt werden.

### Kann ich LDAP/AD-Benutzer verwenden?

Ja! GateCore unterstützt die Authentifizierung gegen LDAP/Active Directory. Siehe [LDAP-Konfiguration](LDAP-Konfiguration).

### Was ist der Unterschied zwischen ADMIN, USER und VIEWER?

- **ADMIN:** Vollzugriff inkl. Benutzerverwaltung und System-Konfiguration
- **USER:** Verwaltung aller Ressourcen
- **VIEWER:** Nur Lesezugriff

---

## 🐳 Docker & Container

### Kann ich mehrere Docker-Hosts verwalten?

Ja. Remote-Hosts können als Hypervisors hinzugefügt werden. Docker-Befehle werden dann per SSH auf dem entfernten Host ausgeführt.

### Kann ich Docker Compose verwenden?

Ja. Compose-Projekte können über das Web-Interface erstellt und verwaltet werden (`up`, `down`, `restart`, Logs).

### Warum kann ich einen Compose-Container nicht bearbeiten?

Container, die von Docker Compose verwaltet werden, sind geschützt. Änderungen müssen in der `docker-compose.yml` erfolgen.

### Wie bekomme ich eine Shell in einen Container?

Im Bereich **Docker & Compose** den Container auswählen und **Shell** klicken. Eine interaktive Web-Shell öffnet sich im Browser (WebSocket + xterm.js).

---

## 🖥️ Hypervisor & Remote-Hosts

### Welche Betriebssysteme werden unterstützt?

- Debian
- Ubuntu
- Rocky Linux
- Alma Linux
- Fedora

### Benötige ich Root-Zugriff auf die Remote-Hosts?

Ja. Für die Provisionierung (Paketinstallation, Docker-Setup) ist Root-Zugriff (SSH) erforderlich.

### Wie wird der SSH-Zugang eingerichtet?

GateCore generiert automatisch einen RSA-4096-Schlüssel und trägt den Public Key in `~/.ssh/authorized_keys` des Ziel-Hosts ein.

### Was passiert beim Löschen eines Hosts?

Der DB-Eintrag wird entfernt. Die bereits installierten Pakete und SSH-Keys auf dem Remote-Host bleiben bestehen.

---

## 💾 Storage & ZFS

### Welche RAID-Level werden unterstützt?

Stripe, Mirror, RAIDZ1, RAIDZ2 und RAIDZ3.

### Was passiert beim Löschen eines ZFS-Pools?

Nur der DB-Eintrag wird gelöscht. Der tatsächliche ZFS-Pool bleibt bestehen und muss manuell per `zpool destroy <poolname>` entfernt werden.

### Kann ich Festplatten formatieren?

Ja. Unterstützte Dateisysteme: ext4, XFS, ZFS.

> ⚠️ **Achtung Datenverlust!**

---

## 📊 Monitoring

### Wie oft werden Metriken gespeichert?

Alle 60 Sekunden wird ein Snapshot gespeichert. Die Historie umfasst **48 Stunden**.

### Welche Metriken werden erfasst?

CPU, RAM, Festplatten, Netzwerk, Uptime, OS-Info und Top-Prozesse.

---

## 🛡️ Sicherheit

### Ist GateCore standardmäßig HTTPS-verschlüsselt?

Nein. Für Produktionsumgebungen wird ein Reverse-Proxy mit TLS empfohlen (z.B. Caddy, nginx, Traefik).

### Warum läuft GateCore im privileged Docker-Modus?

Der privilegierte Modus ist für den Zugriff auf Docker-Socket, `/dev`, `/sys` und `/run/udev` erforderlich – notwendig für Hardware-Passthrough, Festplatten und Hypervisor-Funktionen.

### Bietet GateCore Zwei-Faktor-Authentifizierung (2FA)?

Aktuell ist 2FA nicht implementiert.

---

## 🔧 Probleme

### Das Web-Interface lädt nicht

1. Docker-Status prüfen: `docker compose ps`
2. Logs ansehen: `docker logs -f gatecore-server`
3. Port 3001 erreichbar? `curl http://localhost:3001`

### Die App ist langsam

- CPU-/RAM-Auslastung prüfen
- Viele Hosts/Container verlangsamen das Dashboard
- Metrik-Historie in der DB kann wachsen (`SystemMetricHistory`)

---

## 🔗 Verwandte Seiten

- [Fehlerbehebung](Fehlerbehebung)
- [Schnellstart](Schnellstart)
- [Sicherheit](Sicherheit)