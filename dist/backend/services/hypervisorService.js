"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HypervisorService = void 0;
const sshService_1 = require("./sshService");
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const util_1 = require("util");
const prisma = new client_1.PrismaClient();
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class HypervisorService {
    /** Führt einen Befehl aus – lokal (exec) oder remote (SSH) */
    static async execute(host, cmd) {
        if (host.isLocal || host.ip === '127.0.0.1' || !host.sshKeyPath) {
            const { stdout } = await execAsync(cmd, { encoding: 'utf8' });
            return stdout;
        }
        return await sshService_1.SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
    }
    /**
     * ZFS Pool verwalten & erstellen
     */
    static async createZFSPool(hostId, poolName, raidLevel, disks) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || (host.ip !== '127.0.0.1' && !host.isLocal && !host.sshKeyPath))
            throw new Error('Host not found');
        let cmd = `zpool create ${poolName}`;
        if (raidLevel !== 'stripe') {
            cmd += ` ${raidLevel}`;
        }
        cmd += ` ${disks.join(' ')}`;
        const output = await this.execute(host, cmd);
        await prisma.zFSPool.create({
            data: {
                name: poolName,
                raidLevel,
                disks,
                hostId,
            },
        });
        return output;
    }
    /**
     * Disks formatieren
     */
    static async formatDisk(hostId, devicePath, fsType) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || (host.ip !== '127.0.0.1' && !host.isLocal && !host.sshKeyPath))
            throw new Error('Host not found');
        let cmd = `mkfs.${fsType} ${devicePath} -F`;
        if (fsType === 'zfs') {
            cmd = `zpool create -f pool_${Date.now()} ${devicePath}`;
        }
        return await this.execute(host, cmd);
    }
    /**
     * Hardware Passthrough Abfrage (PCIe & USB)
     * Primär lspci/lsusb, Fallback über /sys (funktioniert auch im Docker-Container mit /sys:/sys)
     */
    static async listHardwareDevices(hostId) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || (host.ip !== '127.0.0.1' && !host.isLocal && !host.sshKeyPath))
            throw new Error('Host not found');
        let pci = [];
        let usb = [];
        // --- PCIe: lspci oder /sys-Fallback ---
        try {
            const pciOutput = await this.execute(host, 'lspci 2>/dev/null');
            pci = pciOutput.split('\n').filter(Boolean);
        }
        catch {
            // Fallback: PCI-Geräte direkt aus /sys/bus/pci/devices lesen
            try {
                const pciOutput = await this.execute(host, `for d in /sys/bus/pci/devices/*/; do [ -e "$d/vendor" ] || continue; cls=$(cat "$d/class" 2>/dev/null || echo "000000"); dev=$(cat "$d/device" 2>/dev/null || echo "0000"); ven=$(cat "$d/vendor" 2>/dev/null || echo "0x0000"); name=$(basename "$d"); rev=$(cat "$d/revision" 2>/dev/null || echo "0x00"); echo "$name|$ven|$dev|$cls|$rev"; done`);
                pci = pciOutput.split('\n').filter((l) => l.includes('|')).map((l) => {
                    const [addr, vendor, device, cls, rev] = l.split('|');
                    return `${addr} [${vendor.replace('0x', '')}:${device.replace('0x', '')}] Class ${cls.slice(2, 4)} Rev ${rev.replace('0x', '')}`;
                });
            }
            catch {
                pci = [];
            }
        }
        // --- USB: lsusb oder /sys-Fallback ---
        try {
            const usbOutput = await this.execute(host, 'lsusb 2>/dev/null');
            usb = usbOutput.split('\n').filter(Boolean);
        }
        catch {
            // Fallback: USB-Geräte direkt aus /sys/bus/usb/devices lesen
            try {
                const usbOutput = await this.execute(host, `for d in /sys/bus/usb/devices/[0-9]*-*/; do [ -e "$d/idVendor" ] || continue; idv=$(cat "$d/idVendor" 2>/dev/null || echo "0000"); idp=$(cat "$d/idProduct" 2>/dev/null || echo "0000"); man=$(cat "$d/manufacturer" 2>/dev/null || echo ""); prod=$(cat "$d/product" 2>/dev/null || echo ""); echo "$idv:$idp|$man|$prod"; done`);
                usb = usbOutput.split('\n').filter((l) => l.includes('|')).map((l) => {
                    const [ids, man, prod] = l.split('|');
                    return `Bus Device ID ${ids} ${man ? man + ' ' : ''}${prod}`.trim();
                });
            }
            catch {
                usb = [];
            }
        }
        return { pci, usb };
    }
    /**
     * Listet alle Festplatten eines Hosts mit UUID, Größe, Modell & Seriennummer auf.
     * Liefert bei nicht verfügbarem lsblk (z.B. Container-Host) ein leeres Array.
     */
    static async listDisks(hostId) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || (host.ip !== '127.0.0.1' && !host.isLocal && !host.sshKeyPath))
            throw new Error('Host not found');
        // Unter Docker nutzen wir zuerst /proc/partitions, dann lsblk
        try {
            const output = await this.execute(host, `lsblk -o NAME,SIZE,TYPE,UUID,MODEL,SERIAL,MOUNTPOINTS -J 2>/dev/null || lsblk -o NAME,SIZE,TYPE,UUID,MODEL,SERIAL,MOUNTPOINT -J`);
            const parsed = JSON.parse(output);
            const devices = (parsed.blockdevices || []).filter((d) => d.type === 'disk' || d.type === 'part');
            return devices;
        }
        catch {
            // Fallback: /proc/partitions + /sys/block (funktioniert in Containern mit /sys:/sys und /dev:/dev)
            try {
                const devices = [];
                const output = await this.execute(host, `for d in /sys/block/*/; do [ -e "$d/dev" ] || continue; name=$(basename "$d"); case "$name" in loop*|ram*|sr*) continue;; esac; size=$(cat "$d/size" 2>/dev/null || echo 0); bytes=$((size * 512)); gb=$(awk -v b="$bytes" 'BEGIN { printf "%.1f", b/1024/1024/1024 }'); uuid=""; [ -e "/dev/disk/by-uuid" ] && uuid=$(lsblk -no UUID "/dev/$name" 2>/dev/null || true); echo "$name|$gb|$uuid"; done`);
                for (const line of output.split('\n')) {
                    if (!line.includes('|'))
                        continue;
                    const [name, sizeGB, uuid] = line.split('|');
                    devices.push({
                        name,
                        type: 'disk',
                        size: `${sizeGB}G`,
                        model: '',
                        serial: '',
                        uuid: uuid || null,
                        mountpoints: null,
                    });
                }
                return devices;
            }
            catch {
                return [];
            }
        }
    }
    /**
     * LXC Container erstellen
     */
    static async createLXCContainer(hostId, name, template, memoryMB, storagePath) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || (host.ip !== '127.0.0.1' && !host.isLocal && !host.sshKeyPath))
            throw new Error('Host not found');
        const cmd = `lxc-create -n ${name} -t ${template} -- dir=${storagePath}`;
        await this.execute(host, cmd);
        return await prisma.lXCContainer.create({
            data: {
                name,
                template,
                memoryMB,
                storagePath,
                hostId,
                status: 'RUNNING',
            },
        });
    }
    /**
     * VM (QEMU/KVM) erstellen
     */
    static async createVM(hostId, name, vcpus, memoryMB, diskSizeGB, storagePath) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || (host.ip !== '127.0.0.1' && !host.isLocal && !host.sshKeyPath))
            throw new Error('Host not found');
        const diskImg = `${storagePath}/${name}.qcow2`;
        const createDiskCmd = `qemu-img create -f qcow2 ${diskImg} ${diskSizeGB}G`;
        await this.execute(host, createDiskCmd);
        const virtInstallCmd = `virt-install --name ${name} --ram ${memoryMB} --vcpus ${vcpus} --disk path=${diskImg} --import --noautoconsole --graphics vnc`;
        await this.execute(host, virtInstallCmd);
        return await prisma.vM.create({
            data: {
                name,
                vcpus,
                memoryMB,
                diskSizeGB,
                storagePath,
                hostId,
                status: 'RUNNING',
            },
        });
    }
    /**
     * Podman Container erstellen
     */
    static async createPodmanContainer(hostId, name, image) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || (host.ip !== '127.0.0.1' && !host.isLocal && !host.sshKeyPath))
            throw new Error('Host not found');
        const cmd = `podman run -d --name ${name} ${image}`;
        await this.execute(host, cmd);
        return await prisma.podmanContainer.create({
            data: {
                name,
                image,
                hostId,
                status: 'RUNNING',
            },
        });
    }
}
exports.HypervisorService = HypervisorService;
