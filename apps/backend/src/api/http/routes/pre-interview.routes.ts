import { Router } from "express";
import { preInterviewService } from "../../../application/pre-interview/pre-interview.service";
import { isAllowedResumeFile } from "../../../infrastructure/resume/resume.parser";
import { resumeUpload } from "../middleware/upload.middleware";

export const preInterviewRouter = Router();

preInterviewRouter.post("/", resumeUpload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Resume file is required." });
    }

    if (!isAllowedResumeFile(file.mimetype, file.originalname)) {
      return res.status(400).json({ error: "Unsupported file type. Upload a PDF, DOCX, or TXT file." });
    }

    const githubUrlResult = preInterviewService.parseGithubUrl(req.body.githubUrl);
    if (!githubUrlResult.success) {
      return res.status(400).json({ error: "A valid GitHub profile URL is required." });
    }

    const response = await preInterviewService.createInterview(
      file.buffer,
      file.mimetype,
      file.originalname,
      githubUrlResult.data,
    );

    return res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare interview.";
    return res.status(500).json({ error: message });
  }
});
