import http from "node:http";
import cors from "cors";
import express from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "./db";
import { fetchGithubRepos, toGithubRepoSummary } from "./lib/github";
import { attachInterviewWebSocketServer } from "./lib/interviewWsServer";
import { isAllowedResumeFile, parseResumeFile } from "./lib/parseResume";
import type { ParsedResume } from "./lib/extractResumeFields";
import type { InterviewResultsResponse, PreInterviewResponse } from "./types";

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

app.get("/api/v1/interview/:id/results", async (req, res) => {
  try {
    const interview = await prisma.interview.findUnique({
      where: { id: req.params.id },
      include: {
        conversations: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!interview) {
      return res.status(404).json({ error: "Interview not found." });
    }

    if (interview.status !== "COMPLETED") {
      return res.status(400).json({
        error: "Interview results are not available yet.",
        status: interview.status,
      });
    }

    const resume = (interview.resume ?? {}) as ParsedResume;
    const github = (interview.githubMetaData ?? {}) as { username?: string };
    const userMessages = interview.conversations.filter((m) => m.participant === "User");
    const assistantMessages = interview.conversations.filter((m) => m.participant === "Assistant");
    const durationMs = interview.updatedAt.getTime() - interview.createdAt.getTime();

    const response: InterviewResultsResponse = {
      interview: {
        id: interview.id,
        status: interview.status,
        score: interview.score,
        createdAt: interview.createdAt.toISOString(),
        updatedAt: interview.updatedAt.toISOString(),
      },
      candidate: {
        name: resume.name ?? null,
        githubUsername: github.username ?? null,
      },
      stats: {
        userMessages: userMessages.length,
        assistantMessages: assistantMessages.length,
        durationMinutes: Math.max(1, Math.round(durationMs / 60_000)),
      },
      messages: interview.conversations.map((message) => ({
        id: message.id,
        participant: message.participant,
        message: message.message,
        createdAt: message.createdAt.toISOString(),
      })),
    };

    return res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load interview results.";
    return res.status(500).json({ error: message });
  }
});

const port = Number(process.env.PORT) || 3001;
const server = http.createServer(app);

attachInterviewWebSocketServer(server);

server.listen(port, () => {
  console.log(`Backend running on port ${port}`);
  console.log(`Interview WebSocket available at ws://localhost:${port}/api/v1/interview/ws`);
});
