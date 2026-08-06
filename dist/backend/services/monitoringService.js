"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const util_1 = require("util");
const sshService_1 = require("./sshService");
const prisma = new client_1.PrismaClient();
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class MonitoringService {
    /** Führt einen Befehl aus – lokal (exec) oder remote (SSH) */
    static async execute(host, cmd) {
        if (host.isLocal || host.ip === '127.0.0.1' || !host.sshKeyPath) {
            const { stdout } = await execAsync(cmd, { encoding: 'utf8', timeout: 15000 });
            return stdout;
        }
        return await sshService_1.SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
    }
    static async getHost(hostId) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host)
            throw new Error('Host not found');
        return host;
    }
    /**
     * Liest die CPU-Auslastung aus /proc/stat (2 Messungen, ~200ms Abstand).
     */
    static async getCpuUsage(host) {
        const readCpu = async () => {
            const out = await this.execute(host, `cat /proc/stat | grep '^cpu '`);
            const parts = out.trim().split(/\s+/).slice(1).map(Number);
            const idle = parts[3] + (parts[4] || 0);
            const total = parts.reduce((a, b) => a + b, 0);
            return { idle, total };
        };
        const coresOut = await this.execute(host, `nproc`);
        const cores = parseInt(coresOut.trim()) || 1;
        const loadAvgOut = await this.execute(host, `cat /proc/loadavg`);
        const loadAvg = loadAvgOut.trim().split(/\s+/).slice(0, 3).map(Number);
        const s1 = await readCpu();
        await new Promise((r) => setTimeout(r, 200));
        const s2 = await readCpu();
        const totalDiff = s2.total - s1.total;
        const idleDiff = s2.idle - s1.idle;
        const usagePercent = totalDiff > 0 ? Math.round(((totalDiff - idleDiff) / totalDiff) * 1000) / 10 : 0;
        return { usagePercent, cores, loadAvg };
    }
    /**
     * Liest Speicher-Informationen aus `free -m`.
     */
    static async getMemory(host) {
        const out = await this.execute(host, `free -m | grep '^Mem:'`);
        const parts = out.trim().split(/\s+/).slice(1).map(Number);
        const totalMB = parts[0] || 0;
        const usedMB = parts[1] || 0;
        const totalGB = Math.round((totalMB / 1024) * 100) / 100;
        const usedGB = Math.round((usedMB / 1024) * 100) / 100;
        const freeGB = Math.round(((totalMB - usedMB) / 1024) * 100) / 100;
        const usedPercent = totalMB > 0 ? Math.round((usedMB / totalMB) * 1000) / 10 : 0;
        return { totalGB, usedGB, freeGB, usedPercent };
    }
    /**
     * Liest Disk-Informationen: Gruppiert nach physischer Festplatte
     * (nicht pro Mount-Pfad), damit z.B. 5 Pfade auf 1 Festplatte = 1 Eintrag.
     * Nutzt `lsblk` zur Gerätezuordnung und `df` zur Auslastung.
     */
    static async getDisks(host) {
        // Schritt 1: Hole Zuordnung Gerät → Mount mit lsblk (JSON)
        let deviceMap = {};
        try {
            const lsblkOut = await this.execute(host, `lsblk -J -o NAME,TYPE,FSTYPE,MOUNTPOINT,SIZE 2>/dev/null`);
            const lsblk = JSON.parse(lsblkOut);
            const walk = (devs) => {
                for (const d of devs) {
                    if (d.children && d.children.length > 0) {
                        walk(d.children);
                    }
                    if (d.mountpoint && d.name) {
                        deviceMap[d.mountpoint] = `/dev/${d.name}`;
                    }
                }
            };
            walk(lsblk.blockdevices || []);
        }
        catch {
            // lsblk-json nicht verfügbar → Fallback
        }
        // Schritt 2: df auswerten und nach Gerät gruppieren
        const dfOut = await this.execute(host, `df -hP | awk 'NR>1 {print $1"|"$2"|"$3"|"$4"|"$5"|"$6}' | grep -vE '^(tmpfs|devtmpfs|overlay|shm|udev|snap|loop|none)'`);
        const toGB = (val) => {
            if (val.endsWith('T'))
                return parseFloat(val.slice(0, -1)) * 1024;
            if (val.endsWith('G'))
                return parseFloat(val.slice(0, -1));
            if (val.endsWith('M'))
                return parseFloat(val.slice(0, -1)) / 1024;
            return parseFloat(val) || 0;
        };
        // Map: deviceName → { mount, totalGB, usedGB, freeGB, usedPercent, partitions }
        const diskMap = new Map();
        for (const line of dfOut.trim().split('\n').filter(Boolean)) {
            const [device, total, used, free, pct, mount] = line.split('|');
            // Bestimme physisches Gerät
            const physicalDevice = deviceMap[mount] || device;
            const entry = diskMap.get(physicalDevice);
            const tGB = toGB(total);
            const uGB = toGB(used);
            const fGB = toGB(free);
            if (entry) {
                // Nur hinzufügen wenn diese Partition noch nicht gezählt wurde
                // (df zeigt oft dieselbe Größe für übergeordnetes Gerät + Partition)
                if (entry.mounts.includes(mount))
                    continue;
                entry.mounts.push(mount);
                // Für Partitions-Summen: nur additive Zählung vermeiden
                // Wir nehmen den MAX von total (nicht SUM), da df für ein Device die gleiche Größe zeigt
                entry.totalGB = Math.max(entry.totalGB, tGB);
                entry.usedGB = Math.max(entry.usedGB, uGB);
                entry.freeGB = Math.min(entry.freeGB, fGB);
                entry.partCount++;
            }
            else {
                diskMap.set(physicalDevice, {
                    mounts: [mount],
                    totalGB: tGB,
                    usedGB: uGB,
                    freeGB: fGB,
                    partCount: 1,
                });
            }
        }
        // Ergebnis als Array
        return Array.from(diskMap.entries()).map(([device, info]) => ({
            mount: device + ' → ' + info.mounts.join(', '),
            totalGB: Math.round(info.totalGB * 100) / 100,
            usedGB: Math.round(info.usedGB * 100) / 100,
            freeGB: Math.round(info.freeGB * 100) / 100,
            usedPercent: info.totalGB > 0 ? Math.round((info.usedGB / info.totalGB) * 1000) / 10 : 0,
        }));
    }
    /**
     * Liest Netzwerk-Statistiken aus /proc/net/dev.
     */
    static async getNetwork(host) {
        const out = await this.execute(host, `cat /proc/net/dev | awk 'NR>2 {gsub(":", "", $1); if ($1 != "lo") print $1"|"$2"|"$10}'`);
        return out
            .trim()
            .split('\n')
            .filter(Boolean)
            .map((line) => {
            const [iface, rx, tx] = line.split('|');
            return { iface, rxBytes: parseInt(rx) || 0, txBytes: parseInt(tx) || 0 };
        });
    }
    /**
     * Liest Uptime aus /proc/uptime.
     */
    static async getUptime(host) {
        const out = await this.execute(host, `cat /proc/uptime`);
        const seconds = Math.floor(parseFloat(out.trim().split(/\s+/)[0]) || 0);
        return {
            days: Math.floor(seconds / 86400),
            hours: Math.floor((seconds % 86400) / 3600),
            minutes: Math.floor((seconds % 3600) / 60),
        };
    }
    /**
     * Liest OS-Info aus /etc/os-release.
     */
    static async getOsInfo(host) {
        let out = '';
        try {
            out = await this.execute(host, `grep -E '^(PRETTY_NAME|NAME|VERSION_ID)=' /etc/os-release`);
        }
        catch {
            return { name: 'Unknown', version: '' };
        }
        const nameMatch = out.match(/PRETTY_NAME="?([^"\n]+)"?/);
        const name = nameMatch ? nameMatch[1] : 'Unknown';
        const versionMatch = out.match(/VERSION_ID="?([^"\n]+)"?/);
        return { name, version: versionMatch ? versionMatch[1] : '' };
    }
    /**
     * Liefert alle System-Metriken eines Hosts.
     */
    static async getMetrics(hostId) {
        const host = await this.getHost(hostId);
        const hostname = (await this.execute(host, `hostname`)).trim();
        const [cpu, memory, disks, network, uptime, os] = await Promise.all([
            this.getCpuUsage(host),
            this.getMemory(host),
            this.getDisks(host),
            this.getNetwork(host),
            this.getUptime(host),
            this.getOsInfo(host),
        ]);
        return { cpu, memory, disks, network, uptime, os, hostname };
    }
    /**
     * Liefert die Top-Prozesse eines Hosts nach CPU-Auslastung.
     */
    static async getTopProcesses(hostId, limit = 10) {
        const host = await this.getHost(hostId);
        const count = limit + 1;
        const out = await this.execute(host, `ps -eo pid,user,pcpu,pmem,comm --sort=-pcpu | head -${count}`);
        return out
            .trim()
            .split('\n')
            .slice(1)
            .filter(Boolean)
            .map((line) => {
            const parts = line.trim().split(/\s+/);
            return {
                pid: parseInt(parts[0]),
                user: parts[1],
                cpuPercent: parseFloat(parts[2]) || 0,
                memPercent: parseFloat(parts[3]) || 0,
                command: parts.slice(4).join(' ') || '',
            };
        })
            .slice(0, limit);
    }
    /**
     * Speichert aktuelle Metriken in die Verlaufstabelle.
     */
    static async storeMetricSnapshot(hostId) {
        try {
            const metrics = await this.getMetrics(hostId);
            const diskTotal = metrics.disks.reduce((a, d) => a + d.totalGB, 0);
            const diskUsed = metrics.disks.reduce((a, d) => a + d.usedGB, 0);
            const netRx = metrics.network.reduce((a, n) => a + n.rxBytes, 0);
            const netTx = metrics.network.reduce((a, n) => a + n.txBytes, 0);
            await prisma.systemMetricHistory.create({
                data: {
                    hostId,
                    cpuUsage: metrics.cpu.usagePercent,
                    ramUsedGB: metrics.memory.usedGB,
                    ramTotalGB: metrics.memory.totalGB,
                    diskUsedGB: diskUsed,
                    diskTotalGB: diskTotal,
                    networkRx: netRx,
                    networkTx: netTx,
                },
            });
            // Alte Einträge löschen (nur letzte 48h behalten)
            const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
            await prisma.systemMetricHistory.deleteMany({
                where: { hostId, createdAt: { lt: cutoff } },
            });
        }
        catch {
            // Metriken im Fehlerfall nicht speichern (Host offline etc.)
        }
    }
    /**
     * Liefert den Metrik-Verlauf eines Hosts (aufsteigend nach Zeit).
     * BigInt-Felder (networkRx/networkTx) werden zu Number konvertiert,
     * da JSON.stringify BigInt nicht serialisieren kann.
     */
    static async getMetricHistory(hostId, minutes = 60) {
        const since = new Date(Date.now() - minutes * 60 * 1000);
        const rows = await prisma.systemMetricHistory.findMany({
            where: { hostId, createdAt: { gte: since } },
            orderBy: { createdAt: 'asc' },
        });
        return rows.map((r) => ({
            ...r,
            networkRx: Number(r.networkRx),
            networkTx: Number(r.networkTx),
        }));
    }
}
exports.MonitoringService = MonitoringService;
