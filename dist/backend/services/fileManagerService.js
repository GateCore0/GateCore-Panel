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
exports.FileManagerService = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const client_1 = require("@prisma/client");
const sshService_1 = require("./sshService");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const prisma = new client_1.PrismaClient();
class FileManagerService {
    /**
     * Host Dateisystem verwalten (lokal oder remote per SSH)
     */
    static async listHostFiles(dirPath, hostId) {
        if (hostId) {
            const host = await prisma.host.findUnique({ where: { id: hostId } });
            if (!host || !host.sshKeyPath)
                throw new Error('Host not found or SSH key missing');
            const safePath = JSON.stringify(dirPath.startsWith('/') ? dirPath : `~/${dirPath}`);
            const stdout = await sshService_1.SSHService.executeCommand(host.ip, `ls -la ${safePath} --time-style=long-iso`, host.sshKeyPath);
            return stdout
                .split('\n')
                .filter((line) => line && !line.startsWith('total') && !line.startsWith('insgesamt'))
                .map((line) => {
                const parts = line.trim().split(/\s+/);
                if (parts.length < 8)
                    return null;
                const isDirectory = parts[0].startsWith('d');
                const date = `${parts[5]} ${parts[6]}`;
                return {
                    name: parts.slice(8).join(' '),
                    isDirectory,
                    path: `${dirPath.replace(/\/$/, '')}/${parts.slice(8).join(' ')}`,
                    size: parts[4],
                    date,
                };
            })
                .filter(Boolean);
        }
        const safePath = path.resolve(dirPath);
        if (!fs.existsSync(safePath)) {
            throw new Error('Path does not exist');
        }
        const items = fs.readdirSync(safePath, { withFileTypes: true });
        return items.map((item) => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(safePath, item.name),
        }));
    }
    static async readFileContent(filePath, hostId) {
        if (hostId) {
            const host = await prisma.host.findUnique({ where: { id: hostId } });
            if (!host || !host.sshKeyPath)
                throw new Error('Host not found or SSH key missing');
            return await sshService_1.SSHService.executeCommand(host.ip, `cat ${JSON.stringify(filePath)}`, host.sshKeyPath);
        }
        return fs.readFileSync(path.resolve(filePath), 'utf8');
    }
    static async saveFileContent(filePath, content, hostId) {
        if (hostId) {
            const host = await prisma.host.findUnique({ where: { id: hostId } });
            if (!host || !host.sshKeyPath)
                throw new Error('Host not found or SSH key missing');
            await sshService_1.SSHService.executeCommand(host.ip, `mkdir -p $(dirname ${JSON.stringify(filePath)}) && cat > ${JSON.stringify(filePath)} << 'GATECORE_EOF'\n${content}\nGATECORE_EOF`, host.sshKeyPath);
            return { success: true };
        }
        fs.writeFileSync(path.resolve(filePath), content, 'utf8');
        return { success: true };
    }
    static async deleteHostFile(filePath, hostId) {
        if (hostId) {
            const host = await prisma.host.findUnique({ where: { id: hostId } });
            if (!host || !host.sshKeyPath)
                throw new Error('Host not found or SSH key missing');
            await sshService_1.SSHService.executeCommand(host.ip, `rm -rf ${JSON.stringify(filePath)}`, host.sshKeyPath);
            return { success: true };
        }
        const target = path.resolve(filePath);
        if (fs.lstatSync(target).isDirectory()) {
            fs.rmSync(target, { recursive: true, force: true });
        }
        else {
            fs.unlinkSync(target);
        }
        return { success: true };
    }
    /**
     * Host-Dateisystem auf dem Docker-Rechner verwalten
     * Nutzt einen schlanken Agent-Container (gatecore-host-access), der "/" des Hosts rw mountet.
     */
    static async ensureLocalHostAccess() {
        const { stdout } = await execAsync(`docker inspect gatecore-host-access --format '{{.State.Running}}' 2>/dev/null || true`).catch(() => ({ stdout: '' }));
        if (stdout.trim() !== 'true') {
            await execAsync(`docker rm -f gatecore-host-access 2>/dev/null || true`);
            await execAsync(`docker run -d --name gatecore-host-access --restart unless-stopped -v /:/host docker.io/alpine:latest sleep infinity`);
        }
        await execAsync(`timeout 60 docker exec gatecore-host-access test -d /host 2>/dev/null || true`).catch(() => { });
    }
    static async listLocalHostFiles(dirPath) {
        await this.ensureLocalHostAccess();
        const hostPath = dirPath === '/' ? '/host' : `/host${dirPath}`;
        const safePath = JSON.stringify(hostPath);
        const { stdout, stderr } = await execAsync(`docker exec gatecore-host-access ls -la ${safePath} --time-style=long-iso 2>/dev/null || docker exec gatecore-host-access ls -la ${safePath}`);
        if (stderr && !stdout)
            throw new Error(stderr);
        return stdout
            .split('\n')
            .filter((line) => line && !line.startsWith('total') && !line.startsWith('insgesamt'))
            .map((line) => {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 8)
                return null;
            const isDirectory = parts[0].startsWith('d');
            const date = `${parts[5]} ${parts[6]}`;
            return {
                name: parts.slice(8).join(' '),
                isDirectory,
                path: `${dirPath.replace(/\/$/, '')}/${parts.slice(8).join(' ')}`,
                size: parts[4],
                date,
            };
        })
            .filter(Boolean);
    }
    static async readLocalHostFile(filePath) {
        await this.ensureLocalHostAccess();
        const { stdout, stderr } = await execAsync(`docker exec gatecore-host-access cat ${JSON.stringify(`/host${filePath}`)}`);
        if (stderr && !stdout)
            throw new Error(stderr);
        return stdout;
    }
    static async saveLocalHostFile(filePath, content) {
        await this.ensureLocalHostAccess();
        const tmpFile = `/tmp/gatecore_tmp_${Date.now()}`;
        fs.writeFileSync(tmpFile, content, 'utf8');
        try {
            await execAsync(`docker cp ${tmpFile} gatecore-host-access:/tmp/gatecore_tmp_file`);
            const hostTarget = JSON.stringify(`/host${filePath}`);
            await execAsync(`docker exec gatecore-host-access sh -c "mkdir -p $(dirname ${hostTarget}) && cp /tmp/gatecore_tmp_file ${hostTarget}"`);
        }
        finally {
            if (fs.existsSync(tmpFile))
                fs.unlinkSync(tmpFile);
        }
        return { success: true };
    }
    static async deleteLocalHostFile(filePath) {
        await this.ensureLocalHostAccess();
        const { stderr } = await execAsync(`docker exec gatecore-host-access rm -rf ${JSON.stringify(`/host${filePath}`)}`);
        if (stderr)
            throw new Error(stderr);
        return { success: true };
    }
    /**
     * Docker Container Dateisystem auf dem lokalen Docker-Rechner verwalten (docker exec)
     */
    static async listLocalDockerContainerFiles(container, dirPath) {
        const safePath = JSON.stringify(dirPath.startsWith('/') ? dirPath : `/${dirPath}`);
        const { stdout, stderr } = await execAsync(`docker exec ${container} ls -la ${safePath} --time-style=long-iso 2>/dev/null || docker exec ${container} ls -la ${safePath}`);
        if (stderr && !stdout)
            throw new Error(stderr);
        return stdout
            .split('\n')
            .filter((line) => line && !line.startsWith('total') && !line.startsWith('insgesamt'))
            .map((line) => {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 8)
                return null;
            const isDirectory = parts[0].startsWith('d');
            const date = `${parts[5]} ${parts[6]}`;
            return {
                name: parts.slice(8).join(' '),
                isDirectory,
                path: `${dirPath.replace(/\/$/, '')}/${parts.slice(8).join(' ')}`,
                size: parts[4],
                date,
            };
        })
            .filter(Boolean);
    }
    static async readLocalDockerContainerFile(container, filePath) {
        const { stdout, stderr } = await execAsync(`docker exec ${container} cat ${JSON.stringify(filePath)}`);
        if (stderr && !stdout)
            throw new Error(stderr);
        return stdout;
    }
    static async saveLocalDockerContainerFile(container, filePath, content) {
        const tmpFile = `/tmp/gatecore_tmp_${Date.now()}`;
        fs.writeFileSync(tmpFile, content, 'utf8');
        try {
            await execAsync(`mkdir -p $(dirname ${JSON.stringify(filePath)}) && docker cp ${tmpFile} ${container}:${JSON.stringify(filePath)}`);
        }
        finally {
            if (fs.existsSync(tmpFile))
                fs.unlinkSync(tmpFile);
        }
        return { success: true };
    }
    static async deleteLocalDockerContainerFile(container, filePath) {
        const { stderr } = await execAsync(`docker exec ${container} rm -rf ${JSON.stringify(filePath)}`);
        if (stderr)
            throw new Error(stderr);
        return { success: true };
    }
    /**
     * Docker Container Dateisystem auf einem Remote-Host verwalten (per SSH)
     */
    static async listDockerContainerFiles(hostId, container, dirPath) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found or SSH key missing');
        const safePath = JSON.stringify(dirPath.startsWith('/') ? dirPath : `/${dirPath}`);
        const stdout = await sshService_1.SSHService.executeCommand(host.ip, `docker exec ${container} ls -la ${safePath} --time-style=long-iso 2>/dev/null || docker exec ${container} ls -la ${safePath}`, host.sshKeyPath);
        return stdout
            .split('\n')
            .filter((line) => line && !line.startsWith('total') && !line.startsWith('insgesamt'))
            .map((line) => {
            const parts = line.trim().split(/\s+/);
            if (parts.length < 8)
                return null;
            const isDirectory = parts[0].startsWith('d');
            const date = `${parts[5]} ${parts[6]}`;
            return {
                name: parts.slice(8).join(' '),
                isDirectory,
                path: `${dirPath.replace(/\/$/, '')}/${parts.slice(8).join(' ')}`,
                size: parts[4],
                date,
            };
        })
            .filter(Boolean);
    }
    static async readDockerContainerFile(hostId, container, filePath) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found or SSH key missing');
        return await sshService_1.SSHService.executeCommand(host.ip, `docker exec ${container} cat ${JSON.stringify(filePath)}`, host.sshKeyPath);
    }
    static async saveDockerContainerFile(hostId, container, filePath, content) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found or SSH key missing');
        await sshService_1.SSHService.executeCommand(host.ip, `mkdir -p $(dirname ${JSON.stringify(filePath)}) && cat > /tmp/gatecore_tmp_file << 'GATECORE_EOF'\n${content}\nGATECORE_EOF && docker cp /tmp/gatecore_tmp_file ${container}:${JSON.stringify(filePath)} && rm -f /tmp/gatecore_tmp_file`, host.sshKeyPath);
        return { success: true };
    }
    static async deleteDockerContainerFile(hostId, container, filePath) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found or SSH key missing');
        await sshService_1.SSHService.executeCommand(host.ip, `docker exec ${container} rm -rf ${JSON.stringify(filePath)}`, host.sshKeyPath);
        return { success: true };
    }
    /**
     * Docker Container Dateisystem verwalten (lokal)
     */
    static async listContainerFiles(containerName, containerPath) {
        const { stdout } = await execAsync(`docker exec ${containerName} ls -la ${containerPath}`);
        return stdout;
    }
    static async readContainerFile(containerName, containerPath) {
        const { stdout } = await execAsync(`docker exec ${containerName} cat ${containerPath}`);
        return stdout;
    }
    static async copyFileToContainer(containerName, hostFilePath, containerDestPath) {
        await execAsync(`docker cp "${hostFilePath}" "${containerName}:${containerDestPath}"`);
        return { success: true };
    }
    static async copyFileFromContainer(containerName, containerSrcPath, hostDestPath) {
        await execAsync(`docker cp "${containerName}:${containerSrcPath}" "${hostDestPath}"`);
        return { success: true };
    }
}
exports.FileManagerService = FileManagerService;
