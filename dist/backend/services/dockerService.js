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
exports.DockerService = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sshService_1 = require("./sshService");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const prisma = new client_1.PrismaClient();
/**
 * Führt einen Docker-Befehl auf dem gewählten Host aus.
 * - isLocal-Host (Panel-Rechner): direkt via Unix-Socket (execAsync)
 * - Remote-Host: per SSH (SSHService.executeCommand)
 */
async function runDocker(host, cmd) {
    if (!host || host.isLocal || !host.sshKeyPath || host.ip === '127.0.0.1') {
        const { stdout } = await execAsync(cmd);
        return stdout;
    }
    return await sshService_1.SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
}
class DockerService {
    /**
     * Erstellt und startet einen Docker Container auf dem gewählten Host.
     * Optional mit Volume (StoragePool / DOCKER_VOLUME) und Mount-Pfad.
     */
    static async createContainer(opts) {
        const { name, image, volumeName, mountPath, hostId } = opts;
        const host = await DockerService.resolveHost(hostId);
        let cmd = `docker run -d --name ${name}`;
        if (volumeName) {
            // Volume aus StoragePool / DOCKER_VOLUME als Bind-Mount
            const pool = await prisma.storagePool.findFirst({
                where: { name: volumeName, type: 'DOCKER_VOLUME' },
            });
            const target = mountPath || '/data';
            if (pool) {
                // Bind-Mount auf den echten Host-Pfad des Volumes
                cmd += ` -v ${pool.path}:${target}`;
            }
            else {
                cmd += ` -v ${volumeName}:${target}`;
            }
        }
        cmd += ` ${image}`;
        await runDocker(host, cmd);
        return await prisma.dockerContainer.create({
            data: {
                name,
                image,
                volumeName,
                mountPath: mountPath || '/data',
                hostId: host?.isLocal ? undefined : host?.id,
                status: 'RUNNING',
            },
        });
    }
    /**
     * Führt eine Aktion auf einem Container aus (start/stop/restart).
     */
    static async containerAction(id, action, hostId) {
        const host = await DockerService.resolveHost(hostId);
        const dbContainer = await prisma.dockerContainer.findUnique({ where: { id } }).catch(() => null);
        const containerName = dbContainer?.name || id;
        if (action === 'start')
            await runDocker(host, `docker start ${containerName}`);
        else if (action === 'stop')
            await runDocker(host, `docker stop ${containerName}`);
        else if (action === 'restart')
            await runDocker(host, `docker restart ${containerName}`);
        else
            throw new Error(`Unknown action: ${action}`);
        return { success: true, id, action, containerName };
    }
    /**
     * Holt Container-Logs.
     */
    static async containerLogs(id, lines = 200, hostId) {
        const host = await DockerService.resolveHost(hostId);
        const dbContainer = await prisma.dockerContainer.findUnique({ where: { id } }).catch(() => null);
        const containerName = dbContainer?.name || id;
        const stdout = await runDocker(host, `docker logs --tail ${lines} ${containerName} 2>&1`);
        return stdout;
    }
    /**
     * Holt Details eines Containers via docker inspect: Ports, Volumes, Bild, Netzwerk.
     */
    static async containerDetails(id, hostId) {
        const host = await DockerService.resolveHost(hostId);
        const dbContainer = await prisma.dockerContainer.findUnique({ where: { id } }).catch(() => null);
        const containerName = dbContainer?.name || id;
        const stdout = await runDocker(host, `docker inspect ${JSON.stringify(containerName)}`);
        const info = JSON.parse(stdout)[0] || {};
        const cfg = info.Config || {};
        const hostCfg = info.HostConfig || {};
        const state = info.State || {};
        // Ports: 0.0.0.0:8080->80/tcp
        const ports = [];
        const portBinds = hostCfg.PortBindings || {};
        const exposed = Object.keys(cfg.ExposedPorts || {});
        for (const exp of exposed) {
            const [containerPort, protocol = 'tcp'] = exp.split('/');
            const bind = portBinds[exp];
            if (bind && bind.length > 0) {
                for (const b of bind) {
                    ports.push({
                        host: b.HostPort || '',
                        container: containerPort,
                        protocol,
                        published: true,
                    });
                }
            }
            else {
                ports.push({ host: '', container: containerPort, protocol, published: false });
            }
        }
        // Volumes: hostpfad:/pfad:rw
        const volumeBinds = [];
        for (const v of hostCfg.Binds || []) {
            const [hostPath, containerPath, mode = 'rw'] = v.split(':');
            volumeBinds.push({ host: hostPath, container: containerPath, mode });
        }
        return {
            id: info.Id,
            name: info.Name?.replace(/^\//, '') || containerName,
            image: info.Config?.Image || dbContainer?.image || '',
            status: state.Status || dbContainer?.status || '',
            restartPolicy: hostCfg.RestartPolicy?.Name || 'no',
            ports,
            volumes: volumeBinds,
            networkMode: hostCfg.NetworkMode || 'default',
            memoryMB: hostCfg.Memory ? Math.round(hostCfg.Memory / 1024 / 1024) : 0,
            env: cfg.Env || [],
            cmd: cfg.Cmd || [],
            entrypoint: cfg.Entrypoint || [],
            user: cfg.User || '',
            workingDir: cfg.WorkingDir || '',
            labels: cfg.Labels || {},
            networks: Array.isArray(info.NetworkSettings?.Networks)
                ? []
                : Object.keys(info.NetworkSettings?.Networks || {}),
        };
    }
    /**
     * Aktualisiert die Konfiguration eines Containers (Ports & Volumes) per Recreate.
     * Aktion: `setPorts` / `setVolumes` (übergibt die vollständige neue Liste).
     */
    static async updateContainerConfig(id, opts) {
        const host = await DockerService.resolveHost(opts.hostId);
        const dbContainer = await prisma.dockerContainer.findUnique({ where: { id } }).catch(() => null);
        // Echten Docker-Namen auflösen: zuerst via docker inspect, sonst DB-Name, sonst ID
        let containerName = id;
        let details = null;
        try {
            const insp = await runDocker(host, `docker inspect ${JSON.stringify(id)}`);
            const info = JSON.parse(insp)[0];
            if (info) {
                containerName = info.Name?.replace(/^\//, '') || id;
            }
        }
        catch { /* Container evtl. nicht unter ID auffindbar */ }
        if (!containerName || containerName === id) {
            containerName = dbContainer?.name || id;
        }
        // Aktuelle Konfiguration vom echten Container holen
        details = await DockerService.containerDetails(containerName, opts.hostId);
        const image = details.image || dbContainer?.image || '';
        // Compose-verwaltete Container schützen: einzeln neu erstellen würde den Compose-Stack zerstören
        const composeLabels = details.labels || {};
        const composeProject = Object.keys(composeLabels).find((k) => k.startsWith('com.docker.compose.project'));
        if (composeProject) {
            throw new Error(`Container "${containerName}" wird von Docker Compose verwaltet (Projekt: ${composeLabels[composeProject]}). ` +
                `Ports/Volumes von Compose-Containern bitte in der docker-compose.yml ändern.`);
        }
        const portBinds = [];
        const binds = [];
        if (opts.action === 'setPorts') {
            // Volumes aus dem bestehenden Container übernehmen
            for (const v of details.volumes) {
                binds.push(`${v.host}:${v.container}:${v.mode || 'rw'}`);
            }
            const newPorts = opts.ports || [];
            for (const p of newPorts) {
                const hostP = p.host?.replace(/^.*:/, '');
                if (!hostP)
                    continue; // nur published
                if (hostP === 'BLOCKED')
                    continue; // blockierter Port → PortBinding nicht anlegen
                portBinds.push(`-p ${hostP}:${p.container}/${p.protocol || 'tcp'}`);
            }
        }
        else if (opts.action === 'setVolumes') {
            // Ports aus dem bestehenden Container übernehmen
            for (const p of details.ports) {
                if (p.published) {
                    portBinds.push(`-p ${p.host}:${p.container}/${p.protocol || 'tcp'}`);
                }
            }
            const newVolumes = opts.volumes || [];
            for (const v of newVolumes) {
                const hostPath = v.split(':')[0];
                const containerPath = v.split(':')[1] || '';
                const mode = v.split(':')[2] || 'rw';
                if (!containerPath)
                    continue;
                binds.push(`${hostPath}:${containerPath}:${mode}`);
            }
        }
        // Weitere Konfiguration übernehmen (Labels, Env, Cmd, Netzwerk, RestartPolicy)
        const extra = [];
        // RestartPolicy
        if (details.restartPolicy && details.restartPolicy !== 'no') {
            extra.push(`--restart ${details.restartPolicy}`);
        }
        // Netzwerk
        if (details.networkMode) {
            if (details.networkMode.startsWith('container:')) {
                extra.push(`--network ${details.networkMode}`);
            }
            else if (details.networkMode === 'host') {
                extra.push('--network host');
            }
            else if (details.networkMode && details.networkMode !== 'default' && details.networkMode !== 'bridge') {
                extra.push(`--network ${details.networkMode}`);
            }
        }
        // Labels (wichtig für Compose-Projekte)
        const labels = details.labels || {};
        for (const [k, v] of Object.entries(labels)) {
            // Nur relevante Labels übernehmen (Compose-.etc.), nicht die Standard-Labels
            if (typeof v === 'string' && k) {
                extra.push(`--label ${JSON.stringify(`${k}=${v}`)}`);
            }
        }
        // Env
        const envs = details.env || [];
        for (const e of envs) {
            if (e.includes('=')) {
                extra.push(`--env ${JSON.stringify(e)}`);
            }
        }
        // Cmd überschreiben nur wenn vorhanden
        let cmdSuffix = '';
        const cmdArgs = details.cmd || [];
        if (cmdArgs.length > 0) {
            cmdSuffix = ' ' + cmdArgs.map((a) => JSON.stringify(a)).join(' ');
        }
        const oldContainer = containerName;
        const newName = `${oldContainer}-gc-recreate`;
        let cmd = `docker stop ${JSON.stringify(oldContainer)} >/dev/null 2>&1 || true; `;
        cmd += `docker rename ${JSON.stringify(oldContainer)} ${JSON.stringify(newName)} >/dev/null 2>&1 || true; `;
        cmd += `docker rm -f ${JSON.stringify(newName)} >/dev/null 2>&1 || true; `;
        cmd += `docker run -d --name ${JSON.stringify(oldContainer)} ${portBinds.join(' ')} ${binds.map((b) => `-v ${JSON.stringify(b)}`).join(' ')} ${extra.join(' ')} ${JSON.stringify(image)}${cmdSuffix}`;
        cmd += ` || (docker rename ${JSON.stringify(newName)} ${JSON.stringify(oldContainer)} >/dev/null 2>&1; exit 1)`;
        await runDocker(host, cmd);
        return { success: true, id, action: opts.action, containerName };
    }
    /**
     * Löscht einen Docker Container (DB optional).
     */
    static async deleteContainer(id, hostId) {
        const host = await DockerService.resolveHost(hostId);
        const dbContainer = await prisma.dockerContainer.findUnique({ where: { id } }).catch(() => null);
        const containerName = dbContainer?.name || id;
        try {
            await runDocker(host, `docker rm -f ${JSON.stringify(containerName)} 2>&1 || true`);
        }
        catch { /* existiert nicht als echter Container */ }
        if (dbContainer) {
            return await prisma.dockerContainer.delete({ where: { id } });
        }
        return { success: true };
    }
    /**
     * Erstellt ein Docker Volume: Verzeichnis auf dem gewählten Host + StoragePool-Eintrag (type DOCKER_VOLUME).
     */
    static async createVolume(volumeName, hostId, volumePath) {
        const host = await DockerService.resolveHost(hostId);
        if (!host)
            throw new Error('No Docker host found');
        // Standard-Pfad, falls keiner angegeben: Docker-Volume-Datenverzeichnis
        const finalPath = volumePath || `/var/lib/docker/volumes/${volumeName}/_data`;
        await runDocker(host, `mkdir -p ${JSON.stringify(finalPath)}`);
        // Wichtige DS_Store/GateCore-unabhängig: Docker Volume in Docker eintragen, damit docker volume ls es zeigt
        try {
            await runDocker(host, `docker volume create ${volumeName} >/dev/null 2>&1 || true`);
        }
        catch { /* optional */ }
        const pool = await prisma.storagePool.create({
            data: {
                name: volumeName,
                type: 'DOCKER_VOLUME',
                path: finalPath,
                hostId: host.id,
            },
        });
        return { success: true, volumeName, path: finalPath, pool };
    }
    /**
     * Erstellt und startet ein Docker Compose Projekt auf dem gewählten Host.
     */
    static async createComposeProject(name, composeYamlContent, hostId) {
        const host = await DockerService.resolveHost(hostId);
        const projectDir = path.join(process.cwd(), 'storage', 'compose', name);
        if (!fs.existsSync(projectDir)) {
            fs.mkdirSync(projectDir, { recursive: true });
        }
        const filePath = path.join(projectDir, 'docker-compose.yml');
        fs.writeFileSync(filePath, composeYamlContent, 'utf8');
        if (host && !host.isLocal && host.sshKeyPath && host.ip !== '127.0.0.1') {
            // Remote: Compose-Datei hochladen und dort ausführen
            const remoteDir = `/opt/gatecore/compose/${name}`;
            await sshService_1.SSHService.executeCommand(host.ip, `mkdir -p ${remoteDir}`, host.sshKeyPath);
            const base64 = Buffer.from(composeYamlContent).toString('base64');
            await sshService_1.SSHService.executeCommand(host.ip, `echo ${base64} | base64 -d > ${remoteDir}/docker-compose.yml`, host.sshKeyPath);
            await sshService_1.SSHService.executeCommand(host.ip, `cd ${remoteDir} && docker-compose up -d`, host.sshKeyPath);
        }
        else {
            await execAsync(`docker-compose -f ${filePath} up -d`);
        }
        return await prisma.dockerComposeProject.create({
            data: {
                name,
                content: composeYamlContent,
                status: 'RUNNING',
                hostId: host?.isLocal ? undefined : host?.id,
            },
        });
    }
    /**
     * Führt eine Aktion auf einem Compose-Projekt aus (up/down/restart).
     */
    static async composeAction(id, action, hostId) {
        const host = await DockerService.resolveHost(hostId);
        const project = await prisma.dockerComposeProject.findUnique({ where: { id } });
        if (!project)
            throw new Error('Compose project not found');
        const projectDir = path.join(process.cwd(), 'storage', 'compose', project.name);
        const filePath = path.join(projectDir, 'docker-compose.yml');
        if (action === 'up')
            await runDocker(host, `docker-compose -f ${filePath} up -d`);
        else if (action === 'down')
            await runDocker(host, `docker-compose -f ${filePath} down`);
        else if (action === 'restart')
            await runDocker(host, `docker-compose -f ${filePath} restart`);
        else
            throw new Error(`Unknown action: ${action}`);
        return { success: true, id, action };
    }
    /**
     * Compose-Logs.
     */
    static async composeLogs(id, lines = 200, hostId) {
        const host = await DockerService.resolveHost(hostId);
        const project = await prisma.dockerComposeProject.findUnique({ where: { id } });
        if (!project)
            throw new Error('Compose project not found');
        const projectDir = path.join(process.cwd(), 'storage', 'compose', project.name);
        const filePath = path.join(projectDir, 'docker-compose.yml');
        const stdout = await runDocker(host, `docker-compose -f ${filePath} logs --tail ${lines} 2>&1`);
        return stdout;
    }
    /**
     * Löscht ein Docker Compose Projekt.
     */
    static async deleteComposeProject(id, hostId) {
        const host = await DockerService.resolveHost(hostId);
        const project = await prisma.dockerComposeProject.findUnique({ where: { id } });
        if (!project)
            throw new Error('Compose project not found');
        const projectDir = path.join(process.cwd(), 'storage', 'compose', project.name);
        const filePath = path.join(projectDir, 'docker-compose.yml');
        if (fs.existsSync(filePath)) {
            try {
                await runDocker(host, `docker-compose -f ${filePath} down`);
            }
            catch { /* ignore errors on down */ }
        }
        return await prisma.dockerComposeProject.delete({ where: { id } });
    }
    /**
     * Löst einen Host auf. Ohne hostId → automatisch der lokale Panel-Host (isLocal).
     */
    static async resolveHost(hostId) {
        if (!hostId) {
            const localHost = await prisma.host.findFirst({
                where: { isLocal: true },
            });
            return localHost || null;
        }
        return await prisma.host.findUnique({ where: { id: hostId } });
    }
}
exports.DockerService = DockerService;
