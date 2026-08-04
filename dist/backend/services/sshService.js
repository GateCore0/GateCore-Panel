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
exports.SSHService = void 0;
const node_ssh_1 = require("node-ssh");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class SSHService {
    /**
     * Generiert ein SSH Schlüsselpaar lokal, falls es noch nicht existiert.
     */
    static async generateSSHKey() {
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
    static async setupHypervisorHost(options) {
        const ssh = new node_ssh_1.NodeSSH();
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
        }
        else if (os.includes('rocky') || os.includes('alma') || os.includes('fedora')) {
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
    static async executeCommand(hostIp, command, privateKeyPath) {
        const ssh = new node_ssh_1.NodeSSH();
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
exports.SSHService = SSHService;
