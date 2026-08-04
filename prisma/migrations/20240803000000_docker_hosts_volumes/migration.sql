-- AlterEnum
ALTER TYPE "StorageType" ADD VALUE 'DOCKER_VOLUME';

-- AlterTable
ALTER TABLE "Host" ADD COLUMN "isLocal" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "DockerContainer" ADD COLUMN "hostId" TEXT,
ADD COLUMN "mountPath" TEXT NOT NULL DEFAULT '/data';

-- AlterTable
ALTER TABLE "DockerComposeProject" ADD COLUMN "hostId" TEXT;

-- AddForeignKey
ALTER TABLE "DockerContainer" ADD CONSTRAINT "DockerContainer_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DockerComposeProject" ADD CONSTRAINT "DockerComposeProject_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed: lokaler Docker-Host (Panel-Rechner), wird vom Backend beim Start geprüft/aktualisiert
INSERT INTO "Host" ("id", "name", "ip", "port", "username", "osType", "capabilities", "status", "isLocal", "createdAt", "updatedAt")
VALUES ('local-docker-host', 'Docker Host (Panel)', '127.0.0.1', 22, 'local', 'docker', ARRAY['DOCKER']::"HypervisorType"[], 'ONLINE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("ip") DO NOTHING;