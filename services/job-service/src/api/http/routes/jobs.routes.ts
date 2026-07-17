import {
  CreateJobRequestSchema,
  GenerateJobDescriptionRequestSchema,
  UpdateJobRequestSchema,
  type JobStatus,
} from "@ai-interviewer/api-types";
import { Router } from "express";
import {
  createJob,
  getJobPublic,
  JobError,
  listJobsForRecruiter,
  listJobsPublic,
  updateJob,
} from "../../../application/jobs/job.service";
import { generateJobDescription } from "../../../application/jobs/job-description-generator.service";
import { listRecommendedJobsForCandidate } from "../../../application/jobs/job-recommendations.service";
import { assertRecruiterWritable, BillingGateError } from "../../../infrastructure/billing/billing-client";
import { prisma } from "../../../infrastructure/db/prisma.client";
import { env } from "../../../config/env";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { requireCandidateAuth } from "../middleware/candidate-auth.middleware";
import { requireRecruiterAuth } from "../middleware/auth.middleware";

export const jobsRouter = Router();

function getRouteParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

// Public browse endpoints (candidate portal uses these in Phase 3)
jobsRouter.get("/", async (req, res) => {
  try {
    const status =
      req.query.status === "OPEN" || req.query.status === "DRAFT" || req.query.status === "CLOSED"
        ? (req.query.status as JobStatus)
        : undefined;
    const companyId = typeof req.query.companyId === "string" ? req.query.companyId : undefined;
    const result = await listJobsPublic({ status, companyId });
    res.json(result);
  } catch (error) {
    handleJobRouteError(res, error);
  }
});

jobsRouter.get("/_candidate/recommended", requireCandidateAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const token = req.headers.authorization!.slice("Bearer ".length);
    const result = await listRecommendedJobsForCandidate(token);
    res.json(result);
  } catch (error) {
    handleJobRouteError(res, error);
  }
});

jobsRouter.get("/:id", async (req, res) => {
  try {
    const jobId = getRouteParam(req.params.id);
    if (!jobId) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }

    const job = await getJobPublic(jobId);
    res.json({ job });
  } catch (error) {
    handleJobRouteError(res, error);
  }
});

// Recruiter endpoints (tenant-scoped)
jobsRouter.get("/_recruiter/mine", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const jobs = await listJobsForRecruiter(req.auth!.companyId!);
    res.json(jobs);
  } catch (error) {
    handleJobRouteError(res, error);
  }
});

jobsRouter.post("/_recruiter/generate-description", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const openJobs = await prisma.job.count({
      where: { companyId: req.auth!.companyId!, status: "OPEN" },
    });
    await assertRecruiterWritable(req.auth!.companyId!, openJobs, "write");
    const body = GenerateJobDescriptionRequestSchema.parse(req.body);
    const generated = await generateJobDescription(body);
    res.json(generated);
  } catch (error) {
    handleJobRouteError(res, error);
  }
});

jobsRouter.post("/", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = CreateJobRequestSchema.parse(req.body);
    const job = await createJob(body, { userId: req.auth!.sub, companyId: req.auth!.companyId!, email: req.auth!.email });
    res.status(201).json({ job });
  } catch (error) {
    handleJobRouteError(res, error);
  }
});

jobsRouter.patch("/:id", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const jobId = getRouteParam(req.params.id);
    if (!jobId) {
      res.status(400).json({ error: "Invalid job id." });
      return;
    }

    const body = UpdateJobRequestSchema.parse(req.body);
    const job = await updateJob(jobId, body, {
      companyId: req.auth!.companyId!,
      userId: req.auth!.sub,
      email: req.auth!.email,
    });
    res.json({ job });
  } catch (error) {
    handleJobRouteError(res, error);
  }
});

jobsRouter.get("/_internal/open-count/:companyId", async (req, res) => {
  try {
    if (req.headers["x-internal-service-key"] !== env.internalServiceKey) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
    const companyId = getRouteParam(req.params.companyId);
    if (!companyId) {
      res.status(400).json({ error: "Invalid company id." });
      return;
    }
    const openJobs = await prisma.job.count({ where: { companyId, status: "OPEN" } });
    res.json({ companyId, openJobs });
  } catch (error) {
    handleJobRouteError(res, error);
  }
});

function handleJobRouteError(res: import("express").Response, error: unknown) {
  if (error instanceof JobError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof BillingGateError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      lockedReason: error.lockedReason ?? null,
    });
    return;
  }

  if (error && typeof error === "object" && "issues" in error) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  console.error("[jobs]", error);
  res.status(500).json({ error: "Internal server error." });
}

