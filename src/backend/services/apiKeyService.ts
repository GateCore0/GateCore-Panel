import * as crypto from 'crypto';

/**
 * ApiKeyService
 * -------------------------------------------------
 * Generiert sichere API-Keys für die Cluster-Einrichtung,
 * inklusive Key-Hashing (SHA-256) für die Datenbank,
 * damit Klartext-Keys niemals gespeichert werden.
 */

const KEY_PREFIX = 'gc-api-';
const KEY_BYTES = 32; // 256 Bit Entropie

export interface GeneratedApiKey {
  /** Klartext-Key – wird NUR EINMAL beim Generieren zurückgegeben */
  plainTextKey: string;
  /** SHA-256-Hash für die Datenbank */
  keyHash: string;
  /** Anzeige-Format fürs Frontend (gc-api-xxxx…xxxx) */
  preview: string;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  keyHash: string;
  keyPreview: string;
  lastUsedAt: Date | null;
  createdAt: Date;
  expiresAt: Date | null;
  revoked: boolean;
}

export class ApiKeyService {
  /**
   * Generiert einen neuen zufälligen API-Key:
   *   gc-api-<base64url(32 Bytes)>
   * Beispiel: gc-api-7E3f…-9Qx2
   */
  static generate(): GeneratedApiKey {
    const raw = crypto.randomBytes(KEY_BYTES);
    const encoded = raw.toString('base64url'); // URL-sicher, ohne '=', '+', '/'

    const plainTextKey = `${KEY_PREFIX}${encoded}`;

    return {
      plainTextKey,
      keyHash: ApiKeyService.hash(plainTextKey),
      preview: ApiKeyService.preview(plainTextKey),
    };
  }

  /**
   * SHA-256-Hash eines Keys (für sichere Speicherung).
   */
  static hash(plainTextKey: string): string {
    return crypto.createHash('sha256').update(plainTextKey).digest('hex');
  }

  /**
   * Anzeige-Format: gc-api-7E3f…9Qx2
   */
  static preview(plainTextKey: string): string {
    if (plainTextKey.length <= 16) return plainTextKey;
    return `${plainTextKey.substring(0, 12)}…${plainTextKey.slice(-6)}`;
  }

  /**
   * Validiert einen eingehenden Key und sucht den passenden ClusterNode.
   * @returns ClusterNode falls gültig, sonst null
   */
  static async validateKey(
    plainTextKey: string,
    prisma: any,
  ): Promise<any | null> {
    if (!plainTextKey || !plainTextKey.startsWith(KEY_PREFIX)) return null;

    const keyHash = ApiKeyService.hash(plainTextKey);

    const node = await prisma.clusterNode.findFirst({
      where: {
        apiKeyHash: keyHash,
        revoked: false,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    if (node) {
      // Last-used-Zeitstempel aktualisieren
      await prisma.clusterNode.update({
        where: { id: node.id },
        data: { lastUsedAt: new Date() },
      });
    }

    return node;
  }
}