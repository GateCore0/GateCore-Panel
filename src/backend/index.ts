import express from 'express';
import expressWs from 'express-ws';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { SSHService } from './services/sshService';
import { HypervisorService } from './services/hypervisorService';
import { DockerService } from './services/dockerService';
import { FileManagerService } from './services/fileManagerService';
import { LDAPService } from './services/ldapService';
import { MonitoringService } from './services/monitoringService';
import { ApiKeyService } from './services/apiKeyService';

const { app } = expressWs(express());
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'gatecore-super-secret-key';

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serving Static Frontend Files in Production
app.use(express.static(path.join(__dirname, '../../frontend/dist')));

// --- AUTHENTICATION MIDDLEWARE ---
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.gatecore_token;
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    (req as any).user = user;
    next();
  });
};

// --- AUTHENTICATION & USERS ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  // 1. Local Database Login
  const user = await prisma.user.findUnique({ where: { username } });
  if (user) {
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
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
  const ldapSuccess = await LDAPService.authenticate(username, password);
  if (ldapSuccess) {
    const token = jwt.sign({ username, role: 'USER', isLdap: true }, JWT_SECRET, { expiresIn: '24h' });
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
  res.json({ user: (req as any).user });
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
  const hashedPassword = await bcrypt.hash(password, 10);
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
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: req.params.id }, data: { password: hashedPassword } });
    res.json({ success: true });
  } catch (error: any) {
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
    const setupResult = await SSHService.setupHypervisorHost({
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
  } catch (error: any) {
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
async function dockerHost(): Promise<any | null> {
  const localHost = await prisma.host.findFirst({ where: { isLocal: true } });
  return localHost || null;
}

/** Führt einen Docker-Befehl auf dem gewählten Host aus (lokal via Unix-Socket, remote per SSH). */
async function runDockerCmd(hostId: string | undefined, cmd: string): Promise<string> {
  const host = hostId ? await prisma.host.findUnique({ where: { id: hostId } }) : await dockerHost();
  if (!host || host.isLocal || !host.sshKeyPath || host.ip === '127.0.0.1') {
    const { execSync } = require('child_process');
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
  }
  return await SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
}

app.get('/api/docker/containers', async (req, res) => {
  try {
    const hostId = req.query.hostId as string | undefined;
    let real: any[] = [];
    try {
      const stdout = await runDockerCmd(hostId, `docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}'`);
      real = stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line: string) => {
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
            hostId: hostId || null,
          };
        });
    } catch { /* Docker nicht erreichbar → nur DB */ }

    // DB-Container ergänzen (falls dort zusätzlich verwaltet)
    const dbContainers = await prisma.dockerContainer.findMany({
      where: hostId ? { hostId } : {},
      include: { host: true },
    });
    const existingNames = new Set(real.map((c) => c.name));
    for (const dbc of dbContainers) {
      if (!existingNames.has(dbc.name)) {
        real.push({ ...dbc, isRealDocker: false });
      }
    }

    // Host-Namen auflösen (für Anzeige "Host" in der Tabelle)
    const hostMap = new Map<string, string>();
    const ids = new Set<string>();
    for (const c of real) {
      if (c.hostId) {
        ids.add(c.hostId);
        if (c.host?.name) hostMap.set(c.hostId, c.host.name);
      }
    }
    if (ids.size > 0) {
      const hosts = await prisma.host.findMany({ where: { id: { in: [...ids] } } });
      for (const h of hosts) {
        hostMap.set(h.id, h.name);
      }
    }
    for (const c of real) {
      if (c.hostId && hostMap.has(c.hostId)) {
        c.host = { name: hostMap.get(c.hostId) };
      }
    }
    res.json(real);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/docker/containers', async (req, res) => {
  try {
    const { name, image, volumeName, mountPath, hostId } = req.body;
    const result = await DockerService.createContainer({ name, image, volumeName, mountPath, hostId });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/docker/containers/:id/action', async (req, res) => {
  try {
    const { action } = req.body;
    const { id } = req.params;
    const hostId = req.body.hostId as string | undefined;
    const result = await DockerService.containerAction(id, action, hostId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/docker/containers/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.query.hostId as string | undefined;
    const lines = Number(req.query.lines) || 200;
    const logs = await DockerService.containerLogs(id, lines, hostId);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Container-Konfiguration auslesen (Ports & Volumes)
app.get('/api/docker/containers/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.query.hostId as string | undefined;
    const details = await DockerService.containerDetails(id, hostId);
    res.json(details);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Container-Konfiguration aktualisieren (Ports freigeben/blockieren, Volumes hinzufügen/entfernen)
app.put('/api/docker/containers/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, ports, volumes } = req.body;
    const hostId = req.body.hostId as string | undefined;
    const result = await DockerService.updateContainerConfig(id, { action, ports, volumes, hostId });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/docker/containers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.query.hostId as string | undefined;
    try {
      await DockerService.deleteContainer(id, hostId);
    } catch { /* Nicht als echter Container gefunden */ }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/docker/volumes', async (req, res) => {
  try {
    const { volumeName, hostId, path: volumePath } = req.body;
    const result = await DockerService.createVolume(volumeName, hostId, volumePath);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/docker/volumes', async (req, res) => {
  try {
    const hostId = req.query.hostId as string | undefined;
    let real: any[] = [];
    try {
      const stdout = await runDockerCmd(hostId, `docker volume ls --format '{{.Name}}'`);
      real = stdout.trim().split('\n').filter(Boolean).map((line) => ({ name: line }));
    } catch { /* Docker nicht erreichbar */ }

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
      if (poolNames.has(v.name)) return v;
      return { ...v, id: null, isPool: false, path: null };
    });
    res.json(real);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Docker-Volume löschen
app.delete('/api/docker/volumes/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const hostId = req.query.hostId as string | undefined;
    // Zuerst StoragePool-Eintrag löschen (falls vorhanden)
    await prisma.storagePool.deleteMany({ where: { name, type: 'DOCKER_VOLUME' } });
    // Docker-Volume löschen (falls real vorhanden)
    try {
      await runDockerCmd(hostId, `docker volume rm ${name} 2>/dev/null || true`);
      // Falls Verzeichnis existiert (bei manuell erstellten Volumes)
      await runDockerCmd(hostId, `rm -rf /var/lib/docker/volumes/${name} 2>/dev/null || true`);
    } catch { /* not real docker */ }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Docker-Volume umbenennen
app.put('/api/docker/volumes/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { newName, hostId } = req.body;
    if (!newName || !name) return res.status(400).json({ error: 'name and newName required' });

    // Docker-Volume umbenennen (falls real vorhanden)
    try {
      await runDockerCmd(hostId, `docker volume create ${newName} >/dev/null 2>&1`);
      // Daten kopieren
      await runDockerCmd(hostId, `cp -a /var/lib/docker/volumes/${name}/_data /. ${newName} 2>/dev/null || true`);
      await runDockerCmd(hostId, `cp -a /var/lib/docker/volumes/${name}/_data /var/lib/docker/volumes/${newName}/_data 2>/dev/null || true`);
      await runDockerCmd(hostId, `docker volume rm ${name} 2>/dev/null || true`);
    } catch { /* not real docker */ }

    // StoragePool-Eintrag umbenennen (falls vorhanden)
    await prisma.storagePool.updateMany({
      where: { name, type: 'DOCKER_VOLUME' },
      data: { name: newName },
    });

    res.json({ success: true, name: newName });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/docker/compose', async (req, res) => {
  const hostId = req.query.hostId as string | undefined;
  const projects = await prisma.dockerComposeProject.findMany({ where: { hostId: hostId || null } });
  res.json(projects);
});

app.post('/api/docker/compose', async (req, res) => {
  try {
    const { name, content, hostId } = req.body;
    const project = await DockerService.createComposeProject(name, content, hostId);
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/docker/compose/:id/action', async (req, res) => {
  try {
    const { action } = req.body;
    const { id } = req.params;
    const hostId = req.body.hostId as string | undefined;
    const result = await DockerService.composeAction(id, action, hostId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/docker/compose/:id/logs', async (req, res) => {
  try {
    const { id } = req.params;
    const hostId = req.query.hostId as string | undefined;
    const logs = await DockerService.composeLogs(id, 200, hostId);
    res.json({ logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/docker/compose/:id', async (req, res) => {
  try {
    const hostId = req.query.hostId as string | undefined;
    await DockerService.deleteComposeProject(req.params.id, hostId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- VMS, LXC & PODMAN ---
app.post('/api/vm', async (req, res) => {
  const { hostId, name, vcpus, memoryMB, diskSizeGB, storagePath } = req.body;
  const vm = await HypervisorService.createVM(hostId, name, Number(vcpus), Number(memoryMB), Number(diskSizeGB), storagePath);
  res.json(vm);
});

app.post('/api/lxc', async (req, res) => {
  const { hostId, name, template, memoryMB, storagePath } = req.body;
  const lxc = await HypervisorService.createLXCContainer(hostId, name, template, Number(memoryMB), storagePath);
  res.json(lxc);
});

app.post('/api/podman', async (req, res) => {
  const { hostId, name, image } = req.body;
  const podman = await HypervisorService.createPodmanContainer(hostId, name, image);
  res.json(podman);
});

// --- MONITORING ---
app.get('/api/hosts/:id/metrics', async (req, res) => {
  try {
    const metrics = await MonitoringService.getMetrics(req.params.id);
    res.json(metrics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hosts/:id/processes', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const processes = await MonitoringService.getTopProcesses(req.params.id, limit);
    res.json(processes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hosts/:id/metrics/history', async (req, res) => {
  try {
    const minutes = parseInt(req.query.minutes as string) || 60;
    const history = await MonitoringService.getMetricHistory(req.params.id, minutes);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- STORAGE & ZFS & DISK ---
app.post('/api/zfs', async (req, res) => {
  const { hostId, poolName, raidLevel, disks } = req.body;
  const result = await HypervisorService.createZFSPool(hostId, poolName, raidLevel, disks);
  res.json({ result });
});

app.post('/api/disks/format', async (req, res) => {
  const { hostId, devicePath, fsType } = req.body;
  const result = await HypervisorService.formatDisk(hostId, devicePath, fsType);
  res.json({ result });
});

app.get('/api/hardware/:hostId', async (req, res) => {
  try {
    const devices = await HypervisorService.listHardwareDevices(req.params.hostId);
    res.json(devices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hosts/:id/disks', async (req, res) => {
  try {
    const disks = await HypervisorService.listDisks(req.params.id);
    res.json(disks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- HYPERVISOR DELETE ---
app.delete('/api/hypervisors/:id', async (req, res) => {
  try {
    await prisma.host.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- VM / LXC / PODMAN DELETE ---
app.delete('/api/vm/:id', async (req, res) => {
  try {
    await prisma.vM.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/lxc/:id', async (req, res) => {
  try {
    await prisma.lXCContainer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/podman/:id', async (req, res) => {
  try {
    await prisma.podmanContainer.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
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
      } catch { /* Verzeichnis könnte lokal nicht erreichbar sein */ }
      const pool = await prisma.storagePool.create({ data: { name, type, path: finalPath, hostId } });
      return res.json(pool);
    }
    const pool = await prisma.storagePool.create({ data: { name, type, path: poolPath, hostId } });
    res.json(pool);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/storage-pools/:id', async (req, res) => {
  try {
    await prisma.storagePool.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/passthrough/:id', async (req, res) => {
  try {
    await prisma.hardwarePassthrough.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- LOCAL DOCKER HOST FILESYSTEM (gatecore-host-access agent) ---
app.get('/api/files/host/local', async (req, res) => {
  try {
    const dirPath = (req.query.path as string) || '/';
    const files = await FileManagerService.listLocalHostFiles(dirPath);
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/host/local/read', async (req, res) => {
  try {
    const filePath = req.query.path as string;
    const content = await FileManagerService.readLocalHostFile(filePath);
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/host/local/save', async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    const result = await FileManagerService.saveLocalHostFile(filePath, content);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/files/host/local', async (req, res) => {
  try {
    const filePath = req.query.path as string;
    const result = await FileManagerService.deleteLocalHostFile(filePath);
    res.json(result);
  } catch (error: any) {
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
      .map((line: string) => {
        const [id, name, image, ...rest] = line.split('\t');
        return { id, name, image, status: rest.join('\t') };
      });
    res.json(containers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/docker/container/local', async (req, res) => {
  try {
    const container = req.query.container as string;
    const dirPath = (req.query.path as string) || '/';
    const files = await FileManagerService.listLocalDockerContainerFiles(container, dirPath);
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/docker/container/local/read', async (req, res) => {
  try {
    const container = req.query.container as string;
    const filePath = req.query.path as string;
    const content = await FileManagerService.readLocalDockerContainerFile(container, filePath);
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/docker/container/local/save', async (req, res) => {
  try {
    const { container, path: filePath, content } = req.body;
    const result = await FileManagerService.saveLocalDockerContainerFile(container, filePath, content);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/files/docker/container/local', async (req, res) => {
  try {
    const container = req.query.container as string;
    const filePath = req.query.path as string;
    const result = await FileManagerService.deleteLocalDockerContainerFile(container, filePath);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- HOST DOCKER CONTAINERS (lokal via Socket, remote per SSH) ---
app.get('/api/hosts/:id/docker-containers', async (req, res) => {
  try {
    const host = await prisma.host.findUnique({ where: { id: req.params.id } });
    if (!host) throw new Error('Host not found');

    let stdout: string;
    if (host.isLocal || host.ip === '127.0.0.1' || !host.sshKeyPath) {
      const { execSync } = require('child_process');
      stdout = execSync(`docker ps --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}'`, { encoding: 'utf8' });
    } else {
      stdout = await SSHService.executeCommand(
        host.ip,
        `docker ps --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}'`,
        host.sshKeyPath
      );
    }

    const containers = stdout
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const [id, name, image, ...rest] = line.split('\t');
        return { id, name, image, status: rest.join('\t') };
      });

    res.json(containers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- DOCKER CONTAINER FILE MANAGER (per SSH) ---
app.get('/api/files/docker/container', async (req, res) => {
  try {
    const hostId = req.query.hostId as string;
    const container = req.query.container as string;
    const dirPath = (req.query.path as string) || '/';
    const files = await FileManagerService.listDockerContainerFiles(hostId, container, dirPath);
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/docker/container/read', async (req, res) => {
  try {
    const hostId = req.query.hostId as string;
    const container = req.query.container as string;
    const filePath = req.query.path as string;
    const content = await FileManagerService.readDockerContainerFile(hostId, container, filePath);
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/docker/container/save', async (req, res) => {
  try {
    const { hostId, container, path: filePath, content } = req.body;
    const result = await FileManagerService.saveDockerContainerFile(hostId, container, filePath, content);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/files/docker/container', async (req, res) => {
  try {
    const hostId = req.query.hostId as string;
    const container = req.query.container as string;
    const filePath = req.query.path as string;
    const result = await FileManagerService.deleteDockerContainerFile(hostId, container, filePath);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- FILE DELETE ---
app.delete('/api/files/host', async (req, res) => {
  try {
    const filePath = req.query.path as string;
    const hostId = req.query.hostId as string | undefined;
    const result = await FileManagerService.deleteHostFile(filePath, hostId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- CLUSTER NODES & API KEYS (sichere API-Key-Generierung) ---

// Middleware: Authentifizierung eines Cluster-Nodes per API-Key
const authenticateClusterKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const apiKey = (authHeader && authHeader.split(' ')[1]) || (req.query.apiKey as string) || (req.body?.apiKey as string);
  if (!apiKey) return res.status(401).json({ error: 'API key required' });

  const node = await ApiKeyService.validateKey(apiKey, prisma);
  if (!node) return res.status(403).json({ error: 'Invalid or revoked API key' });

  (req as any).clusterNode = node;
  next();
};

// Alle Cluster-Nodes auflisten (ohne Klartext-Keys – nur Preview)
app.get('/api/cluster/nodes', async (req, res) => {
  const nodes = await prisma.clusterNode.findMany({
    select: {
      id: true,
      name: true,
      endpoint: true,
      apiKeyPreview: true,
      status: true,
      description: true,
      lastUsedAt: true,
      expiresAt: true,
      revoked: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json(nodes);
});

// Neuen Cluster-Node mit automatisch generiertem API-Key anlegen
app.post('/api/cluster/nodes', async (req, res) => {
  const { name, endpoint, description, expiresInDays } = req.body;
  if (!name || !endpoint) return res.status(400).json({ error: 'name and endpoint are required' });

  const { plainTextKey, keyHash, preview } = ApiKeyService.generate();

  const node = await prisma.clusterNode.create({
    data: {
      name,
      endpoint,
      apiKeyHash: keyHash,
      apiKeyPreview: preview,
      status: 'PENDING',
      description: description || null,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
    },
  });

  // Klartext-Key wird NUR hier einmalig zurückgegeben
  res.json({
    ...node,
    apiKey: plainTextKey, // Einmalige Anzeige!
    warning: 'Store this key securely. It will only be shown once.',
  });
});

// Cluster-Node löschen
app.delete('/api/cluster/nodes/:id', async (req, res) => {
  try {
    await prisma.clusterNode.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API-Key widerrufen (revoke)
app.post('/api/cluster/nodes/:id/revoke', async (req, res) => {
  try {
    await prisma.clusterNode.update({
      where: { id: req.params.id },
      data: { revoked: true, status: 'DISCONNECTED' },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Neuen API-Key für einen bestehenden Node generieren (Rotation)
app.post('/api/cluster/nodes/:id/rotate-key', async (req, res) => {
  try {
    const node = await prisma.clusterNode.findUnique({ where: { id: req.params.id } });
    if (!node) return res.status(404).json({ error: 'Node not found' });

    const { plainTextKey, keyHash, preview } = ApiKeyService.generate();

    await prisma.clusterNode.update({
      where: { id: node.id },
      data: { apiKeyHash: keyHash, apiKeyPreview: preview, revoked: false, status: 'PENDING' },
    });

    res.json({
      success: true,
      apiKey: plainTextKey, // Einmalige Anzeige
      warning: 'Store this key securely. It will only be shown once.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- CLUSTER REGISTRIERUNG & HEARTBEAT (für Worker-Nodes) ---

// Worker-Node registriert sich selbst mit dem API-Key
app.post('/api/cluster/register', authenticateClusterKey, async (req, res) => {
  const clusterNode = (req as any).clusterNode;
  await prisma.clusterNode.update({
    where: { id: clusterNode.id },
    data: { status: 'CONNECTED', lastUsedAt: new Date() },
  });
  res.json({ success: true, nodeId: clusterNode.id, name: clusterNode.name });
});

// Heartbeat: Worker-Node meldet sich regelmäßig (hält Status "CONNECTED")
app.post('/api/cluster/heartbeat', authenticateClusterKey, async (req, res) => {
  const clusterNode = (req as any).clusterNode;
  await prisma.clusterNode.update({
    where: { id: clusterNode.id },
    data: { status: 'CONNECTED', lastUsedAt: new Date() },
  });
  res.json({ success: true, timestamp: new Date().toISOString() });
});

// Cluster-Health (kann mit API-Key abgefragt werden)
app.get('/api/cluster/health', async (req, res) => {
  const nodes = await prisma.clusterNode.findMany({
    select: { id: true, name: true, status: true, lastUsedAt: true, endpoint: true },
  });
  res.json({ status: 'ok', nodes });
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


// --- FILE MANAGER API ---
app.get('/api/files/host', async (req, res) => {
  try {
    const dirPath = (req.query.path as string) || '/';
    const hostId = req.query.hostId as string | undefined;
    const files = await FileManagerService.listHostFiles(dirPath, hostId);
    res.json(files);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/host/read', async (req, res) => {
  try {
    const filePath = req.query.path as string;
    const hostId = req.query.hostId as string | undefined;
    const content = await FileManagerService.readFileContent(filePath, hostId);
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/files/host/save', async (req, res) => {
  try {
    const { path: filePath, content, hostId } = req.body;
    const result = await FileManagerService.saveFileContent(filePath, content, hostId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- WEBSOCKET SHELL FOR DOCKER CONTAINER ---
app.ws('/ws/docker/shell/:containerName', (ws, req) => {
  const { containerName } = req.params;
  const { spawn } = require('child_process');
  const shell = spawn('docker', ['exec', '-it', containerName, '/bin/sh']);

  shell.stdout.on('data', (data: any) => ws.send(data.toString()));
  shell.stderr.on('data', (data: any) => ws.send(data.toString()));

  ws.on('message', (msg: string) => {
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
  } catch (err) {
    console.error('Error seeding local host:', err);
  }
}

async function seedDefaultUser() {
  try {
    const adminExists = await prisma.user.findUnique({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          role: 'ADMIN',
        },
      });
      console.log('Default admin user created: admin / admin');
    }
  } catch (err) {
    console.error('Error seeding default user:', err);
  }
}

app.listen(PORT, async () => {
  await ensureLocalHost();
  await seedDefaultUser();
  console.log(`GateCore Server running on port ${PORT}`);

  // --- MONITORING: Metrik-Snapshots alle 60 Sekunden speichern ---
  const storeAllSnapshots = async () => {
    try {
      const hosts = await prisma.host.findMany({ select: { id: true } });
      for (const h of hosts) {
        await MonitoringService.storeMetricSnapshot(h.id);
      }
    } catch (err) {
      console.error('Monitoring snapshot error:', err);
    }
  };

  storeAllSnapshots();
  setInterval(storeAllSnapshots, 60 * 1000);
});
