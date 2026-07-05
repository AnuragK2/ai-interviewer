import type { InterviewStatus } from "../../../../lib/generated/prisma/client";
import { prisma } from "../prisma.client";

export const interviewRepository = {
  findById(id: string) {
    return prisma.interview.findUnique({ where: { id } });
  },

  findByIdWithMessages(id: string) {
    return prisma.interview.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  },

  create(data: Parameters<typeof prisma.interview.create>[0]["data"]) {
    return prisma.interview.create({ data });
  },

  updateStatus(id: string, status: InterviewStatus, score?: number) {
    return prisma.interview.update({
      where: { id },
      data: { status, ...(score !== undefined ? { score } : {}) },
    });
  },

  markInProgress(id: string) {
    return this.updateStatus(id, "IN_PROGRESS");
  },

  complete(id: string, score: number) {
    return this.updateStatus(id, "COMPLETED", score);
  },

  cancel(id: string, score: number) {
    return this.updateStatus(id, "CANCELLED", score);
  },

  fail(id: string, score: number) {
    return this.updateStatus(id, "FAILED", score);
  },
};
