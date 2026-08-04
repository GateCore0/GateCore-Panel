"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LDAPService = void 0;
const ldapjs_1 = __importDefault(require("ldapjs"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class LDAPService {
    /**
     * Authentifiziert einen Benutzer gegen AD/LDAP
     */
    static async authenticate(username, password) {
        const config = await prisma.ldapConfig.findFirst({ where: { enabled: true } });
        if (!config)
            return false;
        return new Promise((resolve) => {
            const client = ldapjs_1.default.createClient({ url: config.url });
            client.bind(config.bindDn, config.bindPassword, (err) => {
                if (err) {
                    client.unbind();
                    return resolve(false);
                }
                const userFilter = config.userFilter.replace('{{username}}', username);
                client.search(config.searchBase, { filter: userFilter, scope: 'sub' }, (searchErr, res) => {
                    if (searchErr) {
                        client.unbind();
                        return resolve(false);
                    }
                    let userDn = '';
                    res.on('searchEntry', (entry) => {
                        userDn = entry.dn.toString();
                    });
                    res.on('end', () => {
                        if (!userDn) {
                            client.unbind();
                            return resolve(false);
                        }
                        // Bind mit den Benutzer-Zugangsdaten versuchen
                        const userClient = ldapjs_1.default.createClient({ url: config.url });
                        userClient.bind(userDn, password, (userBindErr) => {
                            userClient.unbind();
                            client.unbind();
                            resolve(!userBindErr);
                        });
                    });
                });
            });
        });
    }
}
exports.LDAPService = LDAPService;
