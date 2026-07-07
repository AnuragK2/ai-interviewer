import { Router } from "express";
import { listCompanies } from "../../../application/auth/auth.service";

export const companiesRouter = Router();

companiesRouter.get("/", async (_req, res) => {
  try {
    const companies = await listCompanies();
    res.json({ companies });
  } catch (error) {
    console.error("[companies]", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
