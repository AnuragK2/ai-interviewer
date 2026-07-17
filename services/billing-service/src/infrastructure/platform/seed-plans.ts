import "dotenv/config";
import { ensurePlansSeeded } from "../../application/billing/billing.service";

await ensurePlansSeeded();
console.log("[billing-service] Plans seeded.");
process.exit(0);
