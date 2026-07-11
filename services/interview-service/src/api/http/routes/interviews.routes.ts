import { CreateInterviewFromApplicationSchema } from "@ai-interviewer/api-types";
import { Router } from "express";
import { createInterviewFromApplication } from "../../../application/interviews/interview-from-application.service";

export const interviewsRouter = Router();

interviewsRouter.post("/from-application", async (req, res) => {
  try {
    const body = CreateInterviewFromApplicationSchema.parse(req.body);
    const result = await createInterviewFromApplication(body);
    res.status(201).json(result);
  } catch (error) {
    if (error && typeof error === "object" && "issues" in error) {
      res.status(400).json({ error: "Invalid request body." });
      return;
    }

    console.error("[interviews]", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
