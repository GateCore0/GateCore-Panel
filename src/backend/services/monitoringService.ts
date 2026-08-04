import { PrismaClient } from '@prisma/client';
import { exec } from 'child_process';
import { promisify } from 'util';
import { SSHService } from './sshService';

const prisma = new PrismaClient();
const execAsync = promisify(exec);

export interface SystemMetrics {
  cpu: { usagePercent: number; cores: number; loadAvg: number[] };
  memory: { totalGB: number; usedGB: number; freeGB: number; usedPercent: number };
  disks: { mount: string; totalGB: number; usedGB: number; freeGB: number; usedPercent: number }[];
  network: { iface: string; rxBytes: number; txBytes: number }[];
  uptime: { days: number; hours: number; minutes: number };
  os: { name: string; version: string };
  hostname: string;
}

export interface ProcessInfo {
  pid: number;
  user: string;
  cpuPercent: number;
  memPercent: number;
  command: string;
}

export class MonitoringService {
  /** Führt einen Befehl aus – lokal (exec) oder remote (SSH) */
  private static async execute(host: any, cmd: string): Promise<string> {
    if (host.isLocal || host.ip === '127.0.0.1' || !host.sshKeyPath) {
      const { stdout } = await execAsync(cmd, { encoding: 'utf8', timeout: 15000 });
      return stdout;
    }
    return await SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
  }

  private static async getHost(hostId: string): Promise<any> {
    const host = await prisma.host.findUnique({ where: { id: hostId } });
    if (!host) throw new Error('Host not found');
    return host;
  }

  /**
   * Liest die CPU-Auslastung aus /proc/stat (2 Messungen, ~200ms Abstand).
   */
  private static async getCpuUsage(host: any): Promise<{ usagePercent: number; cores: number; loadAvg: number[] }> {
    const readCpu = async (): Promise<{ idle: number; total: number }> => {
      const out = await this.execute(host, `cat /proc/stat | grep '^cpu '`);
      const parts = out.trim().split(/\s+/).slice(1).map(Number);
      const idle = parts[3] + (parts[4] || 0);
      const total = parts.reduce((a: number, b: number) => a + b, 0);
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
  private static async getMemory(host: any): Promise<{ totalGB: number; usedGB: number; freeGB: number; usedPercent: number }> {
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
   * Liest Disk-Informationen aus `df -h` (filtert tmpfs/snap/overlay).
   */
  private static async getDisks(host: any): Promise<{ mount: string; totalGB: number; usedGB: number; freeGB: number; usedPercent: number }[]> {
    const out = await this.execute(
      host,
      `df -hP | awk 'NR>1 {print $1"|"$2"|"$3"|"$4"|"$5"|"$6}' | grep -vE '^(tmpfs|devtmpfs|overlay|shm|udev|snap|loop)'`
    );
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line: string) => {
        const [, total, used, free, pct, mount] = line.split('|');
        const toGB = (val: string) => {
          if (val.endsWith('G')) return parseFloat(val.slice(0, -1));
          if (val.endsWith('T')) return parseFloat(val.slice(0, -1)) * 1024;
          if (val.endsWith('M')) return parseFloat(val.slice(0, -1)) / 1024;
          return parseFloat(val) || 0;
        };
        return {
          mount: mount || '/',
          totalGB: toGB(total),
          usedGB: toGB(used),
          freeGB: toGB(free),
          usedPercent: parseInt((pct || '0').replace('%', '')) || 0,
        };
      });
  }

  /**
   * Liest Netzwerk-Statistiken aus /proc/net/dev.
   */
  private static async getNetwork(host: any): Promise<{ iface: string; rxBytes: number; txBytes: number }[]> {
    const out = await this.execute(
      host,
      `cat /proc/net/dev | awk 'NR>2 {gsub(":", "", $1); if ($1 != "lo") print $1"|"$2"|"$10}'`
    );
    return out
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line: string) => {
        const [iface, rx, tx] = line.split('|');
        return { iface, rxBytes: parseInt(rx) || 0, txBytes: parseInt(tx) || 0 };
      });
  }

  /**
   * Liest Uptime aus /proc/uptime.
   */
  private static async getUptime(host: any): Promise<{ days: number; hours: number; minutes: number }> {
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
  private static async getOsInfo(host: any): Promise<{ name: string; version: string }> {
    let out = '';
    try {
      out = await this.execute(host, `grep -E '^(PRETTY_NAME|NAME|VERSION_ID)=' /etc/os-release`);
    } catch {
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
  public static async getMetrics(hostId: string): Promise<SystemMetrics> {
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
  public static async getTopProcesses(hostId: string, limit: number = 10): Promise<ProcessInfo[]> {
    const host = await this.getHost(hostId);
    const count = limit + 1;
    const out = await this.execute(
      host,
      `ps -eo pid,user,pcpu,pmem,comm --sort=-pcpu | head -${count}`
    );
    return out
      .trim()
      .split('\n')
      .slice(1)
      .filter(Boolean)
      .map((line: string) => {
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
  public static async storeMetricSnapshot(hostId: string): Promise<void> {
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
    } catch {
      // Metriken im Fehlerfall nicht speichern (Host offline etc.)
    }
  }

  /**
   * Liefert den Metrik-Verlauf eines Hosts (aufsteigend nach Zeit).
   */
  public static async getMetricHistory(hostId: string, minutes: number = 60): Promise<any[]> {
    const since = new Date(Date.now() - minutes * 60 * 1000);
    return await prisma.systemMetricHistory.findMany({
      where: { hostId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
