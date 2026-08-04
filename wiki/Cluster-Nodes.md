# 🌐 Cluster-Nodes

Anleitung zur Verbindung mehrerer GateCore-Instanzen zu einem Cluster.

---

## 📋 Was ist ein Cluster-Node?

Ein Cluster-Node ist eine **weitere GateCore-Instanz**, die über einen API-Key mit deiner Haupt-Instanz verbunden wird. Dies ermöglicht die zentrale Verwaltung mehrerer Standorte oder Umgebungen.

---

## ➕ Node verbinden

Im Bereich **Cluster Nodes** → **Node Hinzufügen**:

| Feld | Beschreibung |
|------|-------------|
| **Name** | Anzeigename des entfernten Nodes |
| **URL** | Basis-URL des entfernten GateCore-Servers |
| **API-Key** | API-KEY des entfernten Nodes |

---

## 🔑 API-Keys

Für die Kommunikation mit Cluster-Nodes wird ein **API-Key** benötigt.

### API-Key abrufen

Jeder GateCore-Server stellt seinen eigenen API-Key bereit (in den Node-Einstellungen).

### Verbindung testen

```bash
curl -X POST http://<node-url>/api/cluster/nodes/connect \
  -H "Content-Type: application/json" \
  -H "x-api-key: <API_KEY>" \
  -d '{"name":"My-Node","url":"http://my-node:3000"}'
```

---

## 🖧 Verbindungsstatus

| Status | Bedeutung |
|--------|-----------|
| **CONNECTED** | Node ist erreichbar und authentifiziert |
| **DISCONNECTED** | Node ist nicht erreichbar oder der API-Key ist ungültig |

---

## 🧩 Vorteile eines Clusters

- 🌍 **Zentrale Verwaltung** mehrerer Standorte
- 🔄 **Redundanz** – Ausfallsicherheit bei mehreren Nodes
- 👀 **Einheitliches Monitoring** – Alle Hosts im Überblick

---

## 🔗 Verwandte Seiten

- [Features](Features)
- [Monitoring](Monitoring)
- [Sicherheit](Sicherheit)