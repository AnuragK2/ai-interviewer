ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "applicationId" TEXT;
ALTER TABLE "Interview" ADD COLUMN IF NOT EXISTS "applicationContext" JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS "Interview_applicationId_key" ON "Interview"("applicationId");
