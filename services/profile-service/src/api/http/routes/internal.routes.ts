import { Router } from "express";
import { ProfileError, getResumeDownload } from "../../../application/profile/profile.service";
import { env } from "../../../config/env";

export const internalRouter = Router();

internalRouter.get("/candidates/:userId/resume/download", async (req, res) => {
  const serviceKey = req.headers["x-internal-service-key"];
  if (!serviceKey || serviceKey !== env.internalServiceKey) {
    res.status(401).json({ error: "Unauthorized internal request." });
    return;
  }

  const userId = typeof req.params.userId === "string" ? req.params.userId : null;
  if (!userId) {
    res.status(400).json({ error: "Invalid candidate id." });
    return;
  }

  try {
    const download = await getResumeDownload(userId);
    res.json(download);
  } catch (error) {
    if (error instanceof ProfileError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    console.error("[internal-resume]", error);
    res.status(500).json({ error: "Failed to generate resume download." });
  }
});
