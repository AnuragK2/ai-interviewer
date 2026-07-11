import {
  CreateJobRequestSchema,
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
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
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

jobsRouter.post("/", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = CreateJobRequestSchema.parse(req.body);
    const job = await createJob(body, { userId: req.auth!.sub, companyId: req.auth!.companyId! });
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
    const job = await updateJob(jobId, body, { companyId: req.auth!.companyId! });
    res.json({ job });
  } catch (error) {
    handleJobRouteError(res, error);
  }
});

function handleJobRouteError(res: import("express").Response, error: unknown) {
  if (error instanceof JobError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error && typeof error === "object" && "issues" in error) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  console.error("[jobs]", error);
  res.status(500).json({ error: "Internal server error." });
}

