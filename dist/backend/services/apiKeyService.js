"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiKeyService = void 0;
const crypto = __importStar(require("crypto"));
/**
 * ApiKeyService
 * -------------------------------------------------
 * Generiert sichere API-Keys für die Cluster-Einrichtung,
 * inklusive Key-Hashing (SHA-256) für die Datenbank,
 * damit Klartext-Keys niemals gespeichert werden.
 */
const KEY_PREFIX = 'gc-api-';
const KEY_BYTES = 32; // 256 Bit Entropie
class ApiKeyService {
    /**
     * Generiert einen neuen zufälligen API-Key:
     *   gc-api-<base64url(32 Bytes)>
     * Beispiel: gc-api-7E3f…-9Qx2
     */
    static generate() {
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
    static hash(plainTextKey) {
        return crypto.createHash('sha256').update(plainTextKey).digest('hex');
    }
    /**
     * Anzeige-Format: gc-api-7E3f…9Qx2
     */
    static preview(plainTextKey) {
        if (plainTextKey.length <= 16)
            return plainTextKey;
        return `${plainTextKey.substring(0, 12)}…${plainTextKey.slice(-6)}`;
    }
    /**
     * Validiert einen eingehenden Key und sucht den passenden ClusterNode.
     * @returns ClusterNode falls gültig, sonst null
     */
    static async validateKey(plainTextKey, prisma) {
        if (!plainTextKey || !plainTextKey.startsWith(KEY_PREFIX))
            return null;
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
exports.ApiKeyService = ApiKeyService;
