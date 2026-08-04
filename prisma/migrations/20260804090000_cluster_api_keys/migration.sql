-- ApikeyService: ClusterNode um sicherere API-Key-Verwaltung erweitern
-- Bestehende Klartext-Keys werden in SHA-256-Hashes umgewandelt (via pgcrypto).

-- pgcrypto-Erweiterung für sha256-Hashing aktivieren (falls verfügbar)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Neue Spalten hinzufügen
ALTER TABLE "ClusterNode"
  ADD COLUMN "apiKeyPreview" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "apiKeyHash"   TEXT,
  ADD COLUMN "revoked"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "description"  TEXT,
  ADD COLUMN "lastUsedAt"   TIMESTAMP(3),
  ADD COLUMN "expiresAt"    TIMESTAMP(3);

-- Bestehende Klartext-Keys in SHA-256-Hashes migrieren
UPDATE "ClusterNode"
SET
  "apiKeyHash" = encode(digest("apiKey", 'sha256'), 'hex'),
  "apiKeyPreview" = CASE
    WHEN length("apiKey") > 16 THEN left("apiKey", 12) || '…' || right("apiKey", 6)
    ELSE "apiKey"
  END
WHERE "apiKey" IS NOT NULL AND "apiKey" <> '';

-- Falls kein Hash generiert werden konnte (z. B. kein pgcrypto): Platzhalter setzen
UPDATE "ClusterNode"
SET "apiKeyHash" = 'legacy-' || md5(random()::text || clock_timestamp()::text)
WHERE "apiKeyHash" IS NULL OR "apiKeyHash" = '';

-- NOT NULL nach Migration setzen
ALTER TABLE "ClusterNode"
  ALTER COLUMN "apiKeyHash" SET NOT NULL;

-- Eindeutige Schlüssel & Indizes
CREATE UNIQUE INDEX "ClusterNode_apiKeyHash_key" ON "ClusterNode"("apiKeyHash");
CREATE INDEX "ClusterNode_status_idx" ON "ClusterNode"("status");

-- Alte Klartext-Spalte entfernen
ALTER TABLE "ClusterNode" DROP COLUMN "apiKey";

-- Migration-Tabelle aktualisieren (optional, falls prisma nicht automatisch schreibt)
-- Die Zeile wird von Prisma Migrate selbst eingetragen.