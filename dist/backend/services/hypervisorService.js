"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HypervisorService = void 0;
const sshService_1 = require("./sshService");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class HypervisorService {
    /**
     * ZFS Pool verwalten & erstellen
     */
    static async createZFSPool(hostId, poolName, raidLevel, disks) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found or SSH key missing');
        let cmd = `zpool create ${poolName}`;
        if (raidLevel !== 'stripe') {
            cmd += ` ${raidLevel}`;
        }
        cmd += ` ${disks.join(' ')}`;
        const output = await sshService_1.SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
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
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found');
        let cmd = `mkfs.${fsType} ${devicePath} -F`;
        if (fsType === 'zfs') {
            cmd = `zpool create -f pool_${Date.now()} ${devicePath}`;
        }
        return await sshService_1.SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
    }
    /**
     * Hardware Passthrough Abfrage (PCIe & USB)
     */
    static async listHardwareDevices(hostId) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found');
        const pciOutput = await sshService_1.SSHService.executeCommand(host.ip, 'lspci', host.sshKeyPath);
        const usbOutput = await sshService_1.SSHService.executeCommand(host.ip, 'lsusb', host.sshKeyPath);
        return {
            pci: pciOutput.split('\n').filter(Boolean),
            usb: usbOutput.split('\n').filter(Boolean),
        };
    }
    /**
     * LXC Container erstellen
     */
    static async createLXCContainer(hostId, name, template, memoryMB, storagePath) {
        const host = await prisma.host.findUnique({ where: { id: hostId } });
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found');
        const cmd = `lxc-create -n ${name} -t ${template} -- dir=${storagePath}`;
        await sshService_1.SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
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
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found');
        const diskImg = `${storagePath}/${name}.qcow2`;
        const createDiskCmd = `qemu-img create -f qcow2 ${diskImg} ${diskSizeGB}G`;
        await sshService_1.SSHService.executeCommand(host.ip, createDiskCmd, host.sshKeyPath);
        const virtInstallCmd = `virt-install --name ${name} --ram ${memoryMB} --vcpus ${vcpus} --disk path=${diskImg} --import --noautoconsole --graphics vnc`;
        await sshService_1.SSHService.executeCommand(host.ip, virtInstallCmd, host.sshKeyPath);
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
        if (!host || !host.sshKeyPath)
            throw new Error('Host not found');
        const cmd = `podman run -d --name ${name} ${image}`;
        await sshService_1.SSHService.executeCommand(host.ip, cmd, host.sshKeyPath);
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
