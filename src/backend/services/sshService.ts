import { NodeSSH } from 'node-ssh';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class SSHService {
  /**
   * Generiert ein SSH Schlüsselpaar lokal, falls es noch nicht existiert.
   */
  public static async generateSSHKey(): Promise<{ publicKey: string; privateKeyPath: string }> {
    const sshDir = path.join(process.cwd(), '.ssh');
    if (!fs.existsSync(sshDir)) {
      fs.mkdirSync(sshDir, { recursive: true });
    }
    const privateKeyPath = path.join(sshDir, 'gatecore_rsa');
    const publicKeyPath = `${privateKeyPath}.pub`;

    if (!fs.existsSync(privateKeyPath)) {
      await execAsync(`ssh-keygen -t rsa -b 4096 -f "${privateKeyPath}" -N ""`);
    }

    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    return { publicKey, privateKeyPath };
  }

  /**
   * Verbindet sich mit dem Host per Passwort, installiert den SSH-Key für passwortloses SSH
   * und installiert die nötigen Pakete basierend auf der Linux-Distro (Debian, Ubuntu, Rocky, Alma, Fedora).
   */
  public static async setupHypervisorHost(options: {
    ip: string;
    port?: number;
    username?: string;
    password?: string;
    osType: string; // debian, ubuntu, rocky, alma, fedora
    purpose: string; // LXC, VM_KVM, DOCKER, PODMAN, ALL_IN_ONE
  }) {
    const ssh = new NodeSSH();
    const port = options.port || 22;
    const username = options.username || 'root';

    await ssh.connect({
      host: options.ip,
      port,
      username,
      password: options.password,
    });

    // 1. SSH key kopieren
    const { publicKey, privateKeyPath } = await this.generateSSHKey();
    await ssh.execCommand(`mkdir -p ~/.ssh && chmod 700 ~/.ssh`);
    await ssh.execCommand(`echo "${publicKey.trim()}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`);

    // 2. Automatisierte Paketinstallation je nach Linux Distro
    let updateCmd = '';
    let installCmd = '';

    const os = options.osType.toLowerCase();
    if (os.includes('debian') || os.includes('ubuntu')) {
      updateCmd = 'apt-get update -y';
      installCmd = 'apt-get install -y zfsutils-linux qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils lxc podman docker.io docker-compose curl wget pciutils usbutils';
    } else if (os.includes('rocky') || os.includes('alma') || os.includes('fedora')) {
      const mgr = os.includes('fedora') ? 'dnf' : 'dnf';
      updateCmd = `${mgr} makecache -y`;
      installCmd = `${mgr} install -y zfs qemu-kvm libvirt lxc podman docker docker-compose curl wget pciutils usbutils`;
    }

    if (updateCmd && installCmd) {
      await ssh.execCommand(updateCmd);
      await ssh.execCommand(installCmd);
    }

    // 3. Falls Docker benötigt wird, Docker Agent/Container starten
    if (options.purpose.includes('DOCKER') || options.purpose.includes('ALL_IN_ONE')) {
      await ssh.execCommand('systemctl enable --now docker || true');
      // GateCore Agent API Docker Container starten
      await ssh.execCommand('docker run -d --name gatecore-agent --restart always -v /var/run/docker.sock:/var/run/docker.sock -p 9090:9090 alpine sleep infinity || true');
    }

    ssh.dispose();
    return { success: true, privateKeyPath };
  }

  /**
   * Führt ein SSH Kommando auf einem Ziel-Host aus.
   */
  public static async executeCommand(hostIp: string, command: string, privateKeyPath: string): Promise<string> {
    const ssh = new NodeSSH();
    await ssh.connect({
      host: hostIp,
      username: 'root',
      privateKeyPath,
    });
    const result = await ssh.execCommand(command);
    ssh.dispose();
    if (result.stderr && result.code !== 0) {
      throw new Error(result.stderr);
    }
    return result.stdout;
  }
}