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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sshService_1 = require("./services/sshService");
const hypervisorService_1 = require("./services/hypervisorService");
const dockerService_1 = require("./services/dockerService");
const fileManagerService_1 = require("./services/fileManagerService");
const ldapService_1 = require("./services/ldapService");
const { app } = (0, express_ws_1.default)((0, express_1.default)());
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gatecore-super-secret-key';
app.use((0, cors_1.default)({
    origin: true,
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
// Serving Static Frontend Files in Production
app.use(express_1.default.static(path.join(__dirname, '../../frontend/dist')));
// --- AUTHENTICATION MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.gatecore_token;
    if (!token)
        return res.status(401).json({ error: 'Access token required' });
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};
// --- AUTHENTICATION & USERS ---
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    // 1. Local Database Login
    const user = await prisma.user.findUnique({ where: { username } });
    if (user) {
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (isValid) {
            const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
            res.cookie('gatecore_token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 Stunden
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            });
            return res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
        }
    }
    // 2. LDAP / AD Login Fallback
    const ldapSuccess = await ldapService_1.LDAPService.authenticate(username, password);
    if (ldapSuccess) {
        const token = jsonwebtoken_1.default.sign({ username, role: 'USER', isLdap: true }, JWT_SECRET, { expiresIn: '24h' });
        res.cookie('gatecore_token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 Stunden
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
        });
        return res.json({ token, user: { username, role: 'USER', isLdap: true } });
    }
    return res.status(401).json({ error: 'Invalid credentials' });
});
app.get('/api/auth/me', authenticateToken, (req, res) => {
    res.json({ user: req.user });
});
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('gatecore_token');
    res.json({ success: true });
});
app.get('/api/users', async (req, res) => {
    const users = await prisma.user.findMany({ select: { id: true, username: true, role: true, isLdap: true } });
    res.json(users);
});
app.post('/api/users', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcryptjs_1.default.hash(password, 10);
    const newUser = await prisma.user.create({
        data: { username, password: hashedPassword, role: role || 'USER' },
    });
    res.json({ id: newUser.id, username: newUser.username, role: newUser.role });
});
app.delete('/api/users/:id', async (req, res) => {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true });
});
app.put('/api/users/:id/password', async (req, res) => {
    try {
        const { password } = req.body;
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await prisma.user.update({ where: { id: req.params.id }, data: { password: hashedPassword } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- LDAP CONFIG ---
app.get('/api/ldap/config', async (req, res) => {
    const config = await prisma.ldapConfig.findFirst();
    res.json(config || { enabled: false, url: '', bindDn: '', bindPassword: '', searchBase: '', userFilter: '(sAMAccountName={{username}})' });
});
app.post('/api/ldap/config', async (req, res) => {
    const { enabled, url, bindDn, bindPassword, searchBase, userFilter } = req.body;
    const existing = await prisma.ldapConfig.findFirst();
    if (existing) {
        const updated = await prisma.ldapConfig.update({ where: { id: existing.id }, data: { enabled, url, bindDn, bindPassword, searchBase, userFilter } });
        return res.json(updated);
    }
    const config = await prisma.ldapConfig.create({ data: { enabled, url, bindDn, bindPassword, searchBase, userFilter } });
    res.json(config);
});
// --- HYPERVISOR & HOST PROVISIONING ---
app.post('/api/hypervisors', async (req, res) => {
    try {
        const { name, ip, port, username, password, osType, purpose } = req.body;
        // Provision SSH and dependencies automatically
        const setupResult = await sshService_1.SSHService.setupHypervisorHost({
            ip,
            port: Number(port) || 22,
            username,
            password,
            osType,
            purpose,
        });
        const capabilities = ['DOCKER', 'PODMAN', 'LXC', 'VM_KVM', 'ALL_IN_ONE'].includes(purpose) ? [purpose] : ['ALL_IN_ONE'];
        const host = await prisma.host.create({
            data: {
                name,
                ip,
                port: Number(port) || 22,
                username: username || 'root',
                osType,
                sshKeyPath: setupResult.privateKeyPath,
                status: 'ONLINE',
                capabilities,
            },
        });
        res.json(host);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/hypervisors', async (req, res) => {
    const hosts = await prisma.host.findMany({
        include: { vms: true, lxcContainers: true, podmanContainers: true, zfsPools: true, storagePools: true },
    });
    res.json(hosts);
});
// --- DOCKER & DOCKER COMPOSE (host-basiert) ---
async function dockerHost() {
    const localHost = await prisma.host.findFirst({ where: { isLocal: true } });
    return localHost || null;
}
/** Führt einen Docker-Befehl auf dem gewählten Host aus (lokal via Unix-Socket, remote per SSH). */
async function runDockerCmd(hostId, cmd) {
    const host = hostId ? await prisma.host.findUnique({ where: { id: hostId } }) : await dockerHost();
    if (!host || host.isLocal || !host.sshKeyPath || host.ip === '127.0.0.1') {
        const { execSync } = require('child_process');
        return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    }
    return await sshService_1.SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
}
app.get('/api/docker/containers', async (req, res) => {
    try {
        const hostId = req.query.hostId;
        let real = [];
        try {
            const stdout = await runDockerCmd(hostId, `docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}'`);
            real = stdout
                .trim()
                .split('\n')
                .filter(Boolean)
                .map((line) => {
                const [id, name, image, ...rest] = line.split('\t');
                const status = rest.join('\t');
                const running = status.toLowerCase().includes('up');
                return {
                    id,
                    name,
                    image,
                    volumeName: null,
                    status: running ? 'RUNNING' : 'STOPPED',
                    createdAt: null,
                    isRealDocker: true,
                };
            });
        }
        catch { /* Docker nicht erreichbar → nur DB */ }
        // DB-Container ergänzen (falls dort zusätzlich verwaltet)
        const dbContainers = await prisma.dockerContainer.findMany({ where: { hostId: hostId || null } });
        const existingNames = new Set(real.map((c) => c.name));
        for (const dbc of dbContainers) {
            if (!existingNames.has(dbc.name)) {
                real.push({ ...dbc, isRealDocker: false });
            }
        }
        res.json(real);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/docker/containers', async (req, res) => {
    try {
        const { name, image, volumeName, mountPath, hostId } = req.body;
        const result = await dockerService_1.DockerService.createContainer({ name, image, volumeName, mountPath, hostId });
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/docker/containers/:id/action', async (req, res) => {
    try {
        const { action } = req.body;
        const { id } = req.params;
        const hostId = req.body.hostId;
        const result = await dockerService_1.DockerService.containerAction(id, action, hostId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/docker/containers/:id/logs', async (req, res) => {
    try {
        const { id } = req.params;
        const hostId = req.query.hostId;
        const lines = Number(req.query.lines) || 200;
        const logs = await dockerService_1.DockerService.containerLogs(id, lines, hostId);
        res.json({ logs });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/docker/containers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const hostId = req.query.hostId;
        try {
            await dockerService_1.DockerService.deleteContainer(id, hostId);
        }
        catch { /* Nicht als echter Container gefunden */ }
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/docker/volumes', async (req, res) => {
    try {
        const { volumeName, hostId, path: volumePath } = req.body;
        const result = await dockerService_1.DockerService.createVolume(volumeName, hostId, volumePath);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/docker/volumes', async (req, res) => {
    try {
        const hostId = req.query.hostId;
        let real = [];
        try {
            const stdout = await runDockerCmd(hostId, `docker volume ls --format '{{.Name}}'`);
            real = stdout.trim().split('\n').filter(Boolean).map((line) => ({ name: line }));
        }
        catch { /* Docker nicht erreichbar */ }
        // StoragePool-Volumes des gewählten Hosts ergänzen (mit Pfad)
        const pools = await prisma.storagePool.findMany({
            where: { type: 'DOCKER_VOLUME', hostId: hostId || (await dockerHost())?.id },
        });
        const poolNames = new Set(pools.map((p) => p.name));
        for (const p of pools) {
            if (!real.some((v) => v.name === p.name)) {
                real.push({ name: p.name, path: p.path, id: p.id, isPool: true });
            }
        }
        // Bei realen Volumes den Pfad aus einem passenden Pool übernehmen
        real = real.map((v) => {
            if (poolNames.has(v.name))
                return v;
            return { ...v, id: null, isPool: false, path: null };
        });
        res.json(real);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/docker/compose', async (req, res) => {
    const hostId = req.query.hostId;
    const projects = await prisma.dockerComposeProject.findMany({ where: { hostId: hostId || null } });
    res.json(projects);
});
app.post('/api/docker/compose', async (req, res) => {
    try {
        const { name, content, hostId } = req.body;
        const project = await dockerService_1.DockerService.createComposeProject(name, content, hostId);
        res.json(project);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/docker/compose/:id/action', async (req, res) => {
    try {
        const { action } = req.body;
        const { id } = req.params;
        const hostId = req.body.hostId;
        const result = await dockerService_1.DockerService.composeAction(id, action, hostId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/docker/compose/:id/logs', async (req, res) => {
    try {
        const { id } = req.params;
        const hostId = req.query.hostId;
        const logs = await dockerService_1.DockerService.composeLogs(id, 200, hostId);
        res.json({ logs });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/docker/compose/:id', async (req, res) => {
    try {
        const hostId = req.query.hostId;
        await dockerService_1.DockerService.deleteComposeProject(req.params.id, hostId);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- VMS, LXC & PODMAN ---
app.post('/api/vm', async (req, res) => {
    const { hostId, name, vcpus, memoryMB, diskSizeGB, storagePath } = req.body;
    const vm = await hypervisorService_1.HypervisorService.createVM(hostId, name, Number(vcpus), Number(memoryMB), Number(diskSizeGB), storagePath);
    res.json(vm);
});
app.post('/api/lxc', async (req, res) => {
    const { hostId, name, template, memoryMB, storagePath } = req.body;
    const lxc = await hypervisorService_1.HypervisorService.createLXCContainer(hostId, name, template, Number(memoryMB), storagePath);
    res.json(lxc);
});
app.post('/api/podman', async (req, res) => {
    const { hostId, name, image } = req.body;
    const podman = await hypervisorService_1.HypervisorService.createPodmanContainer(hostId, name, image);
    res.json(podman);
});
// --- STORAGE & ZFS & DISK ---
app.post('/api/zfs', async (req, res) => {
    const { hostId, poolName, raidLevel, disks } = req.body;
    const result = await hypervisorService_1.HypervisorService.createZFSPool(hostId, poolName, raidLevel, disks);
    res.json({ result });
});
app.post('/api/disks/format', async (req, res) => {
    const { hostId, devicePath, fsType } = req.body;
    const result = await hypervisorService_1.HypervisorService.formatDisk(hostId, devicePath, fsType);
    res.json({ result });
});
app.get('/api/hardware/:hostId', async (req, res) => {
    try {
        const devices = await hypervisorService_1.HypervisorService.listHardwareDevices(req.params.hostId);
        res.json(devices);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- HYPERVISOR DELETE ---
app.delete('/api/hypervisors/:id', async (req, res) => {
    try {
        await prisma.host.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- VM / LXC / PODMAN DELETE ---
app.delete('/api/vm/:id', async (req, res) => {
    try {
        await prisma.vM.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/lxc/:id', async (req, res) => {
    try {
        await prisma.lXCContainer.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/podman/:id', async (req, res) => {
    try {
        await prisma.podmanContainer.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- STORAGE POOLS ---
app.get('/api/storage-pools', async (req, res) => {
    const pools = await prisma.storagePool.findMany({ include: { host: true } });
    res.json(pools);
});
app.post('/api/storage-pools', async (req, res) => {
    try {
        const { name, type, path: poolPath, hostId } = req.body;
        // Bei Docker-Volumes das Verzeichnis auf dem gewählten Host anlegen
        if (type === 'DOCKER_VOLUME') {
            const finalPath = poolPath || `/var/lib/docker/volumes/${name}/_data`;
            try {
                await runDockerCmd(hostId, `mkdir -p ${JSON.stringify(finalPath)}`);
            }
            catch { /* Verzeichnis könnte lokal nicht erreichbar sein */ }
            const pool = await prisma.storagePool.create({ data: { name, type, path: finalPath, hostId } });
            return res.json(pool);
        }
        const pool = await prisma.storagePool.create({ data: { name, type, path: poolPath, hostId } });
        res.json(pool);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/storage-pools/:id', async (req, res) => {
    try {
        await prisma.storagePool.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- ZFS POOLS ---
app.get('/api/zfs', async (req, res) => {
    const pools = await prisma.zFSPool.findMany({ include: { host: true } });
    res.json(pools);
});
app.delete('/api/zfs/:id', async (req, res) => {
    try {
        await prisma.zFSPool.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- HARDWARE PASSTHROUGH ---
app.get('/api/passthrough', async (req, res) => {
    const devices = await prisma.hardwarePassthrough.findMany({ include: { host: true } });
    res.json(devices);
});
app.post('/api/passthrough', async (req, res) => {
    try {
        const { type, deviceId, description, guestType, guestId, hostId } = req.body;
        const device = await prisma.hardwarePassthrough.create({ data: { type, deviceId, description, guestType, guestId, hostId } });
        res.json(device);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/passthrough/:id', async (req, res) => {
    try {
        await prisma.hardwarePassthrough.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- LOCAL DOCKER HOST FILESYSTEM (gatecore-host-access agent) ---
app.get('/api/files/host/local', async (req, res) => {
    try {
        const dirPath = req.query.path || '/';
        const files = await fileManagerService_1.FileManagerService.listLocalHostFiles(dirPath);
        res.json(files);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/files/host/local/read', async (req, res) => {
    try {
        const filePath = req.query.path;
        const content = await fileManagerService_1.FileManagerService.readLocalHostFile(filePath);
        res.json({ content });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/files/host/local/save', async (req, res) => {
    try {
        const { path: filePath, content } = req.body;
        const result = await fileManagerService_1.FileManagerService.saveLocalHostFile(filePath, content);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/files/host/local', async (req, res) => {
    try {
        const filePath = req.query.path;
        const result = await fileManagerService_1.FileManagerService.deleteLocalHostFile(filePath);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- LOCAL DOCKER CONTAINERS (this Docker daemon) ---
app.get('/api/docker/instances', async (req, res) => {
    try {
        const { execSync } = require('child_process');
        const stdout = execSync(`docker ps --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}'`, { encoding: 'utf8' });
        const containers = stdout
            .split('\n')
            .filter(Boolean)
            .map((line) => {
            const [id, name, image, ...rest] = line.split('\t');
            return { id, name, image, status: rest.join('\t') };
        });
        res.json(containers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/files/docker/container/local', async (req, res) => {
    try {
        const container = req.query.container;
        const dirPath = req.query.path || '/';
        const files = await fileManagerService_1.FileManagerService.listLocalDockerContainerFiles(container, dirPath);
        res.json(files);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/files/docker/container/local/read', async (req, res) => {
    try {
        const container = req.query.container;
        const filePath = req.query.path;
        const content = await fileManagerService_1.FileManagerService.readLocalDockerContainerFile(container, filePath);
        res.json({ content });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/files/docker/container/local/save', async (req, res) => {
    try {
        const { container, path: filePath, content } = req.body;
        const result = await fileManagerService_1.FileManagerService.saveLocalDockerContainerFile(container, filePath, content);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/files/docker/container/local', async (req, res) => {
    try {
        const container = req.query.container;
        const filePath = req.query.path;
        const result = await fileManagerService_1.FileManagerService.deleteLocalDockerContainerFile(container, filePath);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- HOST DOCKER CONTAINERS (lokal via Socket, remote per SSH) ---
app.get('/api/hosts/:id/docker-containers', async (req, res) => {
    try {
        const host = await prisma.host.findUnique({ where: { id: req.params.id } });
        if (!host)
            throw new Error('Host not found');
        let stdout;
        if (host.isLocal || host.ip === '127.0.0.1' || !host.sshKeyPath) {
            const { execSync } = require('child_process');
            stdout = execSync(`docker ps --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}'`, { encoding: 'utf8' });
        }
        else {
            stdout = await sshService_1.SSHService.executeCommand(host.ip, `docker ps --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}'`, host.sshKeyPath);
        }
        const containers = stdout
            .split('\n')
            .filter(Boolean)
            .map((line) => {
            const [id, name, image, ...rest] = line.split('\t');
            return { id, name, image, status: rest.join('\t') };
        });
        res.json(containers);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- DOCKER CONTAINER FILE MANAGER (per SSH) ---
app.get('/api/files/docker/container', async (req, res) => {
    try {
        const hostId = req.query.hostId;
        const container = req.query.container;
        const dirPath = req.query.path || '/';
        const files = await fileManagerService_1.FileManagerService.listDockerContainerFiles(hostId, container, dirPath);
        res.json(files);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/files/docker/container/read', async (req, res) => {
    try {
        const hostId = req.query.hostId;
        const container = req.query.container;
        const filePath = req.query.path;
        const content = await fileManagerService_1.FileManagerService.readDockerContainerFile(hostId, container, filePath);
        res.json({ content });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/files/docker/container/save', async (req, res) => {
    try {
        const { hostId, container, path: filePath, content } = req.body;
        const result = await fileManagerService_1.FileManagerService.saveDockerContainerFile(hostId, container, filePath, content);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.delete('/api/files/docker/container', async (req, res) => {
    try {
        const hostId = req.query.hostId;
        const container = req.query.container;
        const filePath = req.query.path;
        const result = await fileManagerService_1.FileManagerService.deleteDockerContainerFile(hostId, container, filePath);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- FILE DELETE ---
app.delete('/api/files/host', async (req, res) => {
    try {
        const filePath = req.query.path;
        const hostId = req.query.hostId;
        const result = await fileManagerService_1.FileManagerService.deleteHostFile(filePath, hostId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- CLUSTER DELETE ---
app.delete('/api/cluster/nodes/:id', async (req, res) => {
    try {
        await prisma.clusterNode.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- TEMPLATES JSON API ---
app.get('/api/templates', (req, res) => {
    const templatesPath = path.join(process.cwd(), 'templates.json');
    if (fs.existsSync(templatesPath)) {
        const data = fs.readFileSync(templatesPath, 'utf8');
        return res.json(JSON.parse(data));
    }
    res.json({ lxcTemplates: [], isoImages: [] });
});
// --- CLUSTER NODES & API KEYS ---
app.get('/api/cluster/nodes', async (req, res) => {
    const nodes = await prisma.clusterNode.findMany();
    res.json(nodes);
});
app.post('/api/cluster/nodes', async (req, res) => {
    const { name, endpoint, apiKey } = req.body;
    const node = await prisma.clusterNode.create({
        data: { name, endpoint, apiKey, status: 'CONNECTED' },
    });
    res.json(node);
});
// --- FILE MANAGER API ---
app.get('/api/files/host', async (req, res) => {
    try {
        const dirPath = req.query.path || '/';
        const hostId = req.query.hostId;
        const files = await fileManagerService_1.FileManagerService.listHostFiles(dirPath, hostId);
        res.json(files);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/files/host/read', async (req, res) => {
    try {
        const filePath = req.query.path;
        const hostId = req.query.hostId;
        const content = await fileManagerService_1.FileManagerService.readFileContent(filePath, hostId);
        res.json({ content });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post('/api/files/host/save', async (req, res) => {
    try {
        const { path: filePath, content, hostId } = req.body;
        const result = await fileManagerService_1.FileManagerService.saveFileContent(filePath, content, hostId);
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- WEBSOCKET SHELL FOR DOCKER CONTAINER ---
app.ws('/ws/docker/shell/:containerName', (ws, req) => {
    const { containerName } = req.params;
    const { spawn } = require('child_process');
    const shell = spawn('docker', ['exec', '-it', containerName, '/bin/sh']);
    shell.stdout.on('data', (data) => ws.send(data.toString()));
    shell.stderr.on('data', (data) => ws.send(data.toString()));
    ws.on('message', (msg) => {
        shell.stdin.write(msg);
    });
    ws.on('close', () => {
        shell.kill();
    });
});
// Fallback for React Router (Single Page App)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});
async function ensureLocalHost() {
    try {
        const localHost = await prisma.host.findFirst({ where: { isLocal: true } });
        if (!localHost) {
            await prisma.host.create({
                data: {
                    id: 'local-docker-host',
                    name: 'Docker Host (Panel)',
                    ip: '127.0.0.1',
                    port: 22,
                    username: 'local',
                    osType: 'docker',
                    capabilities: ['DOCKER'],
                    status: 'ONLINE',
                    isLocal: true,
                },
            });
            console.log('Lokaler Docker-Host wurde angelegt.');
        }
    }
    catch (err) {
        console.error('Error seeding local host:', err);
    }
}
async function seedDefaultUser() {
    try {
        const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
        if (!adminExists) {
            const hashedPassword = await bcryptjs_1.default.hash('admin', 10);
            await prisma.user.create({
                data: {
                    username: 'admin',
                    password: hashedPassword,
                    role: 'ADMIN',
                },
            });
            console.log('Default admin user created: admin / admin');
        }
    }
    catch (err) {
        console.error('Error seeding default user:', err);
    }
}
app.listen(PORT, async () => {
    await ensureLocalHost();
    await seedDefaultUser();
    console.log(`GateCore Server running on port ${PORT}`);
});
