import { Router } from "express";
import {
  interviewResultsService,
  ResultsNotReadyError,
} from "../../../application/interview/interview-results.service";

export const interviewResultsRouter = Router();

interviewResultsRouter.get("/:id/results", async (req, res) => {
  try {
    const results = await interviewResultsService.getResults(req.params.id);

    if (!results) {
      return res.status(404).json({ error: "Interview not found." });
    }

    return res.json(results);
  } catch (error) {
    if (error instanceof ResultsNotReadyError) {
      return res.status(400).json({
        error: error.message,
        status: error.status,
      });
    }

    const message = error instanceof Error ? error.message : "Failed to load interview results.";
    return res.status(500).json({ error: message });
  }
});
