-- Eigenständige Cluster-API-Key-Generierung:
-- Ungebundene Keys (ohne Node) dürfen noch keinen Namen/Endpoint haben.
-- Sie werden erst vervollständigt, wenn sich ein Node mit dem Key verbindet.
ALTER TABLE "ClusterNode" ALTER COLUMN "name" DROP NOT NULL;
ALTER TABLE "ClusterNode" ALTER COLUMN "endpoint" DROP NOT NULL;
