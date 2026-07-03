import cors from "cors";
import express from "express";
import multer from "multer";
import { z } from "zod";
import { isAllowedResumeFile, parseResumeFile } from "./lib/parseResume";
import { fetchGithubRepos, toGithubRepoSummary } from "./lib/github";
import type { PreInterviewResponse } from "./types";
import { prisma } from "./db";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const githubUrlSchema = z.url();

app.use(cors());
app.use(express.json());

app.post("/api/v1/pre-interview", upload.single("resume"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Resume file is required." });
    }

    if (!isAllowedResumeFile(file.mimetype, file.originalname)) {
      return res.status(400).json({ error: "Unsupported file type. Upload a PDF, DOCX, or TXT file." });
    }

    const githubUrlResult = githubUrlSchema.safeParse(req.body.githubUrl);
    if (!githubUrlResult.success) {
      return res.status(400).json({ error: "A valid GitHub profile URL is required." });
    }

    const profileUrl = githubUrlResult.data.replace(/\/$/, "");
    const username = profileUrl.split("/").pop();
    if (!username) {
      return res.status(400).json({ error: "Could not parse GitHub username from URL." });
    }

    const [resume, githubRepos] = await Promise.all([
      parseResumeFile(file.buffer, file.mimetype, file.originalname),
      fetchGithubRepos(username),
    ]);

    const github = {
      username,
      profileUrl,
      repos: toGithubRepoSummary(githubRepos),
    };

    const interview = await prisma.interview.create({
      data: {
        githubMetaData: github,
        resume,
        status: "PENDING",
      },
    });

    const response: PreInterviewResponse = {
      interview: {
        id: interview.id,
        status: interview.status,
        score: interview.score,
        createdAt: interview.createdAt.toISOString(),
      },
      resume,
      github,
    };

    return res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to prepare interview.";
    return res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT) || 3001;

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
