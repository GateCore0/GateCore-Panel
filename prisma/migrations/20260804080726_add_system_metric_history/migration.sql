-- AlterTable
ALTER TABLE "DockerContainer" ALTER COLUMN "mountPath" DROP NOT NULL;

-- CreateTable
CREATE TABLE "SystemMetricHistory" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "cpuUsage" DOUBLE PRECISION NOT NULL,
    "ramUsedGB" DOUBLE PRECISION NOT NULL,
    "ramTotalGB" DOUBLE PRECISION NOT NULL,
    "diskUsedGB" DOUBLE PRECISION NOT NULL,
    "diskTotalGB" DOUBLE PRECISION NOT NULL,
    "networkRx" BIGINT NOT NULL DEFAULT 0,
    "networkTx" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemMetricHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemMetricHistory_hostId_createdAt_idx" ON "SystemMetricHistory"("hostId", "createdAt");

-- AddForeignKey
ALTER TABLE "SystemMetricHistory" ADD CONSTRAINT "SystemMetricHistory_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "Host"("id") ON DELETE CASCADE ON UPDATE CASCADE;
