ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "endReason" TEXT;
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "InterviewReport" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "gaps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "communication" INTEGER NOT NULL,
    "technicalDepth" INTEGER NOT NULL,
    "roleFit" INTEGER NOT NULL,
    "clarity" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InterviewReport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "InterviewReport_interviewId_key" ON "InterviewReport"("interviewId");

CREATE TYPE "ProctoringAssetType" AS ENUM ('SNAPSHOT', 'RECORDING');

CREATE TABLE IF NOT EXISTS "ProctoringAsset" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "type" "ProctoringAssetType" NOT NULL,
    "objectKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "signal" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProctoringAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProctoringAsset_interviewId_idx" ON "ProctoringAsset"("interviewId");

ALTER TABLE "InterviewReport" ADD CONSTRAINT "InterviewReport_interviewId_fkey"
  FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProctoringAsset" ADD CONSTRAINT "ProctoringAsset_interviewId_fkey"
  FOREIGN KEY ("interviewId") REFERENCES "Interview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
