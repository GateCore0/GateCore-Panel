# 🔐 LDAP/AD Konfiguration

Anleitung zur Einrichtung der LDAP/Active-Directory-Authentifizierung in GateCore.

---

## 📋 Was ist LDAP/AD?

LDAP (Lightweight Directory Access Protocol) und Active Directory (AD) ermöglichen die zentrale Authentifizierung gegen bestehende Verzeichnisdienste. Benutzer können sich mit ihren AD/LDAP-Zugangsdaten direkt an GateCore anmelden.

---

## ⚙️ Konfiguration

Im Bereich **Benutzer & LDAP** → **LDAP-Konfiguration**:

| Feld | Beschreibung | Beispiel |
|------|-------------|---------|
| **Aktiviert** | LDAP-Authentifizierung ein-/ausschalten | ✅ / ❌ |
| **URL** | LDAP/AD-Serveradresse inkl. Protokoll & Port | `ldap://dc.domain.local:389` |
| **Bind DN** | DN des Service-Kontos für die Verzeichnissuche | `CN=gatecore-svc,OU=Service Accounts,DC=domain,DC=local` |
| **Bind Passwort** | Passwort des Service-Kontos | `********` |
| **Search Base** | Basis-OU für die Benutzersuche | `OU=Users,DC=domain,DC=local` |
| **User Filter** | LDAP-Filter zur Benutzeridentifikation | `(sAMAccountName={{username}})` |

---

## 🔍 So funktioniert die LDAP-Authentifizierung

```
1. Benutzer gibt Benutzername & Passwort ein
2. GateCore sucht zuerst in der lokalen Datenbank
3. Falls nicht gefunden → LDAP-Authentifizierung:
   a. Verbindung zum LDAP-Server aufbauen (ldapjs)
   b. Mit Bind-DN + Bind-Passwort authentifizieren
   c. Benutzer im Verzeichnis suchen (Search Base + User Filter)
   d. Passwort des Benutzers verifizieren
4. Bei Erfolg → JWT-Token wird ausgestellt
```

---

## 🎯 User-Filter

Der User-Filter bestimmt, wie der Benutzername im Verzeichnis gesucht wird:

| Verzeichnis | Filter |
|-------------|--------|
| **Active Directory** | `(sAMAccountName={{username}})` |
| **OpenLDAP** | `(uid={{username}})` |
| **eDirectory** | `(cn={{username}})` |

> `{{username}}` ist der Platzhalter für den eingegebenen Benutzernamen.

---

## 🔒 Ablauf & Fallback

| Szenario | Verhalten |
|----------|-----------|
| Lokaler Benutzer existiert | Lokale Authentifizierung (bcrypt) |
| Lokaler Benutzer existiert nicht | Versuch über LDAP/AD |
| LDAP deaktiviert | Nur lokale Benutzer |
| LDAP-Server nicht erreichbar | Fehlermeldung, lokale Auth bleibt möglich |

---

## ⚠️ Hinweise

- LDAP wird nur verwendet, wenn der Benutzer **nicht** lokal existiert
- Es wird **kein** Benutzer-Account automatisch in der Datenbank angelegt
- LDAPS (`ldaps://`) wird unterstützt
- Für AD über SSL: `ldaps://dc.domain.local:636`

---

## 🔗 Verwandte Seiten

- [Benutzerverwaltung](Benutzerverwaltung)
- [Sicherheit](Sicherheit)
- [Konfiguration](Konfiguration)