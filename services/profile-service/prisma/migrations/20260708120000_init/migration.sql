-- CreateTable
CREATE TABLE "CandidateProfile" (
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "skills" JSONB NOT NULL DEFAULT '[]',
    "experience" JSONB NOT NULL DEFAULT '[]',
    "education" JSONB NOT NULL DEFAULT '[]',
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "links" JSONB NOT NULL DEFAULT '{}',
    "resumeObjectKey" TEXT,
    "resumeFileName" TEXT,
    "resumeMimeType" TEXT,
    "resumeText" TEXT,
    "parsedResume" JSONB NOT NULL DEFAULT '{}',
    "githubMeta" JSONB NOT NULL DEFAULT '{}',
    "profileCompleteness" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("userId")
);
