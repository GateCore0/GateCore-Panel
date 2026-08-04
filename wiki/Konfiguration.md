# ⚙️ Konfiguration

Dieses Dokument beschreibt alle Konfigurationsmöglichkeiten von GateCore.

---

## 🔑 Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `PORT` | `3000` | Port des Backend-Servers |
| `DATABASE_URL` | (aus docker-compose) | PostgreSQL Connection String |
| `JWT_SECRET` | `gatecore-super-secret-key` | Signing-Key für JWT-Tokens |
| `NODE_ENV` | `production` | Umgebung (`development` / `production`) |

### Beispiel `.env`

```env
PORT=3000
DATABASE_URL=postgresql://gatecore:gatecore_password@localhost:5432/gatecore?schema=public
JWT_SECRET=bitte-aendern-ein-langer-sicherer-schluessel
NODE_ENV=production
```

> ⚠️ **Sicherheitsempfehlung:** `JWT_SECRET` immer auf einen eigenen, langen Zufallswert ändern!

---

## 🖥️ UI-Einstellungen

### Dark / Light Mode

- Umschaltung über das Sonnen-/Mond-Icon in der Sidebar
- Wird als **Cookie** gespeichert (`gatecore_darkmode`)
- Standard: **Dark Mode**

### Sprache (Deutsch / Englisch)

- Umschaltung über das **Globus-Icon** in der Sidebar
- Sprachpräferenz wird im Browser gespeichert
- Standard: Browser-Sprache oder Deutsch

---

## 👥 Benutzerverwaltung

### Rollen

| Rolle | Berechtigungen |
|-------|---------------|
| `ADMIN` | Vollzugriff auf alle Bereiche (Benutzer, Hosts, Docker, Storage, ...) |
| `USER` | Standard-Benutzer mit Verwaltungsrechten für Ressourcen |
| `VIEWER` | Nur Lesezugriff |

### Benutzer anlegen

Im Bereich **Benutzer & LDAP** → **Benutzer Hinzufügen**

| Feld | Beschreibung |
|------|-------------|
| Benutzername | Eindeutiger Login-Name |
| Passwort | Passwort (wird gehasht gespeichert via bcrypt) |
| Rolle | ADMIN / USER / VIEWER |

### Passwort ändern

Im Bereich **Benutzer & LDAP** → **Passwort Ändern**

---

## 🔐 LDAP/AD Konfiguration

Siehe ausführlich: [LDAP-Konfiguration](LDAP-Konfiguration)

| Feld | Beschreibung | Beispiel |
|------|-------------|---------|
| **Aktiviert** | LDAP-Authentifizierung ein/aus | ✅ |
| **URL** | LDAP/AD-Serveradresse | `ldap://dc.example.com:389` |
| **Bind DN** | Service-Konto für Verzeichnissuche | `CN=svc-gatecore,OU=Service,DC=example,DC=com` |
| **Bind Passwort** | Passwort des Service-Kontos | — |
| **Search Base** | Basispfad für die Benutzersuche | `OU=Benutzer,DC=example,DC=com` |
| **User Filter** | LDAP-Filter | `(sAMAccountName={{username}})` |

---

## 🐳 Docker-Host-Konfiguration

Beim ersten Start wird automatisch ein **lokaler Docker-Host** (`Docker Host (Panel)`) in der Datenbank angelegt:

- **Name:** `Docker Host (Panel)`
- **IP:** `127.0.0.1`
- **Capability:** `DOCKER`
- **Status:** `ONLINE`
- **isLocal:** `true`

Dieser Host wird für alle lokalen Docker-Operationen verwendet (Container, Volumes, Compose).

---

## 📄 Templates-Konfiguration

Die Datei `templates.json` im Projektstamm definiert verfügbare LXC-Templates und ISO-Images:

```json
{
  "lxcTemplates": [
    {
      "name": "Debian 12 Bookworm",
      "distro": "debian",
      "version": "12",
      "url": "https://images.linuxcontainers.org/images/debian/bookworm/amd64/default/rootfs.tar.xz"
    }
  ],
  "isoImages": [
    {
      "name": "Debian 12 NetInst ISO",
      "url": "https://cdimage.debian.org/debian-cd/current/amd64/iso-cd/debian-12.5.0-amd64-netinst.iso"
    }
  ]
}
```

Eigene Templates/ISO-Images können einfach ergänzt werden. Sie werden über die API unter `GET /api/templates` ausgeliefert.

---

## 🖧 SSH-Konfiguration

- Schlüssel werden im Verzeichnis **`.ssh/`** im Projektstamm abgelegt
- Dateiname: `gatecore_rsa` (privat) + `gatecore_rsa.pub` (öffentlich)
- **Algorithmus:** RSA mit 4096 Bit
- Der Public Key wird bei der Host-Einrichtung in `~/.ssh/authorized_keys` des Ziel-Hosts eingetragen

---

## 🗄️ Datenbank-Konfiguration

### Prisma

- Schema: `prisma/schema.prisma`
- Migrationen: `prisma/migrations/`
- Enthält Modelle für: User, Host, VM, LXC, Podman, Docker, Compose, Storage, ZFS, Passthrough, Metriken, LDAP, Cluster

### Migrationen ausführen

```bash
npx prisma migrate deploy   # Produktion
npx prisma migrate dev      # Entwicklung (erstellt neue Migration)
```

---

## 🔗 Verwandte Seiten

- [Installation](Installation)
- [Docker-Deployment](Docker-Deployment)
- [LDAP-Konfiguration](LDAP-Konfiguration)
- [Sicherheit](Sicherheit)