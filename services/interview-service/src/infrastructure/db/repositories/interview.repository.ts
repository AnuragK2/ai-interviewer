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
    return prisma.interview.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });
  },

  complete(id: string, score: number, endReason?: string) {
    return prisma.interview.update({
      where: { id },
      data: {
        status: "COMPLETED",
        score,
        endReason: endReason ?? "completed",
        endedAt: new Date(),
      },
    });
  },

  cancel(id: string, score: number, endReason?: string) {
    return prisma.interview.update({
      where: { id },
      data: {
        status: "CANCELLED",
        score,
        endReason: endReason ?? "cheat",
        endedAt: new Date(),
      },
    });
  },

  fail(id: string, score: number, endReason?: string) {
    return prisma.interview.update({
      where: { id },
      data: {
        status: "FAILED",
        score,
        endReason: endReason ?? "error",
        endedAt: new Date(),
      },
    });
  },
};
