import { PrismaClient } from "../../../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { env } from "../../config/env";

const pool = new pg.Pool({
  connectionString: env.databaseUrl,
});

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});
