import { Router } from "express";
import {
  InterviewMediaError,
  storeInterviewRecording,
  storeProctoringSnapshot,
} from "../../../application/interview/interview-media.service";
import { getInterviewFeedback } from "../../../application/interview/interview-feedback.service";
import { interviewMediaUpload } from "../middleware/upload.middleware";

export const interviewMediaRouter = Router();

function getRouteParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}

interviewMediaRouter.get("/:id/feedback", async (req, res) => {
  try {
    const interviewId = getRouteParam(req.params.id);
    if (!interviewId) {
      return res.status(400).json({ error: "Interview id is required." });
    }

    const feedback = await getInterviewFeedback(interviewId);
    if (!feedback) {
      return res.status(404).json({ error: "Interview not found." });
    }
    return res.json(feedback);
  } catch (error) {
    console.error("[interview-feedback]", error);
    return res.status(500).json({ error: "Failed to load interview feedback." });
  }
});

interviewMediaRouter.post("/:id/recording", interviewMediaUpload.single("recording"), async (req, res) => {
  try {
    const interviewId = getRouteParam(req.params.id);
    if (!interviewId) {
      return res.status(400).json({ error: "Interview id is required." });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Recording file is required." });
    }

    const asset = await storeInterviewRecording(interviewId, req.file);
    return res.status(201).json({
      asset: {
        id: asset.id,
        type: asset.type,
        capturedAt: asset.capturedAt.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof InterviewMediaError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[interview-recording]", error);
    return res.status(500).json({ error: "Failed to store recording." });
  }
});

interviewMediaRouter.post(
  "/:id/proctoring-snapshot",
  interviewMediaUpload.single("snapshot"),
  async (req, res) => {
    try {
      const interviewId = getRouteParam(req.params.id);
      if (!interviewId) {
        return res.status(400).json({ error: "Interview id is required." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Snapshot file is required." });
      }

      const signal = typeof req.body?.signal === "string" ? req.body.signal : null;
      const asset = await storeProctoringSnapshot(interviewId, req.file, signal);
      return res.status(201).json({
        asset: {
          id: asset.id,
          type: asset.type,
          signal: asset.signal,
          capturedAt: asset.capturedAt.toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof InterviewMediaError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error("[proctoring-snapshot]", error);
      return res.status(500).json({ error: "Failed to store proctoring snapshot." });
    }
  },
);
