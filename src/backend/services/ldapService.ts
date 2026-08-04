import ldap from 'ldapjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class LDAPService {
  /**
   * Authentifiziert einen Benutzer gegen AD/LDAP
   */
  public static async authenticate(username: string, password: string): Promise<boolean> {
    const config = await prisma.ldapConfig.findFirst({ where: { enabled: true } });
    if (!config) return false;

    return new Promise((resolve) => {
      const client = ldap.createClient({ url: config.url });

      client.bind(config.bindDn, config.bindPassword, (err: any) => {
        if (err) {
          client.unbind();
          return resolve(false);
        }

        const userFilter = config.userFilter.replace('{{username}}', username);
        client.search(config.searchBase, { filter: userFilter, scope: 'sub' }, (searchErr: any, res: any) => {
          if (searchErr) {
            client.unbind();
            return resolve(false);
          }

          let userDn = '';
          res.on('searchEntry', (entry: any) => {
            userDn = entry.dn.toString();
          });

          res.on('end', () => {
            if (!userDn) {
              client.unbind();
              return resolve(false);
            }

            // Bind mit den Benutzer-Zugangsdaten versuchen
            const userClient = ldap.createClient({ url: config.url });
            userClient.bind(userDn, password, (userBindErr: any) => {
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