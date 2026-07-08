import { UpdateCandidateProfileSchema } from "@ai-interviewer/api-types";
import { Router } from "express";
import {
  enrichGithubProfile,
  getMyProfile,
  getResumeDownload,
  ProfileError,
  updateMyProfile,
  uploadResume,
} from "../../../application/profile/profile.service";
import type { AuthenticatedRequest } from "../middleware/auth.middleware";
import { requireCandidateAuth } from "../middleware/auth.middleware";
import { resumeUpload } from "../middleware/upload.middleware";

export const profileRouter = Router();

profileRouter.use(requireCandidateAuth);

profileRouter.get("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await getMyProfile(req.auth!.sub, req.auth!.email);
    res.json({ profile });
  } catch (error) {
    handleProfileError(res, error);
  }
});

profileRouter.patch("/me", async (req: AuthenticatedRequest, res) => {
  try {
    const body = UpdateCandidateProfileSchema.parse(req.body);
    const profile = await updateMyProfile(req.auth!.sub, req.auth!.email, body);
    res.json({ profile });
  } catch (error) {
    handleProfileError(res, error);
  }
});

profileRouter.post("/me/resume", resumeUpload.single("resume"), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Resume file is required." });
      return;
    }

    let manualFields;
    if (typeof req.body.profile === "string" && req.body.profile.trim()) {
      manualFields = UpdateCandidateProfileSchema.parse(JSON.parse(req.body.profile));
    }

    const profile = await uploadResume(
      req.auth!.sub,
      req.auth!.email,
      {
        buffer: req.file.buffer,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
      },
      manualFields,
    );

    res.json({ profile });
  } catch (error) {
    handleProfileError(res, error);
  }
});

profileRouter.get("/me/resume/download", async (req: AuthenticatedRequest, res) => {
  try {
    const download = await getResumeDownload(req.auth!.sub);
    res.json(download);
  } catch (error) {
    handleProfileError(res, error);
  }
});

profileRouter.post("/me/github/enrich", async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await enrichGithubProfile(req.auth!.sub, req.auth!.email);
    res.json({ profile });
  } catch (error) {
    handleProfileError(res, error);
  }
});

function handleProfileError(res: import("express").Response, error: unknown) {
  if (error instanceof ProfileError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error && typeof error === "object" && "issues" in error) {
    res.status(400).json({ error: "Invalid request body." });
    return;
  }

  console.error("[profile]", error);
  res.status(500).json({ error: "Internal server error." });
}
