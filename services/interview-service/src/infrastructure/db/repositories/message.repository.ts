import { prisma } from "../prisma.client";

export const messageRepository = {
  create(interviewId: string, participant: "User" | "Assistant", message: string) {
    return prisma.message.create({
      data: { interviewId, participant, message: message.trim() },
    });
  },

  findByInterviewId(interviewId: string) {
    return prisma.message.findMany({
      where: { interviewId },
      select: { participant: true, message: true },
    });
  },
};
