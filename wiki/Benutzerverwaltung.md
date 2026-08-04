# 👥 Benutzerverwaltung

Verwaltung von Benutzern, Rollen und Passwörtern in GateCore.

---

## 👤 Benutzerkonten

Benutzer können lokal in der Datenbank angelegt werden. Passwörter werden mit **bcrypt** gehasht gespeichert.

### Benutzer anlegen

Im Bereich **Benutzer & LDAP** → **Benutzer Hinzufügen**:

| Feld | Beschreibung |
|------|-------------|
| **Benutzername** | Eindeutiger Login-Name |
| **Passwort** | Passwort (min. Empfehlung: 12 Zeichen) |
| **Rolle** | ADMIN, USER oder VIEWER |

### Benutzer löschen

1. Benutzer aus der Tabelle auswählen
2. **Löschen** klicken

> ⚠️ Der aktuell angemeldete Benutzer kann nicht gelöscht werden.

---

## 🎭 Rollen & Berechtigungen

| Rolle | Beschreibung |
|-------|-------------|
| **ADMIN** | Vollzugriff: Benutzer verwalten, Hosts hinzufügen, Docker/VM/LXC/Storage verwalten, System-Konfiguration |
| **USER** | Standard-Benutzer: Ressourcen verwalten (Docker, VMs, LXC, Storage), aber keine Benutzerverwaltung |
| **VIEWER** | Nur-Lese-Zugriff: Dashboard, Status, Logs und Monitoring ansehen |

---

## 🔑 Passwort ändern

Im Bereich **Benutzer & LDAP** → **Passwort Ändern**:

| Feld | Beschreibung |
|------|-------------|
| **Aktuelles Passwort** | Zur Verifizierung |
| **Neues Passwort** | Neues Passwort |
| **Passwort bestätigen** | Wiederholung |

> 💡 **Empfehlung:** Nach dem ersten Login das Standard-Passwort (`admin`) sofort ändern!

---

## 🏷️ Berechtigungen nach Rolle

| Funktion | ADMIN | USER | VIEWER |
|----------|:-----:|:----:|:------:|
| Dashboard | ✅ | ✅ | ✅ |
| Docker & Compose | ✅ | ✅ | 👁️ |
| Hypervisors | ✅ | ✅ | 👁️ |
| VMs / LXC | ✅ | ✅ | 👁️ |
| Podman | ✅ | ✅ | 👁️ |
| ZFS & Storage | ✅ | ✅ | 👁️ |
| Hardware-Passthrough | ✅ | ✅ | 👁️ |
| Dateiverwaltung | ✅ | ✅ | 👁️ |
| Benutzerverwaltung | ✅ | ❌ | ❌ |
| LDAP-Konfiguration | ✅ | ❌ | ❌ |
| Cluster-Nodes | ✅ | ❌ | ❌ |
| Monitoring | ✅ | ✅ | ✅ |

👁️ = Nur Lesen

---

## 🔗 Verwandte Seiten

- [LDAP-Konfiguration](LDAP-Konfiguration)
- [Sicherheit](Sicherheit)
- [Konfiguration](Konfiguration)