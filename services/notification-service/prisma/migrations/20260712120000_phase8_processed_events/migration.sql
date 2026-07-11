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
