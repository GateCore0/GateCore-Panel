-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "HypervisorType" AS ENUM ('DOCKER', 'PODMAN', 'LXC', 'VM_KVM', 'ALL_IN_ONE');

-- CreateEnum
CREATE TYPE "StorageType" AS ENUM ('ISO', 'DOCKER_IMAGE', 'LXC_TEMPLATE', 'PODMAN_IMAGE', 'DOCKER_COMPOSE', 'VM_DISK');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "isLdap" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LdapConfig" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT NOT NULL,
    "bindDn" TEXT NOT NULL,
    "bindPassword" TEXT NOT NULL,
    "searchBase" TEXT NOT NULL,
    "userFilter" TEXT NOT NULL DEFAULT '(sAMAccountName={{username}})',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LdapConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Host" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 22,
    "username" TEXT NOT NULL DEFAULT 'root',
    "sshKeyPath" TEXT,
    "osType" TEXT NOT NULL,
    "capabilities" "HypervisorType"[],
    "status" TEXT NOT NULL DEFAULT 'OFFLINE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Host_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClusterNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DISCONNECTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClusterNode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoragePool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "StorageType" NOT NULL,
    "path" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoragePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ZFSPool" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "raidLevel" TEXT NOT NULL,
    "disks" TEXT[],
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ZFSPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VM" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vcpus" INTEGER NOT NULL,
    "memoryMB" INTEGER NOT NULL,
    "diskSizeGB" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STOPPED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LXCContainer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "memoryMB" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STOPPED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LXCContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PodmanContainer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STOPPED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PodmanContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DockerContainer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STOPPED',
    "volumeName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DockerContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DockerComposeProject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'STOPPED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DockerComposeProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HardwarePassthrough" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "guestType" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HardwarePassthrough_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Host_ip_key" ON "Host"("ip");

-- CreateIndex
CREATE UNIQUE INDEX "ClusterNode_apiKey_key" ON "ClusterNode"("apiKey");

-- AddForeignKey
ALTER TABLE "StoragePool" ADD CONSTRAINT "StoragePool_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZFSPool" ADD CONSTRAINT "ZFSPool_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VM" ADD CONSTRAINT "VM_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LXCContainer" ADD CONSTRAINT "LXCContainer_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PodmanContainer" ADD CONSTRAINT "PodmanContainer_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HardwarePassthrough" ADD CONSTRAINT "HardwarePassthrough_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;