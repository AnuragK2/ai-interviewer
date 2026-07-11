-- Phase 8: idempotent event consumers + tenant audit log

CREATE TABLE IF NOT EXISTS "ProcessedEvent" (
    "id" TEXT NOT NULL,
    "consumerName" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedEvent_consumerName_eventId_key"
  ON "ProcessedEvent"("consumerName", "eventId");

CREATE INDEX IF NOT EXISTS "ProcessedEvent_processedAt_idx" ON "ProcessedEvent"("processedAt");

CREATE TABLE IF NOT EXISTS "TenantAuditLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorEmail" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "TenantAuditLog_companyId_createdAt_idx"
  ON "TenantAuditLog"("companyId", "createdAt");
