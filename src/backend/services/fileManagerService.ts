import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PrismaClient } from '@prisma/client';
import { SSHService } from './sshService';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export class FileManagerService {
  /**
   * Host Dateisystem verwalten (lokal oder remote per SSH)
   */
  public static async listHostFiles(dirPath: string, hostId?: string) {
    if (hostId) {
      const host = await prisma.host.findUnique({ where: { id: hostId } });
      if (!host || !host.sshKeyPath) throw new Error('Host not found or SSH key missing');

      const safePath = JSON.stringify(dirPath.startsWith('/') ? dirPath : `~/${dirPath}`);
      const stdout = await SSHService.executeCommand(
        host.ip,
        `ls -la ${safePath} --time-style=long-iso`,
        host.sshKeyPath
      );

      return stdout
        .split('\n')
        .filter((line) => line && !line.startsWith('total') && !line.startsWith('insgesamt'))
        .map((line) => {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 8) return null;
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

  public static async readFileContent(filePath: string, hostId?: string) {
    if (hostId) {
      const host = await prisma.host.findUnique({ where: { id: hostId } });
      if (!host || !host.sshKeyPath) throw new Error('Host not found or SSH key missing');
      return await SSHService.executeCommand(host.ip, `cat ${JSON.stringify(filePath)}`, host.sshKeyPath);
    }
    return fs.readFileSync(path.resolve(filePath), 'utf8');
  }

  public static async saveFileContent(filePath: string, content: string, hostId?: string) {
    if (hostId) {
      const host = await prisma.host.findUnique({ where: { id: hostId } });
      if (!host || !host.sshKeyPath) throw new Error('Host not found or SSH key missing');
      await SSHService.executeCommand(
        host.ip,
        `mkdir -p $(dirname ${JSON.stringify(filePath)}) && cat > ${JSON.stringify(filePath)} << 'GATECORE_EOF'\n${content}\nGATECORE_EOF`,
        host.sshKeyPath
      );
      return { success: true };
    }
    fs.writeFileSync(path.resolve(filePath), content, 'utf8');
    return { success: true };
  }

  public static async deleteHostFile(filePath: string, hostId?: string) {
    if (hostId) {
      const host = await prisma.host.findUnique({ where: { id: hostId } });
      if (!host || !host.sshKeyPath) throw new Error('Host not found or SSH key missing');
      await SSHService.executeCommand(host.ip, `rm -rf ${JSON.stringify(filePath)}`, host.sshKeyPath);
      return { success: true };
    }
    const target = path.resolve(filePath);
    if (fs.lstatSync(target).isDirectory()) {
      fs.rmSync(target, { recursive: true, force: true });
    } else {
      fs.unlinkSync(target);
    }
    return { success: true };
  }

  /**
   * Host-Dateisystem auf dem Docker-Rechner verwalten
   * Nutzt einen schlanken Agent-Container (gatecore-host-access), der "/" des Hosts rw mountet.
   */
  private static async ensureLocalHostAccess() {
    const { stdout } = await execAsync(
      `docker inspect gatecore-host-access --format '{{.State.Running}}' 2>/dev/null || true`
    ).catch(() => ({ stdout: '' }));
    if (stdout.trim() !== 'true') {
      await execAsync(`docker rm -f gatecore-host-access 2>/dev/null || true`);
      await execAsync(
        `docker run -d --name gatecore-host-access --restart unless-stopped -v /:/host docker.io/alpine:latest sleep infinity`
      );
    }
    await execAsync(`timeout 60 docker exec gatecore-host-access test -d /host 2>/dev/null || true`).catch(() => {});
  }

  public static async listLocalHostFiles(dirPath: string) {
    await this.ensureLocalHostAccess();
    const hostPath = dirPath === '/' ? '/host' : `/host${dirPath}`;
    const safePath = JSON.stringify(hostPath);
    const { stdout, stderr } = await execAsync(
      `docker exec gatecore-host-access ls -la ${safePath} --time-style=long-iso 2>/dev/null || docker exec gatecore-host-access ls -la ${safePath}`
    );
    if (stderr && !stdout) throw new Error(stderr);

    return stdout
      .split('\n')
      .filter((line) => line && !line.startsWith('total') && !line.startsWith('insgesamt'))
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 8) return null;
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

  public static async readLocalHostFile(filePath: string) {
    await this.ensureLocalHostAccess();
    const { stdout, stderr } = await execAsync(
      `docker exec gatecore-host-access cat ${JSON.stringify(`/host${filePath}`)}`
    );
    if (stderr && !stdout) throw new Error(stderr);
    return stdout;
  }

  public static async saveLocalHostFile(filePath: string, content: string) {
    await this.ensureLocalHostAccess();
    const tmpFile = `/tmp/gatecore_tmp_${Date.now()}`;
    fs.writeFileSync(tmpFile, content, 'utf8');
    try {
      await execAsync(`docker cp ${tmpFile} gatecore-host-access:/tmp/gatecore_tmp_file`);
      const hostTarget = JSON.stringify(`/host${filePath}`);
      await execAsync(
        `docker exec gatecore-host-access sh -c "mkdir -p $(dirname ${hostTarget}) && cp /tmp/gatecore_tmp_file ${hostTarget}"`
      );
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
    return { success: true };
  }

  public static async deleteLocalHostFile(filePath: string) {
    await this.ensureLocalHostAccess();
    const { stderr } = await execAsync(
      `docker exec gatecore-host-access rm -rf ${JSON.stringify(`/host${filePath}`)}`
    );
    if (stderr) throw new Error(stderr);
    return { success: true };
  }

  /**
   * Docker Container Dateisystem auf dem lokalen Docker-Rechner verwalten (docker exec)
   */
  public static async listLocalDockerContainerFiles(container: string, dirPath: string) {
    const safePath = JSON.stringify(dirPath.startsWith('/') ? dirPath : `/${dirPath}`);
    const { stdout, stderr } = await execAsync(
      `docker exec ${container} ls -la ${safePath} --time-style=long-iso 2>/dev/null || docker exec ${container} ls -la ${safePath}`
    );
    if (stderr && !stdout) throw new Error(stderr);

    return stdout
      .split('\n')
      .filter((line) => line && !line.startsWith('total') && !line.startsWith('insgesamt'))
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 8) return null;
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

  public static async readLocalDockerContainerFile(container: string, filePath: string) {
    const { stdout, stderr } = await execAsync(`docker exec ${container} cat ${JSON.stringify(filePath)}`);
    if (stderr && !stdout) throw new Error(stderr);
    return stdout;
  }

  public static async saveLocalDockerContainerFile(container: string, filePath: string, content: string) {
    const tmpFile = `/tmp/gatecore_tmp_${Date.now()}`;
    fs.writeFileSync(tmpFile, content, 'utf8');
    try {
      await execAsync(`mkdir -p $(dirname ${JSON.stringify(filePath)}) && docker cp ${tmpFile} ${container}:${JSON.stringify(filePath)}`);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
    return { success: true };
  }

  public static async deleteLocalDockerContainerFile(container: string, filePath: string) {
    const { stderr } = await execAsync(`docker exec ${container} rm -rf ${JSON.stringify(filePath)}`);
    if (stderr) throw new Error(stderr);
    return { success: true };
  }

  /**
   * Docker Container Dateisystem auf einem Remote-Host verwalten (per SSH)
   */
  public static async listDockerContainerFiles(hostId: string, container: string, dirPath: string) {
    const host = await prisma.host.findUnique({ where: { id: hostId } });
    if (!host || !host.sshKeyPath) throw new Error('Host not found or SSH key missing');

    const safePath = JSON.stringify(dirPath.startsWith('/') ? dirPath : `/${dirPath}`);
    const stdout = await SSHService.executeCommand(
      host.ip,
      `docker exec ${container} ls -la ${safePath} --time-style=long-iso 2>/dev/null || docker exec ${container} ls -la ${safePath}`,
      host.sshKeyPath
    );

    return stdout
      .split('\n')
      .filter((line) => line && !line.startsWith('total') && !line.startsWith('insgesamt'))
      .map((line) => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 8) return null;
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

  public static async readDockerContainerFile(hostId: string, container: string, filePath: string) {
    const host = await prisma.host.findUnique({ where: { id: hostId } });
    if (!host || !host.sshKeyPath) throw new Error('Host not found or SSH key missing');
    return await SSHService.executeCommand(host.ip, `docker exec ${container} cat ${JSON.stringify(filePath)}`, host.sshKeyPath);
  }

  public static async saveDockerContainerFile(hostId: string, container: string, filePath: string, content: string) {
    const host = await prisma.host.findUnique({ where: { id: hostId } });
    if (!host || !host.sshKeyPath) throw new Error('Host not found or SSH key missing');
    await SSHService.executeCommand(
      host.ip,
      `mkdir -p $(dirname ${JSON.stringify(filePath)}) && cat > /tmp/gatecore_tmp_file << 'GATECORE_EOF'\n${content}\nGATECORE_EOF && docker cp /tmp/gatecore_tmp_file ${container}:${JSON.stringify(filePath)} && rm -f /tmp/gatecore_tmp_file`,
      host.sshKeyPath
    );
    return { success: true };
  }

  public static async deleteDockerContainerFile(hostId: string, container: string, filePath: string) {
    const host = await prisma.host.findUnique({ where: { id: hostId } });
    if (!host || !host.sshKeyPath) throw new Error('Host not found or SSH key missing');
    await SSHService.executeCommand(host.ip, `docker exec ${container} rm -rf ${JSON.stringify(filePath)}`, host.sshKeyPath);
    return { success: true };
  }

  /**
   * Docker Container Dateisystem verwalten (lokal)
   */
  public static async listContainerFiles(containerName: string, containerPath: string) {
    const { stdout } = await execAsync(`docker exec ${containerName} ls -la ${containerPath}`);
    return stdout;
  }

  public static async readContainerFile(containerName: string, containerPath: string) {
    const { stdout } = await execAsync(`docker exec ${containerName} cat ${containerPath}`);
    return stdout;
  }

  public static async copyFileToContainer(containerName: string, hostFilePath: string, containerDestPath: string) {
    await execAsync(`docker cp "${hostFilePath}" "${containerName}:${containerDestPath}"`);
    return { success: true };
  }

  public static async copyFileFromContainer(containerName: string, containerSrcPath: string, hostDestPath: string) {
    await execAsync(`docker cp "${containerName}:${containerSrcPath}" "${hostDestPath}"`);
    return { success: true };
  }
}