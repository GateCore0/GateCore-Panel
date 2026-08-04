# 🔒 Sicherheit

Sicherheitskonzept und Best Practices für GateCore.

---

## 🔐 Authentifizierung

| Aspekt | Implementierung |
|--------|----------------|
| **Passwort-Hashing** | bcrypt (Lokale Benutzer) |
| **Session-Token** | JWT (JSON Web Token) |
| **Token-Laufzeit** | 24 Stunden |
| **Token-Speicherung** | httpOnly Cookie (`gatecore_token`) |
| **Token-Typ** | HS256 (HMAC + JWT_SECRET) |
| **LDAP/AD** | Optionaler Login-Fallback |

### Ablauf

```
POST /api/auth/login
  → Passwort-Prüfung (bcrypt) oder LDAP/AD
  → JWT wird signiert (24h)
  → Token als httpOnly-Cookie gesetzt
  → Jede API-Anfrage prüft Authorization-Header oder Cookie
```

---

## 🎭 Rollen & Zugriffskontrolle

| Rolle | Zugriff |
|-------|---------|
| `ADMIN` | Vollzugriff inkl. Benutzer-/LDAP-/Cluster-Verwaltung |
| `USER` | Verwaltung aller Ressourcen, keine Benutzerverwaltung |
| `VIEWER` | Nur Lesezugriff |

---

## 🛡️ Empfohlene Sicherheitsmaßnahmen

### 1. JWT_SECRET ändern

> ⚠️ Der Standardwert `gatecore-super-secret-key` **muss** geändert werden!

```bash
# Zufälligen Secret erzeugen
openssl rand -base64 48
```

In `.env` oder `docker-compose.yml` setzen:

```env
JWT_SECRET=mein-langer-zufaelliger-secret
```

### 2. Standard-Passwort ändern

Nach dem ersten Login sofort `admin` / `admin` ändern!

### 3. LDAP-Passwörter

- LDAP-Bind-Passwort wird in der Datenbank gespeichert
- Zugriff nur für `ADMIN`

### 4. Docker-Socket schützen

- `/var/run/docker.sock` Bereitstellung nur für vertrauenswürdige Container
- GateCore läuft mit `privileged: true` – Zugriff beschränken!

### 5. SSH-Keys

- RSA-4096-Schlüssel werden generiert
- Zugriff auf `.ssh/` Verzeichnis einschränken (`chmod 600`)

---

## ⚠️ Bekannte Risiken & Einschränkungen

| Risiko | Beschreibung |
|--------|-------------|
| **HTTPS** | Standard-Deployment nutzt HTTP. Für Produktion Reverse-Proxy mit TLS empfohlen |
| **privileged Container** | Bietet vollen Host-Zugriff. Nur auf dedizierten Systemen betreiben |
| **Kein Rate-Limiting** | Login-Endpoint hat aktuell kein Brute-Force-Schutz |
| **Keine 2FA** | Zwei-Faktor-Authentifizierung ist nicht implementiert |

---

## 🔒 Deployment-Härtung

### Empfohlene Docker-Compose-Härtung

```yaml
services:
  gatecore-app:
    # Statt 0.0.0.0 nur auf localhost binden, falls Reverse-Proxy genutzt wird
    ports:
      - "127.0.0.1:3001:3000"
```

### Reverse-Proxy mit HTTPS (Beispiel Caddy)

```yaml
# Caddyfile
gatecore.example.com {
    reverse_proxy 127.0.0.1:3001
}
```

---

## 🔗 Verwandte Seiten

- [Benutzerverwaltung](Benutzerverwaltung)
- [LDAP-Konfiguration](LDAP-Konfiguration)
- [Konfiguration](Konfiguration)
- [FAQ](FAQ)