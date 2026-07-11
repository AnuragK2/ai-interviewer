import { prisma } from "../prisma.client";

export const interviewReportRepository = {
  findByInterviewId(interviewId: string) {
    return prisma.interviewReport.findUnique({ where: { interviewId } });
  },

  create(data: {
    interviewId: string;
    narrative: string;
    recommendation: string;
    strengths: string[];
    gaps: string[];
    communication: number;
    technicalDepth: number;
    roleFit: number;
    clarity: number;
  }) {
    return prisma.interviewReport.create({ data });
  },
};
