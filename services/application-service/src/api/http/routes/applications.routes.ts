import { ApplyToJobRequestSchema } from "@ai-interviewer/api-types";
import { Router } from "express";
import {
  applyToJob,
  ApplicationError,
  getCandidateApplication,
  getInterviewAccess,
  getRecruiterApplicationPacket,
  inviteToInterview,
  listCandidateApplications,
  listRecruiterApplicationsForJob,
  markInterviewPending,
} from "../../../application/applications/application.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { requireCandidateAuth, requireRecruiterAuth } from "../middleware/auth.middleware";

export const applicationsRouter = Router();

function getRouteParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

applicationsRouter.post("/", requireCandidateAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const body = ApplyToJobRequestSchema.parse(req.body);
    const token = req.headers.authorization!.slice("Bearer ".length);
    const created = await applyToJob(body, { candidateUserId: req.auth!.sub, accessToken: token });
    res.status(201).json({ application: created });
  } catch (error) {
    handleApplicationsRouteError(res, error);
  }
});

applicationsRouter.get("/me", requireCandidateAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await listCandidateApplications(req.auth!.sub);
    res.json(result);
  } catch (error) {
    handleApplicationsRouteError(res, error);
  }
});

applicationsRouter.get("/me/by-interview/:interviewId", requireCandidateAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const interviewId = getRouteParam(req.params.interviewId);
    if (!interviewId) {
      res.status(400).json({ error: "Invalid interview id." });
      return;
    }

    const result = await getInterviewAccess(interviewId, req.auth!.sub);
    res.json(result);
  } catch (error) {
    handleApplicationsRouteError(res, error);
  }
});

applicationsRouter.get("/:id", requireCandidateAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const applicationId = getRouteParam(req.params.id);
    if (!applicationId) {
      res.status(400).json({ error: "Invalid application id." });
      return;
    }

    const result = await getCandidateApplication(applicationId, req.auth!.sub);
    res.json(result);
  } catch (error) {
    handleApplicationsRouteError(res, error);
  }
});

applicationsRouter.post("/:id/start-interview", requireCandidateAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const applicationId = getRouteParam(req.params.id);
    if (!applicationId) {
      res.status(400).json({ error: "Invalid application id." });
      return;
    }

    const application = await markInterviewPending(applicationId, req.auth!.sub);
    res.json({ application });
  } catch (error) {
    handleApplicationsRouteError(res, error);
  }
});

applicationsRouter.get(
  "/_recruiter/job/:jobId",
  requireRecruiterAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const jobId = getRouteParam(req.params.jobId);
      if (!jobId) {
        res.status(400).json({ error: "Invalid job id." });
        return;
      }

      const result = await listRecruiterApplicationsForJob(jobId, { companyId: req.auth!.companyId! });
      res.json(result);
    } catch (error) {
      handleApplicationsRouteError(res, error);
    }
  },
);

applicationsRouter.get("/_recruiter/:id", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const applicationId = getRouteParam(req.params.id);
    if (!applicationId) {
      res.status(400).json({ error: "Invalid application id." });
      return;
    }

    const result = await getRecruiterApplicationPacket(applicationId, { companyId: req.auth!.companyId! });
    res.json(result);
  } catch (error) {
    handleApplicationsRouteError(res, error);
  }
});

applicationsRouter.post("/_recruiter/:id/invite", requireRecruiterAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const applicationId = getRouteParam(req.params.id);
    if (!applicationId) {
      res.status(400).json({ error: "Invalid application id." });
      return;
    }

    const application = await inviteToInterview(applicationId, { companyId: req.auth!.companyId! });
    res.status(201).json({ application });
  } catch (error) {
    handleApplicationsRouteError(res, error);
  }
});

function handleApplicationsRouteError(res: import("express").Response, error: unknown) {
  if (error instanceof ApplicationError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error && typeof error === "object" && "issues" in error) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  console.error("[applications]", error);
  res.status(500).json({ error: "Internal server error." });
}

